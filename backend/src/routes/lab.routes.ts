import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma';
import { requireAuth, requireRole, AuthRequest } from '../middleware/auth';

const router = Router();

const metricSchema = z.object({
  label: z.string().min(1),
  value: z.string().min(1),
  unit: z.string(),
  normalRange: z.string(),
  flag: z.enum(['normal', 'high', 'low', 'critical']).optional().default('normal'),
});

const createReportSchema = z.object({
  patientId: z.string().min(1),
  testId: z.string().min(1),
  testName: z.string().min(1),
  technicalName: z.string().optional(),
  departmentId: z.string().min(1),
  counterId: z.string().optional(),
  roomNo: z.string().optional(),
  summary: z.string().optional(),
  isCritical: z.boolean().optional().default(false),
  metrics: z.array(metricSchema).optional().default([]),
});

// POST /api/lab/reports
router.post('/reports', requireAuth, requireRole('lab_tech', 'doctor'), async (req: AuthRequest, res: Response): Promise<void> => {
  const result = createReportSchema.safeParse(req.body);
  if (!result.success) { res.status(400).json({ error: 'Validation failed', details: result.error.flatten() }); return; }

  const { patientId, testId, testName, technicalName, departmentId, counterId, roomNo, summary, isCritical, metrics } = result.data;

  const patient = await prisma.patient.findFirst({ where: { id: patientId, hospitalId: req.hospitalId }, select: { id: true } });
  if (!patient) { res.status(404).json({ error: 'Patient not found' }); return; }

  const tech = await prisma.user.findUnique({ where: { id: req.userId }, select: { name: true } });

  const report = await prisma.labReport.create({
    data: {
      patientId,
      technicianId: req.userId,
      hospitalId: req.hospitalId!,
      testId,
      testName,
      technicalName: technicalName ?? '',
      departmentId,
      counterId: counterId ?? '',
      roomNo: roomNo ?? '',
      technicianName: tech?.name ?? '',
      summary: summary ?? '',
      isCritical: isCritical ?? false,
      status: 'uploaded',
      metrics: {
        create: metrics.map((m) => ({
          label: m.label, value: m.value, unit: m.unit,
          normalRange: m.normalRange, flag: m.flag ?? 'normal',
        })),
      },
    },
    include: { metrics: true },
  });

  await prisma.medicalHistoryEntry.create({
    data: {
      patientId,
      type: 'lab_report',
      title: `Lab report: ${testName}`,
      summary: `${testName} uploaded by ${tech?.name ?? 'Lab tech'}.${isCritical ? ' ⚠ CRITICAL.' : ''}`,
      linkedReportId: report.id,
    },
  });

  res.status(201).json({ report });
});

// GET /api/lab/reports/patient/:patientId
router.get('/reports/patient/:patientId', requireAuth, requireRole('doctor', 'lab_tech', 'admin'), async (req: AuthRequest, res: Response): Promise<void> => {
  const patientId = String(req.params['patientId'] ?? '');
  const reports = await prisma.labReport.findMany({
    where: { patientId, hospitalId: req.hospitalId },
    include: { metrics: true, technician: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ reports });
});

// GET /api/lab/reports/:id
router.get('/reports/:id', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const id = String(req.params['id'] ?? '');
  const report = await prisma.labReport.findFirst({
    where: { id, hospitalId: req.hospitalId },
    include: {
      metrics: true,
      patient: { select: { name: true, uhid: true, age: true, gender: true } },
      technician: { select: { name: true } },
      hospital: { select: { name: true, address: true } },
    },
  });
  if (!report) { res.status(404).json({ error: 'Report not found' }); return; }
  res.json({ report });
});

// PATCH /api/lab/reports/:id/verify
router.patch('/reports/:id/verify', requireAuth, requireRole('doctor'), async (req: AuthRequest, res: Response): Promise<void> => {
  const id = String(req.params['id'] ?? '');
  const { doctorNotes, doctorSignature } = req.body as { doctorNotes?: string; doctorSignature?: string };
  const report = await prisma.labReport.update({
    where: { id },
    data: { status: 'verified_by_doctor', doctorNotes: doctorNotes ?? '', doctorSignature: doctorSignature ?? '' },
    include: { metrics: true },
  });
  res.json({ report });
});

// GET /api/lab/queue
router.get('/queue', requireAuth, requireRole('lab_tech'), async (req: AuthRequest, res: Response): Promise<void> => {
  const tokens = await prisma.queueToken.findMany({
    where: { hospitalId: req.hospitalId, status: { in: ['waiting', 'called', 'in_progress'] } },
    include: { patient: { select: { name: true, uhid: true, age: true, gender: true, priority: true } } },
    orderBy: [{ issuedAt: 'asc' }],
  });
  res.json({ tokens });
});

// PATCH /api/lab/queue/:tokenId/status
router.patch('/queue/:tokenId/status', requireAuth, requireRole('lab_tech'), async (req: AuthRequest, res: Response): Promise<void> => {
  const tokenId = String(req.params['tokenId'] ?? '');
  const { status } = req.body as { status?: string };
  if (!status) { res.status(400).json({ error: 'Status required' }); return; }

  const token = await prisma.queueToken.update({
    where: { id: tokenId },
    data: {
      status,
      ...(status === 'called' ? { calledAt: new Date() } : {}),
      ...(status === 'completed' ? { completedAt: new Date() } : {}),
    },
  });
  res.json({ token });
});

export default router;
