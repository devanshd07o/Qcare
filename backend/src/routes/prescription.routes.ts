import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma';
import { requireAuth, requireRole, AuthRequest } from '../middleware/auth';
import { generatePrescriptionId, addDays } from '../utils/auth';

const router = Router();

const medicationSchema = z.object({
  drugName: z.string().min(1).max(200),
  genericName: z.string().optional(),
  dose: z.string().min(1),
  frequency: z.string().min(1),
  duration: z.string().min(1),
  route: z.string().min(1),
  instructions: z.string().optional(),
  quantity: z.string().optional(),
});

const createPrescriptionSchema = z.object({
  patientId: z.string().min(1),
  diagnosis: z.string().optional(),
  clinicalNotes: z.string().optional(),
  followUpDate: z.string().optional(),
  validDays: z.number().int().min(1).max(365).optional().default(30),
  medications: z.array(medicationSchema).min(1),
});

// POST /api/prescriptions
router.post('/', requireAuth, requireRole('doctor'), async (req: AuthRequest, res: Response): Promise<void> => {
  const result = createPrescriptionSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: 'Validation failed', details: result.error.flatten() });
    return;
  }

  const { patientId, diagnosis, clinicalNotes, followUpDate, validDays, medications } = result.data;

  const patient = await prisma.patient.findFirst({
    where: { id: patientId, hospitalId: req.hospitalId },
    select: { id: true, name: true, uhid: true },
  });
  if (!patient) { res.status(404).json({ error: 'Patient not found in your hospital' }); return; }

  const doctor = await prisma.user.findUnique({ where: { id: req.userId }, select: { name: true } });

  const rxId = generatePrescriptionId();
  const validUntil = addDays(new Date(), validDays ?? 30);

  const prescription = await prisma.prescription.create({
    data: {
      id: rxId,
      patientId,
      doctorId: req.userId!,
      hospitalId: req.hospitalId!,
      diagnosis: diagnosis ?? '',
      clinicalNotes: clinicalNotes ?? '',
      followUpDate: followUpDate ?? '',
      validUntil,
      medications: {
        create: medications.map((med) => ({
          drugName: med.drugName,
          genericName: med.genericName ?? '',
          dose: med.dose,
          frequency: med.frequency,
          duration: med.duration,
          route: med.route,
          instructions: med.instructions ?? '',
          quantity: med.quantity ?? '',
        })),
      },
    },
    include: { medications: true },
  });

  await prisma.medicalHistoryEntry.create({
    data: {
      patientId,
      type: 'prescription',
      title: `Prescription by Dr. ${doctor?.name ?? 'Unknown'}`,
      summary: `${diagnosis ? `Diagnosis: ${diagnosis}. ` : ''}${medications.length} medication(s).`,
      linkedPrescriptionId: prescription.id,
    },
  });

  res.status(201).json({ prescription });
});

// GET /api/prescriptions/patient/:patientId
router.get('/patient/:patientId', requireAuth, requireRole('doctor', 'pharmacist', 'admin'), async (req: AuthRequest, res: Response): Promise<void> => {
  const patientId = String(req.params['patientId'] ?? '');
  const prescriptions = await prisma.prescription.findMany({
    where: { patientId, hospitalId: req.hospitalId },
    include: {
      medications: true,
      doctor: { select: { name: true, speciality: true } },
      dispenseRecords: { select: { dispensedAt: true, pharmacyName: true } },
    },
    orderBy: { issuedAt: 'desc' },
  });
  res.json({ prescriptions });
});

// GET /api/prescriptions/:id
router.get('/:id', requireAuth, requireRole('doctor', 'pharmacist', 'admin'), async (req: AuthRequest, res: Response): Promise<void> => {
  const id = String(req.params['id'] ?? '');
  const prescription = await prisma.prescription.findFirst({
    where: { id, hospitalId: req.hospitalId },
    include: {
      medications: true,
      patient: { select: { name: true, uhid: true, age: true, gender: true, allergies: true } },
      doctor: { select: { name: true, speciality: true, identifier: true } },
      hospital: { select: { name: true, address: true, contactNumber: true } },
      dispenseRecords: true,
    },
  });
  if (!prescription) { res.status(404).json({ error: 'Prescription not found' }); return; }
  res.json({ prescription });
});

// PATCH /api/prescriptions/:id/mark-dispensed
router.patch('/:id/mark-dispensed', requireAuth, requireRole('pharmacist', 'doctor'), async (req: AuthRequest, res: Response): Promise<void> => {
  const id = String(req.params['id'] ?? '');
  const { medicationIds } = req.body as { medicationIds?: string[] };

  const prescription = await prisma.prescription.findFirst({ where: { id }, include: { medications: true } });
  if (!prescription) { res.status(404).json({ error: 'Prescription not found' }); return; }

  if (medicationIds && medicationIds.length > 0) {
    await prisma.prescriptionMedication.updateMany({
      where: { id: { in: medicationIds }, prescriptionId: prescription.id },
      data: { dispensed: true, dispensedAt: new Date() },
    });
  }

  const updated = await prisma.prescription.findUnique({ where: { id: prescription.id }, include: { medications: true } });
  const allDispensed = updated?.medications.every((m) => m.dispensed) ?? false;
  const someDispensed = updated?.medications.some((m) => m.dispensed) ?? false;
  const newStatus = allDispensed ? 'fully_dispensed' : someDispensed ? 'partially_dispensed' : 'active';

  const final = await prisma.prescription.update({
    where: { id: prescription.id },
    data: { status: newStatus },
    include: { medications: true },
  });

  res.json({ prescription: final });
});

export default router;
