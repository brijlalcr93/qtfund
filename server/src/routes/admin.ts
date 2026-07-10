import { Router, Request, Response } from 'express';
import { body } from 'express-validator';
import prisma from '../config/prisma.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import logger from '../utils/logger.js';

const router = Router();

router.get('/stats', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), async (_req: Request, res: Response) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const [
      totalUsers,
      verifiedUsers,
      activeChallenges,
      passedChallenges,
      failedChallenges,
      totalRevenue,
      monthRevenue,
      yearRevenue,
      pendingPayouts,
      pendingKyc,
      openTickets,
      monthRegistrations,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isVerified: true } }),
      prisma.userChallenge.count({ where: { status: 'ACTIVE' } }),
      prisma.userChallenge.count({ where: { status: 'PASSED' } }),
      prisma.userChallenge.count({ where: { status: 'FAILED' } }),
      prisma.payment.aggregate({ where: { status: 'COMPLETED' }, _sum: { amount: true } }),
      prisma.payment.aggregate({
        where: { status: 'COMPLETED', createdAt: { gte: startOfMonth } },
        _sum: { amount: true },
      }),
      prisma.payment.aggregate({
        where: { status: 'COMPLETED', createdAt: { gte: startOfYear } },
        _sum: { amount: true },
      }),
      prisma.payout.count({ where: { status: 'PENDING' } }),
      prisma.kyc.count({ where: { status: 'PENDING' } }),
      prisma.ticket.count({ where: { status: { in: ['OPEN', 'IN_PROGRESS'] } } }),
      prisma.user.count({ where: { createdAt: { gte: startOfMonth } } }),
    ]);

    const recentPayments = await prisma.payment.findMany({
      where: { status: 'COMPLETED' },
      include: { user: { select: { id: true, email: true, name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    const recentRegistrations = await prisma.user.findMany({
      select: { id: true, email: true, name: true, createdAt: true, isVerified: true },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    const roleDistribution = await prisma.user.groupBy({
      by: ['role'],
      _count: true,
    });

    const challengePlans = await prisma.challengePlan.findMany({
      where: { isActive: true },
      select: { id: true, name: true, price: true, accountSize: true, _count: { select: { userChallenges: true } } },
    });

    res.json({
      overview: {
        totalUsers,
        verifiedUsers,
        unverifiedUsers: totalUsers - verifiedUsers,
        activeChallenges,
        passedChallenges,
        failedChallenges,
        totalRevenue: totalRevenue._sum.amount || 0,
        monthRevenue: monthRevenue._sum.amount || 0,
        yearRevenue: yearRevenue._sum.amount || 0,
        pendingPayouts,
        pendingKyc,
        openTickets,
        monthRegistrations,
      },
      roleDistribution: roleDistribution.map((r) => ({ role: r.role, count: r._count })),
      challengePlans,
      recentPayments,
      recentRegistrations,
    });
  } catch (error) {
    logger.error('Admin stats error', { error });
    res.status(500).json({ message: 'Failed to fetch admin stats' });
  }
});

router.get('/payments', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string;

    const where: Record<string, any> = {};
    if (status) where.status = status;

    const total = await prisma.payment.count({ where });
    const payments = await prisma.payment.findMany({
      where,
      include: { user: { select: { id: true, email: true, name: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    res.json({
      payments,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    logger.error('List payments error', { error });
    res.status(500).json({ message: 'Failed to fetch payments' });
  }
});

router.get('/challenges', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string;

    const where: Record<string, any> = {};
    if (status) where.status = status;

    const total = await prisma.userChallenge.count({ where });
    const challenges = await prisma.userChallenge.findMany({
      where,
      include: {
        plan: true,
        user: { select: { id: true, email: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    res.json({
      challenges,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    logger.error('List challenges error', { error });
    res.status(500).json({ message: 'Failed to fetch challenges' });
  }
});

router.post('/challenges/:id/upgrade', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), async (req: Request, res: Response) => {
  try {
    const { additionalBalance } = req.body;
    const challenge = await prisma.userChallenge.findUnique({ where: { id: req.params.id } });
    if (!challenge) {
      res.status(404).json({ message: 'Challenge not found' });
      return;
    }

    const amount = additionalBalance || 50000;
    const updated = await prisma.userChallenge.update({
      where: { id: challenge.id },
      data: {
        currentBalance: { increment: amount },
        peakBalance: { increment: amount },
      },
    });

    await prisma.notification.create({
      data: {
        userId: challenge.userId,
        title: 'Account Upgraded',
        message: `Your funded account has been upgraded by $${amount.toFixed(2)}. New balance: $${updated.currentBalance.toFixed(2)}.`,
        type: 'FINANCE',
      },
    });

    res.json(updated);
  } catch (error) {
    logger.error('Upgrade challenge error', { error });
    res.status(500).json({ message: 'Failed to upgrade challenge' });
  }
});

router.post('/challenges/:id/disable', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), async (req: Request, res: Response) => {
  try {
    const challenge = await prisma.userChallenge.findUnique({
      where: { id: req.params.id },
      include: { plan: true },
    });
    if (!challenge) {
      res.status(404).json({ message: 'Challenge not found' });
      return;
    }

    await prisma.userChallenge.update({
      where: { id: challenge.id },
      data: { status: 'FAILED' },
    });

    await prisma.notification.create({
      data: {
        userId: challenge.userId,
        title: 'Account Disabled',
        message: `Your ${challenge.plan.name} account has been disabled due to rule breach.`,
        type: 'WARNING',
      },
    });

    res.json({ message: 'Challenge disabled' });
  } catch (error) {
    logger.error('Disable challenge error', { error });
    res.status(500).json({ message: 'Failed to disable challenge' });
  }
});

router.post('/users/:id/toggle-status', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { isSuspended: !user.isSuspended },
      select: { id: true, isSuspended: true },
    });

    await prisma.notification.create({
      data: {
        userId: user.id,
        title: updated.isSuspended ? 'Account Suspended' : 'Account Reactivated',
        message: updated.isSuspended
          ? 'Your account has been suspended by an admin.'
          : 'Your account has been reactivated by an admin.',
        type: 'WARNING',
      },
    });

    res.json(updated);
  } catch (error) {
    logger.error('Toggle user status error', { error });
    res.status(500).json({ message: 'Failed to toggle user status' });
  }
});

router.post(
  '/email/send',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN'),
  body('subject').trim().isLength({ min: 1 }).withMessage('Subject is required'),
  body('message').trim().isLength({ min: 1 }).withMessage('Message is required'),
  body('target').optional().isIn(['ALL', 'VERIFIED', 'ACTIVE_CHALLENGE']),
  validate,
  async (req: Request, res: Response) => {
    try {
      const { subject, message, target = 'ALL' } = req.body;

      let where: Record<string, any> = {};
      if (target === 'VERIFIED') where.isVerified = true;
      if (target === 'ACTIVE_CHALLENGE') {
        where.challenges = { some: { status: 'ACTIVE' } };
      }

      const users = await prisma.user.findMany({
        where,
        select: { id: true, email: true, name: true },
      });

      const notifications = users.map((u) => ({
        userId: u.id,
        title: subject,
        message,
        type: 'ADMIN',
        link: null,
      }));

      await prisma.notification.createMany({ data: notifications });

      logger.info(`Bulk email sent to ${users.length} users`, { subject, target });
      res.json({ message: `Notification dispatched to ${users.length} users`, sentCount: users.length });
    } catch (error) {
      logger.error('Send email error', { error });
      res.status(500).json({ message: 'Failed to send emails' });
    }
  }
);

router.get('/cms', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), async (_req: Request, res: Response) => {
  try {
    const settings = await prisma.cmsSetting.findMany();
    const cms: Record<string, string> = {};
    for (const s of settings) {
      cms[s.key] = s.value;
    }
    res.json(cms);
  } catch (error) {
    logger.error('Get CMS error', { error });
    res.status(500).json({ message: 'Failed to fetch CMS settings' });
  }
});

router.post(
  '/cms',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN'),
  body('settings').isObject().withMessage('Settings must be an object'),
  validate,
  async (req: Request, res: Response) => {
    try {
      const { settings } = req.body;

      const upserts = Object.entries(settings).map(([key, value]) =>
        prisma.cmsSetting.upsert({
          where: { key },
          update: { value: String(value) },
          create: { key, value: String(value) },
        })
      );

      await prisma.$transaction(upserts);
      res.json({ message: 'CMS settings updated', settings });
    } catch (error) {
      logger.error('Save CMS error', { error });
      res.status(500).json({ message: 'Failed to save CMS settings' });
    }
  }
);

router.get('/analytics', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), async (_req: Request, res: Response) => {
  try {
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const monthlyRevenue = await prisma.payment.groupBy({
      by: ['createdAt'],
      where: {
        status: 'COMPLETED',
        createdAt: { gte: sixMonthsAgo },
      },
      _sum: { amount: true },
    });

    const totalUsers = await prisma.user.count();
    const usersWithChallenges = await prisma.userChallenge.groupBy({
      by: ['userId'],
      _count: true,
    });
    const conversionRate = totalUsers > 0 ? (usersWithChallenges.length / totalUsers) * 100 : 0;

    const passedChallenges = await prisma.userChallenge.count({ where: { status: 'PASSED' } });
    const failedChallenges = await prisma.userChallenge.count({ where: { status: 'FAILED' } });
    const totalChallenges = await prisma.userChallenge.count();
    const passRate = totalChallenges > 0 ? (passedChallenges / totalChallenges) * 100 : 0;

    res.json({
      monthlyRevenue,
      conversionRate: Math.round(conversionRate * 10) / 10,
      passRate: Math.round(passRate * 10) / 10,
      totalUsers,
      usersWithChallenges: usersWithChallenges.length,
      passedChallenges,
      failedChallenges,
    });
  } catch (error) {
    logger.error('Analytics error', { error });
    res.status(500).json({ message: 'Failed to fetch analytics' });
  }
});

export default router;