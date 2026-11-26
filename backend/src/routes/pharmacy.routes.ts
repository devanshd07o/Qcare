import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma';
import { requireAuth, requireRole, AuthRequest } from '../middleware/auth';

const router = Router();

const dispenseSchema = z.object({
  prescriptionId: z.string().min(1),
  pharmacyName: z.string().min(2),
  medicationIds: z.array(z.string()).min(1),
  notes: z.string().optional(),
});

// POST /api/pharmacy/dispense
router.post('/dispense', requireAuth, requireRole('pharmacist'), async (req: AuthRequest, res: Response): Promise<void> => {
  const result = dispenseSchema.safeParse(req.body);
  if (!result.success) { res.status(400).json({ error: 'Validation failed', details: result.error.flatten() }); return; }

  const { prescriptionId, pharmacyName, medicationIds, notes } = result.data;

  const prescription = await prisma.prescription.findUnique({
    where: { id: prescriptionId },
    include: { medications: true },
  });
  if (!prescription) { res.status(404).json({ error: 'Prescription not found' }); return; }
  if (prescription.status === 'fully_dispensed' || prescription.status === 'expired') {
    res.status(400).json({ error: `Prescription is ${prescription.status}` }); return;
  }
  if (prescription.validUntil < new Date()) {
    await prisma.prescription.update({ where: { id: prescriptionId }, data: { status: 'expired' } });
    res.status(400).json({ error: 'Prescription has expired' }); return;
  }

  await prisma.prescriptionMedication.updateMany({
    where: { id: { in: medicationIds }, prescriptionId },
    data: { dispensed: true, dispensedAt: new Date() },
  });

  const pharmacist = await prisma.user.findUnique({ where: { id: req.userId }, select: { name: true } });

  const dispenseRecord = await prisma.pharmacyDispenseRecord.create({
    data: {
      prescriptionId,
      patientId: prescription.patientId,
      pharmacistId: req.userId!,
      hospitalId: req.hospitalId!,
      pharmacyName,
      notes: notes ?? '',
    },
  });

  const refreshed = await prisma.prescription.findUnique({ where: { id: prescriptionId }, include: { medications: true } });
  const allDispensed = refreshed?.medications.every((m) => m.dispensed) ?? false;
  const someDispensed = refreshed?.medications.some((m) => m.dispensed) ?? false;
  const newStatus = allDispensed ? 'fully_dispensed' : someDispensed ? 'partially_dispensed' : 'active';

  await prisma.prescription.update({
    where: { id: prescriptionId },
    data: { status: newStatus, dispensedAt: new Date(), dispensedBy: pharmacist?.name ?? '', dispensedPharmacy: pharmacyName },
  });

  await prisma.medicalHistoryEntry.create({
    data: {
      patientId: prescription.patientId,
      type: 'prescription',
      title: `Dispensed at ${pharmacyName}`,
      summary: `${medicationIds.length} medication(s) dispensed by ${pharmacist?.name ?? 'pharmacist'}.`,
      linkedPrescriptionId: prescriptionId,
    },
  });

  res.status(201).json({ dispenseRecord });
});

// GET /api/pharmacy/dispense-history/:patientId
router.get('/dispense-history/:patientId', requireAuth, requireRole('pharmacist', 'doctor', 'admin'), async (req: AuthRequest, res: Response): Promise<void> => {
  const patientId = String(req.params['patientId'] ?? '');
  const records = await prisma.pharmacyDispenseRecord.findMany({
    where: { patientId },
    include: { prescription: { include: { medications: true, doctor: { select: { name: true } } } } },
    orderBy: { dispensedAt: 'desc' },
  });
  res.json({ records });
});

// GET /api/pharmacy/scan/:qrSessionId
router.get('/scan/:qrSessionId', requireAuth, requireRole('pharmacist'), async (req: AuthRequest, res: Response): Promise<void> => {
  const qrSessionId = String(req.params['qrSessionId'] ?? '');
  const patient = await prisma.patient.findUnique({
    where: { qrSessionId },
    select: { id: true, name: true, uhid: true, age: true, gender: true, allergies: true },
  });
  if (!patient) { res.status(404).json({ error: 'No patient found for this QR code' }); return; }

  const prescriptions = await prisma.prescription.findMany({
    where: { patientId: patient.id, status: { in: ['active', 'partially_dispensed'] }, validUntil: { gte: new Date() } },
    include: {
      medications: true,
      doctor: { select: { name: true, speciality: true } },
      hospital: { select: { name: true, code: true } },
    },
    orderBy: { issuedAt: 'desc' },
  });

  res.json({ patient, prescriptions });
});

export default router;
