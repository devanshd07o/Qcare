import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

const SALT_ROUNDS = 12;

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export function signAccessToken(userId: string, role: string, hospitalId: string): string {
  return jwt.sign(
    { sub: userId, role, hospitalId },
    env.JWT_ACCESS_SECRET,
    { expiresIn: env.JWT_ACCESS_EXPIRES_IN } as jwt.SignOptions
  );
}

export function signRefreshToken(userId: string): string {
  return jwt.sign(
    { sub: userId },
    env.JWT_REFRESH_SECRET,
    { expiresIn: env.JWT_REFRESH_EXPIRES_IN } as jwt.SignOptions
  );
}

export function verifyRefreshToken(token: string): { sub: string } {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as { sub: string };
}

/** Generate a short unique UHID like QC-2026-XXXX */
export function generateUHID(): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `QC-${year}-${rand}`;
}

/** Generate short QR session ID like QC-XXXX */
export function generateQRSessionId(): string {
  const rand = Math.floor(1000 + Math.random() * 90000);
  return `QC-${rand}`;
}

/** Generate prescription ID like RX-XXXXXXXX */
export function generatePrescriptionId(): string {
  const rand = Math.random().toString(36).substring(2, 10).toUpperCase();
  return `RX-${rand}`;
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}
