import { Router, Response } from 'express';
import { prisma } from '../config/prisma';
import { requireAuth, requireRole, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/hospitals
router.get('/', async (_req, res: Response): Promise<void> => {
  const hospitals = await prisma.hospital.findMany({
    where: { isActive: true },
    select: { id: true, name: true, code: true, shortName: true, tagline: true, city: true, address: true, contactNumber: true, opdTimings: true },
    orderBy: { name: 'asc' },
  });
  res.json({ hospitals });
});

// GET /api/hospitals/:code/doctors  (must be before /:code to avoid shadowing)
router.get('/:code/doctors', async (req, res: Response): Promise<void> => {
  const code = String(req.params['code'] ?? '').toUpperCase();
  const hospital = await prisma.hospital.findUnique({ where: { code } });
  if (!hospital) { res.status(404).json({ error: 'Hospital not found' }); return; }

  const doctors = await prisma.user.findMany({
    where: { hospitalId: hospital.id, role: 'doctor', isActive: true },
    select: { id: true, name: true, speciality: true, gender: true, avatar: true, identifier: true },
    orderBy: { name: 'asc' },
  });
  res.json({ doctors });
});

// GET /api/hospitals/:code/analytics
router.get('/:code/analytics', requireAuth, requireRole('admin', 'doctor'), async (req: AuthRequest, res: Response): Promise<void> => {
  const code = String(req.params['code'] ?? '').toUpperCase();
  const hospital = await prisma.hospital.findUnique({ where: { code } });
  if (!hospital) { res.status(404).json({ error: 'Hospital not found' }); return; }

  const today = new Date(); today.setHours(0, 0, 0, 0);

  const [totalPatients, todayPatients, totalPrescriptions, todayPrescriptions, activeTokens, totalReports] = await Promise.all([
    prisma.patient.count({ where: { hospitalId: hospital.id } }),
    prisma.patient.count({ where: { hospitalId: hospital.id, createdAt: { gte: today } } }),
    prisma.prescription.count({ where: { hospitalId: hospital.id } }),
    prisma.prescription.count({ where: { hospitalId: hospital.id, issuedAt: { gte: today } } }),
    prisma.queueToken.count({ where: { hospitalId: hospital.id, status: { in: ['waiting', 'called', 'in_progress'] } } }),
    prisma.labReport.count({ where: { hospitalId: hospital.id } }),
  ]);

  res.json({ analytics: { totalPatients, todayPatients, totalPrescriptions, todayPrescriptions, activeTokens, totalReports } });
});

// GET /api/hospitals/:code
router.get('/:code', async (req, res: Response): Promise<void> => {
  const code = String(req.params['code'] ?? '').toUpperCase();
  const hospital = await prisma.hospital.findUnique({
    where: { code },
    include: {
      departments: {
        where: { isActive: true },
        include: { counters: { where: { isActive: true } } },
      },
    },
  });
  if (!hospital) { res.status(404).json({ error: 'Hospital not found' }); return; }
  res.json({ hospital });
});

// POST /api/hospitals
router.post('/', requireAuth, requireRole('admin'), async (req: AuthRequest, res: Response): Promise<void> => {
  const { name, code, shortName, tagline, address, city, contactNumber, helpdeskPhone, opdTimings, website } = req.body as Record<string, string>;
  if (!name || !code || !shortName) { res.status(400).json({ error: 'name, code, shortName required' }); return; }

  const hospital = await prisma.hospital.create({
    data: {
      name, code: code.toUpperCase(), shortName,
      tagline: tagline ?? '', address: address ?? '', city: city ?? '',
      contactNumber: contactNumber ?? '', helpdeskPhone: helpdeskPhone ?? '',
      opdTimings: opdTimings ?? 'Mon–Sat, 08:30 AM – 02:00 PM',
      website: website ?? '',
    },
  });
  res.status(201).json({ hospital });
});

export default router;
