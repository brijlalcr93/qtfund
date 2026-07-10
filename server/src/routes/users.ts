import { Router, Request, Response } from 'express';
import { body } from 'express-validator';
import prisma from '../config/prisma.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import logger from '../utils/logger.js';

const router = Router();

router.get('/', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string;
    const role = req.query.role as string;
    const status = req.query.status as string;

    const where: Record<string, any> = {};

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (role) where.role = role;
    if (status === 'suspended') where.isSuspended = true;
    if (status === 'banned') where.isBanned = true;
    if (status === 'active') {
      where.isSuspended = false;
      where.isBanned = false;
    }

    const total = await prisma.user.count({ where });
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isVerified: true,
        isSuspended: true,
        isBanned: true,
        balance: true,
        totalDeposited: true,
        totalWithdrawn: true,
        affiliateCode: true,
        createdAt: true,
        _count: {
          select: {
            challenges: true,
            payments: true,
            tickets: true,
          },
        },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error('List users error', { error });
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

router.get('/:id', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isVerified: true,
        isSuspended: true,
        isBanned: true,
        balance: true,
        totalDeposited: true,
        totalWithdrawn: true,
        affiliateCode: true,
        commissionRate: true,
        referredBy: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            challenges: true,
            payments: true,
            payouts: true,
            kycSubmissions: true,
            tickets: true,
          },
        },
      },
    });

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.json(user);
  } catch (error) {
    logger.error('Get user error', { error });
    res.status(500).json({ message: 'Failed to fetch user' });
  }
});

router.put(
  '/:id',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN'),
  body('name').optional().trim().isLength({ min: 1 }),
  body('role').optional().isIn(['USER', 'ADMIN', 'SUPER_ADMIN']),
  body('commissionRate').optional().isFloat({ min: 0, max: 100 }),
  validate,
  async (req: Request, res: Response) => {
    try {
      const { name, role, commissionRate } = req.body;
      const updateData: Record<string, any> = {};

      if (name) updateData.name = name;
      if (role) updateData.role = role;
      if (commissionRate !== undefined) updateData.commissionRate = commissionRate;

      const user = await prisma.user.update({
        where: { id: req.params.id },
        data: updateData,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          commissionRate: true,
        },
      });

      res.json(user);
    } catch (error) {
      logger.error('Update user error', { error });
      res.status(500).json({ message: 'Failed to update user' });
    }
  }
);

router.delete('/:id', authenticate, authorize('SUPER_ADMIN'), async (req: Request, res: Response) => {
  try {
    await prisma.user.delete({ where: { id: req.params.id } });
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    logger.error('Delete user error', { error });
    res.status(500).json({ message: 'Failed to delete user' });
  }
});

router.post('/:id/suspend', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { isSuspended: true },
      select: { id: true, isSuspended: true },
    });

    await prisma.notification.create({
      data: {
        userId: user.id,
        title: 'Account Suspended',
        message: 'Your account has been suspended. Please contact support for more information.',
        type: 'WARNING',
      },
    });

    res.json(user);
  } catch (error) {
    logger.error('Suspend user error', { error });
    res.status(500).json({ message: 'Failed to suspend user' });
  }
});

router.post('/:id/ban', authenticate, authorize('SUPER_ADMIN'), async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { isBanned: true, isSuspended: true },
      select: { id: true, isBanned: true },
    });

    await prisma.refreshToken.deleteMany({ where: { userId: user.id } });

    res.json(user);
  } catch (error) {
    logger.error('Ban user error', { error });
    res.status(500).json({ message: 'Failed to ban user' });
  }
});

router.post(
  '/:id/balance',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN'),
  body('amount').isFloat().withMessage('Amount must be a number'),
  body('type').isIn(['ADD', 'SUBTRACT', 'SET']).withMessage('Type must be ADD, SUBTRACT, or SET'),
  body('reason').optional().isString(),
  validate,
  async (req: Request, res: Response) => {
    try {
      const { amount, type, reason } = req.body;

      const user = await prisma.user.findUnique({ where: { id: req.params.id } });
      if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
      }

      let newBalance: number;
      switch (type) {
        case 'ADD':
          newBalance = user.balance + amount;
          break;
        case 'SUBTRACT':
          newBalance = Math.max(0, user.balance - amount);
          break;
        case 'SET':
          newBalance = amount;
          break;
        default:
          newBalance = user.balance;
      }

      await prisma.user.update({
        where: { id: user.id },
        data: { balance: newBalance },
      });

      await prisma.notification.create({
        data: {
          userId: user.id,
          title: 'Balance Updated',
          message: `Your account balance has been ${type.toLowerCase()}ed by $${amount.toFixed(2)}${reason ? `: ${reason}` : ''}. New balance: $${newBalance.toFixed(2)}`,
          type: 'FINANCE',
        },
      });

      res.json({ balance: newBalance });
    } catch (error) {
      logger.error('Adjust balance error', { error });
      res.status(500).json({ message: 'Failed to adjust balance' });
    }
  }
);

export default router;
