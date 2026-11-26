import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma';
import {
  hashPassword,
  verifyPassword,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  addDays,
} from '../utils/auth';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const registerSchema = z.object({
  hospitalCode: z.string().min(2).max(20),
  role: z.enum(['doctor', 'lab_tech', 'pharmacist', 'admin']),
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8),
  identifier: z.string().min(2),
  speciality: z.string().optional(),
  gender: z.enum(['Male', 'Female', '']).optional(),
});

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  const result = registerSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: 'Validation failed', details: result.error.flatten() });
    return;
  }

  const { hospitalCode, role, name, email, password, identifier, speciality, gender } = result.data;

  const hospital = await prisma.hospital.findUnique({ where: { code: hospitalCode.toUpperCase() } });
  if (!hospital) {
    res.status(404).json({ error: `Hospital with code "${hospitalCode}" not found` });
    return;
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    res.status(409).json({ error: 'Email already registered' });
    return;
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: {
      hospitalId: hospital.id,
      role,
      name,
      email,
      passwordHash,
      identifier,
      speciality: speciality ?? '',
      gender: gender ?? '',
    },
    select: { id: true, name: true, email: true, role: true, hospitalId: true, identifier: true },
  });

  const accessToken = signAccessToken(user.id, user.role, user.hospitalId);
  const refreshToken = signRefreshToken(user.id);

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      token: refreshToken,
      expiresAt: addDays(new Date(), 7),
    },
  });

  res.status(201).json({ user, accessToken, refreshToken });
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const result = loginSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: 'Validation failed', details: result.error.flatten() });
    return;
  }

  const { email, password } = result.data;

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, name: true, email: true, role: true, hospitalId: true, identifier: true, passwordHash: true, isActive: true, gender: true, avatar: true, speciality: true },
  });

  if (!user || !user.isActive) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const { passwordHash: _ph, ...safeUser } = user;

  const accessToken = signAccessToken(user.id, user.role, user.hospitalId);
  const refreshToken = signRefreshToken(user.id);

  await prisma.refreshToken.create({
    data: { userId: user.id, token: refreshToken, expiresAt: addDays(new Date(), 7) },
  });

  // Fetch hospital for context
  const hospital = await prisma.hospital.findUnique({
    where: { id: user.hospitalId },
    select: { id: true, name: true, code: true, shortName: true, tagline: true, address: true, city: true, contactNumber: true },
  });

  res.json({ user: safeUser, hospital, accessToken, refreshToken });
});

// POST /api/auth/refresh
router.post('/refresh', async (req: Request, res: Response): Promise<void> => {
  const { refreshToken } = req.body as { refreshToken?: string };
  if (!refreshToken) {
    res.status(400).json({ error: 'Refresh token required' });
    return;
  }

  let payload: { sub: string };
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    res.status(401).json({ error: 'Invalid refresh token' });
    return;
  }

  const stored = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });
  if (!stored || stored.expiresAt < new Date()) {
    res.status(401).json({ error: 'Refresh token expired or revoked' });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: { id: true, role: true, hospitalId: true, isActive: true },
  });

  if (!user || !user.isActive) {
    res.status(401).json({ error: 'User not found or deactivated' });
    return;
  }

  // Rotate refresh token
  await prisma.refreshToken.delete({ where: { token: refreshToken } });
  const newRefreshToken = signRefreshToken(user.id);
  await prisma.refreshToken.create({
    data: { userId: user.id, token: newRefreshToken, expiresAt: addDays(new Date(), 7) },
  });

  const accessToken = signAccessToken(user.id, user.role, user.hospitalId);
  res.json({ accessToken, refreshToken: newRefreshToken });
});

// POST /api/auth/logout
router.post('/logout', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const { refreshToken } = req.body as { refreshToken?: string };
  if (refreshToken) {
    await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
  }
  res.json({ message: 'Logged out successfully' });
});

// GET /api/auth/me
router.get('/me', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: { id: true, name: true, email: true, role: true, identifier: true, speciality: true, gender: true, avatar: true, hospitalId: true },
  });
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  res.json({ user });
});

export default router;
