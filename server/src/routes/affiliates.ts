import { Router, Request, Response } from 'express';
import { body } from 'express-validator';
import prisma from '../config/prisma.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import logger from '../utils/logger.js';

const router = Router();

router.get('/dashboard', authenticate, async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { affiliateCode: true, commissionRate: true, referredBy: true },
    });

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    if (!user.affiliateCode) {
      const code = generateAffiliateCode();
      await prisma.user.update({
        where: { id: req.user!.userId },
        data: { affiliateCode: code },
      });
      user.affiliateCode = code;
    }

    const referrals = await prisma.referral.findMany({
      where: { referrerId: req.user!.userId },
      orderBy: { createdAt: 'desc' },
    });

    const earnings = await prisma.affiliateEarning.aggregate({
      where: { userId: req.user!.userId },
      _sum: { amount: true },
    });

    const pendingEarnings = await prisma.affiliateEarning.aggregate({
      where: { userId: req.user!.userId, isPaid: false },
      _sum: { amount: true },
    });

    const referralCount = referrals.length;
    const convertedCount = referrals.filter((r) => r.isConverted).length;

    res.json({
      affiliateCode: user.affiliateCode,
      commissionRate: user.commissionRate,
      referredBy: user.referredBy,
      stats: {
        totalReferrals: referralCount,
        convertedReferrals: convertedCount,
        totalEarnings: earnings._sum.amount || 0,
        pendingEarnings: pendingEarnings._sum.amount || 0,
      },
      referrals,
    });
  } catch (error) {
    logger.error('Affiliate dashboard error', { error });
    res.status(500).json({ message: 'Failed to fetch affiliate dashboard' });
  }
});

router.post(
  '/claim',
  authenticate,
  body('amount').isFloat({ min: 1 }).withMessage('Amount must be at least 1'),
  validate,
  async (req: Request, res: Response) => {
    try {
      const { amount } = req.body;

      const pendingEarnings = await prisma.affiliateEarning.aggregate({
        where: { userId: req.user!.userId, isPaid: false },
        _sum: { amount: true },
      });

      const totalPending = pendingEarnings._sum.amount || 0;

      if (amount > totalPending) {
        res.status(400).json({ message: `You only have $${totalPending.toFixed(2)} in pending earnings` });
        return;
      }

      await prisma.$transaction(async (tx) => {
        const earnings = await tx.affiliateEarning.findMany({
          where: { userId: req.user!.userId, isPaid: false },
          orderBy: { createdAt: 'asc' },
        });

        let remaining = amount;
        for (const earning of earnings) {
          if (remaining <= 0) break;

          const toClaim = Math.min(earning.amount, remaining);
          await tx.affiliateEarning.update({
            where: { id: earning.id },
            data: { isPaid: true },
          });

          remaining -= toClaim;
        }

        await tx.user.update({
          where: { id: req.user!.userId },
          data: { balance: { increment: amount } },
        });

        await tx.notification.create({
          data: {
            userId: req.user!.userId,
            title: 'Earnings Claimed',
            message: `You have claimed $${amount.toFixed(2)} in affiliate earnings.`,
            type: 'FINANCE',
          },
        });
      });

      res.json({ message: `Successfully claimed $${amount.toFixed(2)}` });
    } catch (error) {
      logger.error('Claim earnings error', { error });
      res.status(500).json({ message: 'Failed to claim earnings' });
    }
  }
);

router.get('/referrals', authenticate, async (req: Request, res: Response) => {
  try {
    const referrals = await prisma.referral.findMany({
      where: { referrerId: req.user!.userId },
      include: {
        referrer: { select: { email: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(referrals);
  } catch (error) {
    logger.error('List referrals error', { error });
    res.status(500).json({ message: 'Failed to fetch referrals' });
  }
});

router.get('/', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const affiliates = await prisma.user.findMany({
      where: {
        affiliateCode: { not: null },
      },
      select: {
        id: true,
        email: true,
        name: true,
        affiliateCode: true,
        commissionRate: true,
        createdAt: true,
        _count: { select: { referrals: true } },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    const affiliateIds = affiliates.map((a) => a.id);

    const earningsMap: Record<string, number> = {};
    for (const id of affiliateIds) {
      const result = await prisma.affiliateEarning.aggregate({
        where: { userId: id },
        _sum: { amount: true },
      });
      earningsMap[id] = result._sum.amount || 0;
    }

    const enriched = affiliates.map((a) => ({
      ...a,
      totalEarnings: earningsMap[a.id] || 0,
    }));

    const total = await prisma.user.count({
      where: { affiliateCode: { not: null } },
    });

    res.json({
      affiliates: enriched,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    logger.error('List affiliates error', { error });
    res.status(500).json({ message: 'Failed to fetch affiliates' });
  }
});

router.put(
  '/:userId/commission',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN'),
  body('commissionRate').isFloat({ min: 0, max: 100 }).withMessage('Commission must be between 0 and 100'),
  validate,
  async (req: Request, res: Response) => {
    try {
      const user = await prisma.user.update({
        where: { id: req.params.userId },
        data: { commissionRate: req.body.commissionRate },
        select: { id: true, email: true, commissionRate: true },
      });

      res.json(user);
    } catch (error) {
      logger.error('Update commission error', { error });
      res.status(500).json({ message: 'Failed to update commission' });
    }
  }
);

function generateAffiliateCode(length: number = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export default router;
