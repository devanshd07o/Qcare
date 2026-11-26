import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma';
import { requireAuth, requireRole, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/queue/tokens
router.get('/tokens', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const departmentId = req.query['departmentId'] ? String(req.query['departmentId']) : undefined;
  const status = req.query['status'] ? String(req.query['status']) : undefined;

  const tokens = await prisma.queueToken.findMany({
    where: {
      hospitalId: req.hospitalId,
      ...(departmentId ? { departmentId } : {}),
      ...(status ? { status } : {}),
    },
    include: { patient: { select: { name: true, uhid: true, age: true, gender: true, priority: true } } },
    orderBy: [{ queuePosition: 'asc' }, { issuedAt: 'asc' }],
  });
  res.json({ tokens });
});

const issueTokenSchema = z.object({
  patientId: z.string().min(1),
  testId: z.string().min(1),
  testName: z.string().min(1),
  departmentId: z.string().min(1),
  counterId: z.string().optional(),
  roomNo: z.string().optional(),
  priority: z.enum(['standard', 'senior', 'emergency']).optional().default('standard'),
  doctorPriority: z.enum(['normal', 'priority', 'urgent']).optional().default('normal'),
});

// POST /api/queue/tokens
router.post('/tokens', requireAuth, requireRole('doctor', 'admin'), async (req: AuthRequest, res: Response): Promise<void> => {
  const result = issueTokenSchema.safeParse(req.body);
  if (!result.success) { res.status(400).json({ error: 'Validation failed', details: result.error.flatten() }); return; }

  const { patientId, testId, testName, departmentId, counterId, roomNo, priority, doctorPriority } = result.data;

  const existing = await prisma.queueToken.count({
    where: { hospitalId: req.hospitalId, departmentId, status: { in: ['waiting', 'called', 'in_progress'] } },
  });

  const dept = await prisma.department.findFirst({
    where: { id: departmentId, hospitalId: req.hospitalId },
    select: { code: true },
  });
  const tokenNumber = `${dept?.code ?? 'T'}-${(existing + 1).toString().padStart(2, '0')}`;

  const token = await prisma.queueToken.create({
    data: {
      tokenNumber, patientId, hospitalId: req.hospitalId!,
      testId, testName, departmentId,
      counterId: counterId ?? '',
      roomNo: roomNo ?? '',
      priority: priority ?? 'standard',
      doctorPriority: doctorPriority ?? 'normal',
      queuePosition: existing + 1,
      estimatedWaitMinutes: (existing + 1) * 10,
    },
    include: { patient: { select: { name: true, uhid: true } } },
  });
  res.status(201).json({ token });
});

// PATCH /api/queue/tokens/:id
router.patch('/tokens/:id', requireAuth, requireRole('lab_tech', 'doctor', 'admin'), async (req: AuthRequest, res: Response): Promise<void> => {
  const id = String(req.params['id'] ?? '');
  const { status, counterId, roomNo } = req.body as { status?: string; counterId?: string; roomNo?: string };
  if (!status) { res.status(400).json({ error: 'Status required' }); return; }

  const token = await prisma.queueToken.update({
    where: { id },
    data: {
      status,
      ...(counterId ? { counterId } : {}),
      ...(roomNo ? { roomNo } : {}),
      ...(status === 'called' ? { calledAt: new Date() } : {}),
      ...(status === 'completed' ? { completedAt: new Date() } : {}),
    },
  });
  res.json({ token });
});

// GET /api/queue/patient/:patientId
router.get('/patient/:patientId', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const patientId = String(req.params['patientId'] ?? '');
  const tokens = await prisma.queueToken.findMany({
    where: { patientId, hospitalId: req.hospitalId },
    orderBy: { issuedAt: 'desc' },
  });
  res.json({ tokens });
});

export default router;
