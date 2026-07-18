import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { initDatabase } from './config/initDb';
import authRoutes from './routes/auth.routes';
import dashboardRoutes from './routes/dashboard.routes';
import adminRoutes from './routes/admin.routes';
import payoutRoutes from './routes/payout.routes';
import paymentRoutes from './routes/payment.routes';
import kycRoutes from './routes/kyc.routes';
import supportRoutes from './routes/support.routes';
import affiliateRoutes from './routes/affiliate.routes';
import couponsRouter from './routes/coupon.routes';
import challengesRouter from './routes/challenge.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

// When running behind proxy services like Render, trust the proxy headers.
app.set('trust proxy', 1);

// Security and utility middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || '*', // Set FRONTEND_URL in prod (e.g. https://yourapp.com)
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

// Main route registration
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payouts', payoutRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/kyc', kycRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/affiliates', affiliateRoutes);
app.use('/api/coupons', couponsRouter);
app.use('/api/challenges', challengesRouter);

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Start Server
async function startServer() {
  // 1. Initialize Database Schema
  await initDatabase();

  // 2. Start listening
  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`🚀 Quantum Prop Backend listening on 0.0.0.0:${PORT} (network accessible)`);
  });
}

startServer();
