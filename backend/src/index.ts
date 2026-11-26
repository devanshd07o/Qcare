import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { env } from './config/env';
import { errorHandler, notFound } from './middleware/errorHandler';

import authRoutes from './routes/auth.routes';
import patientRoutes from './routes/patient.routes';
import prescriptionRoutes from './routes/prescription.routes';
import pharmacyRoutes from './routes/pharmacy.routes';
import appointmentRoutes from './routes/appointment.routes';
import labRoutes from './routes/lab.routes';
import queueRoutes from './routes/queue.routes';
import hospitalRoutes from './routes/hospital.routes';

const app = express();

// ── Security headers
app.use(helmet());

// ── CORS — only allow configured frontend
app.use(cors({
  origin: env.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-QR-Session'],
}));

// ── Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Request logging (skip in test)
if (env.NODE_ENV !== 'test') {
  app.use(morgan(env.IS_PROD ? 'combined' : 'dev'));
}

// ── Global rate limiting (100 req/min per IP)
app.use(rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
}));

// ── Auth endpoints get stricter rate limit (20/min)
app.use('/api/auth', rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { error: 'Too many auth attempts, slow down.' },
}));

// ── Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', version: '3.0.0', timestamp: new Date().toISOString() });
});

// ── API Routes
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/pharmacy', pharmacyRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/lab', labRoutes);
app.use('/api/queue', queueRoutes);
app.use('/api/hospitals', hospitalRoutes);

// ── 404 + Error handlers
app.use(notFound);
app.use(errorHandler);

// ── Start server
app.listen(env.PORT, () => {
  console.log(`[QCare API] Server running on http://localhost:${env.PORT} (${env.NODE_ENV})`);
  console.log(`[QCare API] Frontend CORS: ${env.FRONTEND_URL}`);
});

export default app;
