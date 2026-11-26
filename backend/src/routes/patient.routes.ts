import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma';
import { requireAuth, requireRole, AuthRequest } from '../middleware/auth';
import { generateUHID, generateQRSessionId } from '../utils/auth';

const router = Router();

const registerPatientSchema = z.object({
  name: z.string().min(2).max(100),
  age: z.number().int().min(0).max(130),
  gender: z.enum(['Male', 'Female', 'Other']),
  contact: z.string().min(6).max(15),
  bloodGroup: z.string().optional(),
  address: z.string().optional(),
  allergies: z.string().optional(),
  chronicConditions: z.string().optional(),
  emergencyContact: z.string().optional(),
  priority: z.enum(['standard', 'senior', 'emergency']).optional(),
});

// POST /api/patients
router.post('/', requireAuth, requireRole('doctor', 'admin'), async (req: AuthRequest, res: Response): Promise<void> => {
  const result = registerPatientSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: 'Validation failed', details: result.error.flatten() });
    return;
  }

  const data = result.data;
  const hospitalId = req.hospitalId!;

  let uhid = generateUHID();
  let qrSessionId = generateQRSessionId();
  while (await prisma.patient.findUnique({ where: { uhid } })) uhid = generateUHID();
  while (await prisma.patient.findUnique({ where: { qrSessionId } })) qrSessionId = generateQRSessionId();

  const patient = await prisma.patient.create({
    data: {
      uhid, qrSessionId, hospitalId,
      name: data.name, age: data.age, gender: data.gender,
      contact: data.contact,
      bloodGroup: data.bloodGroup ?? '',
      address: data.address ?? '',
      allergies: data.allergies ?? '',
      chronicConditions: data.chronicConditions ?? '',
      emergencyContact: data.emergencyContact ?? '',
      priority: data.priority ?? 'standard',
    },
  });

  await prisma.medicalHistoryEntry.create({
    data: {
      patientId: patient.id,
      type: 'visit',
      title: 'Patient Registered',
      summary: `Registered. UHID: ${uhid}`,
    },
  });

  res.status(201).json({ patient });
});

// GET /api/patients
router.get('/', requireAuth, requireRole('doctor', 'admin', 'lab_tech'), async (req: AuthRequest, res: Response): Promise<void> => {
  const q = String(req.query['q'] ?? '');
  const page = parseInt(String(req.query['page'] ?? '1'), 10);
  const limit = Math.min(parseInt(String(req.query['limit'] ?? '20'), 10), 100);
  const skip = (page - 1) * limit;

  const where = {
    hospitalId: req.hospitalId,
    ...(q ? { OR: [{ name: { contains: q } }, { uhid: { contains: q } }, { contact: { contains: q } }] } : {}),
  };

  const [patients, total] = await Promise.all([
    prisma.patient.findMany({
      where, orderBy: { createdAt: 'desc' }, skip, take: limit,
      select: {
        id: true, uhid: true, qrSessionId: true, name: true, age: true,
        gender: true, contact: true, priority: true, createdAt: true,
        _count: { select: { prescriptions: true, labReports: true } },
      },
    }),
    prisma.patient.count({ where }),
  ]);

  res.json({ patients, total, page, limit, pages: Math.ceil(total / limit) });
});

// GET /api/patients/qr/:sessionId
router.get('/qr/:sessionId', requireAuth, requireRole('doctor', 'pharmacist', 'lab_tech', 'admin'), async (req: AuthRequest, res: Response): Promise<void> => {
  const sessionId = String(req.params['sessionId'] ?? '');
  const patient = await prisma.patient.findUnique({
    where: { qrSessionId: sessionId },
    include: {
      prescriptions: {
        where: { status: { in: ['active', 'partially_dispensed'] } },
        include: { medications: true, doctor: { select: { name: true, speciality: true } } },
        orderBy: { issuedAt: 'desc' },
      },
      labReports: { orderBy: { createdAt: 'desc' }, take: 10, include: { metrics: true } },
      appointments: {
        where: { status: { in: ['booked', 'confirmed'] } },
        include: { doctor: { select: { name: true, speciality: true } } },
      },
    },
  });
  if (!patient) { res.status(404).json({ error: 'No patient found for this QR code' }); return; }
  res.json({ patient });
});

// GET /api/patients/:id
router.get('/:id', requireAuth, requireRole('doctor', 'pharmacist', 'lab_tech', 'admin'), async (req: AuthRequest, res: Response): Promise<void> => {
  const id = String(req.params['id'] ?? '');
  const patient = await prisma.patient.findFirst({
    where: { id, hospitalId: req.hospitalId },
    include: {
      prescriptions: { include: { medications: true, doctor: { select: { name: true, speciality: true } } }, orderBy: { issuedAt: 'desc' } },
      labReports: { include: { metrics: true }, orderBy: { createdAt: 'desc' } },
      appointments: { include: { doctor: { select: { name: true, speciality: true } } }, orderBy: { scheduledDate: 'desc' } },
      medicalHistory: { orderBy: { date: 'desc' }, take: 50 },
    },
  });
  if (!patient) { res.status(404).json({ error: 'Patient not found' }); return; }
  res.json({ patient });
});

// GET /api/patients/:id/self
router.get('/:id/self', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const id = String(req.params['id'] ?? '');
  if (req.userRole === 'patient' && req.userId !== id) {
    res.status(403).json({ error: 'Access denied' }); return;
  }
  const patient = await prisma.patient.findUnique({
    where: { id },
    include: {
      prescriptions: { include: { medications: true, doctor: { select: { name: true, speciality: true } } }, orderBy: { issuedAt: 'desc' } },
      labReports: { include: { metrics: true }, orderBy: { createdAt: 'desc' } },
      appointments: { include: { doctor: { select: { name: true, speciality: true } } }, orderBy: { scheduledDate: 'desc' } },
      medicalHistory: { orderBy: { date: 'desc' }, take: 100 },
      queueTokens: { where: { status: { in: ['waiting', 'called', 'in_progress'] } }, orderBy: { issuedAt: 'desc' } },
    },
  });
  if (!patient) { res.status(404).json({ error: 'Patient not found' }); return; }
  res.json({ patient });
});

export default router;
