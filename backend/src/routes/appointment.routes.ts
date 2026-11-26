import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma';
import { requireAuth, requireRole, AuthRequest } from '../middleware/auth';

const router = Router();

const createApptSchema = z.object({
  patientId: z.string().min(1),
  doctorId: z.string().min(1),
  scheduledDate: z.string().min(10),
  scheduledTime: z.string().min(3),
  type: z.enum(['consultation', 'follow_up', 'emergency']).optional().default('consultation'),
  chiefComplaint: z.string().optional(),
  notes: z.string().optional(),
});

// POST /api/appointments
router.post('/', requireAuth, requireRole('doctor', 'admin'), async (req: AuthRequest, res: Response): Promise<void> => {
  const result = createApptSchema.safeParse(req.body);
  if (!result.success) { res.status(400).json({ error: 'Validation failed', details: result.error.flatten() }); return; }

  const { patientId, doctorId, scheduledDate, scheduledTime, type, chiefComplaint, notes } = result.data;

  const [patient, doctor] = await Promise.all([
    prisma.patient.findFirst({ where: { id: patientId, hospitalId: req.hospitalId } }),
    prisma.user.findFirst({ where: { id: doctorId, role: 'doctor', hospitalId: req.hospitalId } }),
  ]);
  if (!patient) { res.status(404).json({ error: 'Patient not found' }); return; }
  if (!doctor) { res.status(404).json({ error: 'Doctor not found' }); return; }

  const conflict = await prisma.appointment.findFirst({
    where: { doctorId, scheduledDate, scheduledTime, status: { in: ['booked', 'confirmed', 'in_progress'] } },
  });
  if (conflict) { res.status(409).json({ error: `Slot ${scheduledTime} on ${scheduledDate} already booked` }); return; }

  const appointment = await prisma.appointment.create({
    data: {
      patientId, doctorId, hospitalId: req.hospitalId!,
      scheduledDate, scheduledTime,
      type: type ?? 'consultation',
      status: 'booked',
      chiefComplaint: chiefComplaint ?? '',
      notes: notes ?? '',
    },
    include: {
      doctor: { select: { name: true, speciality: true } },
      patient: { select: { name: true, uhid: true } },
    },
  });

  await prisma.medicalHistoryEntry.create({
    data: {
      patientId,
      type: 'appointment',
      title: `Appointment with Dr. ${doctor.name}`,
      summary: `${type ?? 'Consultation'} on ${scheduledDate} at ${scheduledTime}.`,
      linkedApptId: appointment.id,
    },
  });

  res.status(201).json({ appointment });
});

// GET /api/appointments/slots/:doctorId/:date
router.get('/slots/:doctorId/:date', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const doctorId = String(req.params['doctorId'] ?? '');
  const date = String(req.params['date'] ?? '');

  const booked = await prisma.appointment.findMany({
    where: { doctorId, scheduledDate: date, status: { in: ['booked', 'confirmed', 'in_progress'] } },
    select: { scheduledTime: true },
  });
  const bookedTimes = new Set(booked.map((a) => a.scheduledTime));

  const slots: { time: string; available: boolean }[] = [];
  for (let h = 9; h < 14; h++) {
    for (let m = 0; m < 60; m += 15) {
      const suffix = h < 12 ? 'AM' : 'PM';
      const displayH = h > 12 ? h - 12 : h;
      const time = `${displayH}:${m.toString().padStart(2, '0')} ${suffix}`;
      slots.push({ time, available: !bookedTimes.has(time) });
    }
  }
  res.json({ slots });
});

// GET /api/appointments/doctor/:doctorId
router.get('/doctor/:doctorId', requireAuth, requireRole('doctor', 'admin'), async (req: AuthRequest, res: Response): Promise<void> => {
  const doctorId = String(req.params['doctorId'] ?? '');
  const date = req.query['date'] ? String(req.query['date']) : undefined;

  const appointments = await prisma.appointment.findMany({
    where: { doctorId, hospitalId: req.hospitalId, ...(date ? { scheduledDate: date } : {}) },
    include: { patient: { select: { id: true, name: true, uhid: true, age: true, gender: true, contact: true } } },
    orderBy: [{ scheduledDate: 'asc' }, { scheduledTime: 'asc' }],
  });
  res.json({ appointments });
});

// GET /api/appointments/patient/:patientId
router.get('/patient/:patientId', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const patientId = String(req.params['patientId'] ?? '');
  const appointments = await prisma.appointment.findMany({
    where: { patientId },
    include: {
      doctor: { select: { name: true, speciality: true, gender: true } },
      hospital: { select: { name: true, code: true } },
    },
    orderBy: [{ scheduledDate: 'desc' }],
  });
  res.json({ appointments });
});

// PATCH /api/appointments/:id
router.patch('/:id', requireAuth, requireRole('doctor', 'admin'), async (req: AuthRequest, res: Response): Promise<void> => {
  const id = String(req.params['id'] ?? '');
  const { status, notes } = req.body as { status?: string; notes?: string };
  const appointment = await prisma.appointment.update({
    where: { id },
    data: { ...(status ? { status } : {}), ...(notes ? { notes } : {}) },
    include: { doctor: { select: { name: true } }, patient: { select: { name: true, uhid: true } } },
  });
  res.json({ appointment });
});

export default router;
