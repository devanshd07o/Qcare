import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { prisma } from '../config/prisma';

export interface AuthRequest extends Request {
  userId?: string;
  userRole?: string;
  hospitalId?: string;
}

interface JwtPayload {
  sub: string;      // userId
  role: string;
  hospitalId: string;
  iat: number;
  exp: number;
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid authorization header' });
    return;
  }

  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;
    req.userId = payload.sub;
    req.userRole = payload.role;
    req.hospitalId = payload.hospitalId;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired access token' });
  }
}

export function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.userRole || !roles.includes(req.userRole)) {
      res.status(403).json({ error: `Access denied. Required role(s): ${roles.join(', ')}` });
      return;
    }
    next();
  };
}

// Patient QR session auth (no password — just QR session ID)
export async function requireQRSession(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  const sessionId = req.headers['x-qr-session'] as string | undefined;
  if (!sessionId) {
    res.status(401).json({ error: 'Missing QR session header' });
    return;
  }

  const patient = await prisma.patient.findUnique({ where: { qrSessionId: sessionId } });
  if (!patient) {
    res.status(401).json({ error: 'Invalid QR session' });
    return;
  }

  req.userId = patient.id;
  req.userRole = 'patient';
  req.hospitalId = patient.hospitalId;
  next();
}
