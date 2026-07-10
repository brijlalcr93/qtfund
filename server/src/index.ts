import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { errorHandler } from './middleware/errorHandler.js';
import logger from './utils/logger.js';
import prisma from './config/prisma.js';

import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import challengeRoutes from './routes/challenges.js';
import paymentRoutes from './routes/payments.js';
import payoutRoutes from './routes/payouts.js';
import kycRoutes from './routes/kyc.js';
import ticketRoutes from './routes/tickets.js';
import affiliateRoutes from './routes/affiliates.js';
import couponRoutes from './routes/coupons.js';
import notificationRoutes from './routes/notifications.js';
import adminRoutes from './routes/admin.js';

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(compression());
app.use(cookieParser());
app.use(morgan('combined', {
  stream: { write: (message: string) => logger.info(message.trim()) },
}));

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({ message: 'Too many requests, please try again later.' });
  },
});
app.use(limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/challenges', challengeRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/payouts', payoutRoutes);
app.use('/api/kyc', kycRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/affiliates', affiliateRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use(errorHandler);

const server = app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});

async function gracefulShutdown(signal: string) {
  logger.info(`${signal} received. Starting graceful shutdown...`);

  server.close(async () => {
    logger.info('HTTP server closed');
    await prisma.$disconnect();
    logger.info('Database connection closed');
    process.exit(0);
  });

  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export default app;
