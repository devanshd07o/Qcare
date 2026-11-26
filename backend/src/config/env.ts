import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

function required(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required env var: ${key}`);
  return value;
}

export const env = {
  PORT: parseInt(process.env['PORT'] ?? '4000', 10),
  NODE_ENV: process.env['NODE_ENV'] ?? 'development',
  IS_PROD: process.env['NODE_ENV'] === 'production',

  DATABASE_URL: required('DATABASE_URL'),

  JWT_ACCESS_SECRET: required('JWT_ACCESS_SECRET'),
  JWT_REFRESH_SECRET: required('JWT_REFRESH_SECRET'),
  JWT_ACCESS_EXPIRES_IN: process.env['JWT_ACCESS_EXPIRES_IN'] ?? '15m',
  JWT_REFRESH_EXPIRES_IN: process.env['JWT_REFRESH_EXPIRES_IN'] ?? '7d',

  FRONTEND_URL: process.env['FRONTEND_URL'] ?? 'http://localhost:5173',
} as const;
