import dotenv from 'dotenv';
dotenv.config();

import prisma from './config/prisma.js';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import logger from './utils/logger.js';

async function seed() {
  logger.info('Starting database seed...');

  const adminEmail = 'admin@propfirm.com';
  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });

  if (!existingAdmin) {
    await prisma.user.create({
      data: {
        email: adminEmail,
        password: await bcrypt.hash('Admin@123456', 12),
        name: 'Super Admin',
        role: 'SUPER_ADMIN',
        isVerified: true,
        affiliateCode: 'ADMIN001',
      },
    });
    logger.info('Admin user created');
  }

  const challengePlans = [
    { name: 'Starter', price: 49, accountSize: 5000, profitTarget: 10, maxDrawdown: 8, durationDays: 30 },
    { name: 'Standard', price: 99, accountSize: 10000, profitTarget: 10, maxDrawdown: 8, durationDays: 30 },
    { name: 'Premium', price: 199, accountSize: 25000, profitTarget: 8, maxDrawdown: 6, durationDays: 60 },
    { name: 'Elite', price: 499, accountSize: 50000, profitTarget: 8, maxDrawdown: 6, durationDays: 60 },
    { name: 'Ultimate', price: 999, accountSize: 100000, profitTarget: 6, maxDrawdown: 5, durationDays: 90 },
  ];

  for (const plan of challengePlans) {
    const existing = await prisma.challengePlan.findFirst({ where: { name: plan.name } });
    if (!existing) {
      await prisma.challengePlan.create({ data: plan });
      logger.info(`Challenge plan "${plan.name}" created`);
    }
  }

  logger.info('Seed completed');
  await prisma.$disconnect();
}

seed().catch((err) => {
  logger.error('Seed failed', { error: err });
  prisma.$disconnect();
  process.exit(1);
});
