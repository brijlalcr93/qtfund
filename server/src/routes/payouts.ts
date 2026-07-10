import { Router, Request, Response } from 'express';
import { body } from 'express-validator';
import prisma from '../config/prisma.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import logger from '../utils/logger.js';

const router = Router();

const PAYOUT_FEE_PERCENTAGE = 2;

router.post(
  '/request',
  authenticate,
  body('amount').isFloat({ min: 10 }).withMessage('Minimum payout amount is $10'),
  body('gateway').optional().isString(),
  body('accountDetails').isString().withMessage('Account details are required'),
  validate,
  async (req: Request, res: Response) => {
    try {
      const { amount, gateway, accountDetails } = req.body;

      const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
      if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
      }

      if (user.balance < amount) {
        res.status(400).json({ message: 'Insufficient balance' });
        return;
      }

      const fee = (amount * PAYOUT_FEE_PERCENTAGE) / 100;
      const netAmount = amount - fee;

      const payout = await prisma.payout.create({
        data: {
          userId: user.id,
          amount,
          fee,
          netAmount,
          gateway: gateway || null,
          accountDetails,
        },
      });

      await prisma.user.update({
        where: { id: user.id },
        data: {
          balance: { decrement: amount },
        },
      });

      await prisma.notification.create({
        data: {
          userId: user.id,
          title: 'Payout Requested',
          message: `Your payout request for $${amount.toFixed(2)} has been submitted. (Fee: $${fee.toFixed(2)}, Net: $${netAmount.toFixed(2)})`,
          type: 'FINANCE',
        },
      });

      res.status(201).json(payout);
    } catch (error) {
      logger.error('Request payout error', { error });
      res.status(500).json({ message: 'Failed to submit payout request' });
    }
  }
);

router.get('/', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string;

    const where: Record<string, any> = {};
    if (status) where.status = status;

    const total = await prisma.payout.count({ where });
    const payouts = await prisma.payout.findMany({
      where,
      include: {
        user: { select: { id: true, email: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    res.json({
      payouts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error('List payouts error', { error });
    res.status(500).json({ message: 'Failed to fetch payouts' });
  }
});

router.get('/user', authenticate, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const total = await prisma.payout.count({ where: { userId: req.user!.userId } });
    const payouts = await prisma.payout.findMany({
      where: { userId: req.user!.userId },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    res.json({
      payouts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error('User payouts error', { error });
    res.status(500).json({ message: 'Failed to fetch payouts' });
  }
});

router.put('/:id/approve', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), async (req: Request, res: Response) => {
  try {
    const payout = await prisma.payout.findUnique({ where: { id: req.params.id } });
    if (!payout || payout.status !== 'PENDING') {
      res.status(400).json({ message: 'Payout not found or already processed' });
      return;
    }

    await prisma.payout.update({
      where: { id: payout.id },
      data: { status: 'APPROVED' },
    });

    await prisma.notification.create({
      data: {
        userId: payout.userId,
        title: 'Payout Approved',
        message: `Your payout request for $${payout.amount.toFixed(2)} has been approved and is being processed.`,
        type: 'FINANCE',
      },
    });

    res.json({ message: 'Payout approved' });
  } catch (error) {
    logger.error('Approve payout error', { error });
    res.status(500).json({ message: 'Failed to approve payout' });
  }
});

router.put('/:id/reject', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), async (req: Request, res: Response) => {
  try {
    const { reason } = req.body;
    const payout = await prisma.payout.findUnique({ where: { id: req.params.id } });
    if (!payout || payout.status !== 'PENDING') {
      res.status(400).json({ message: 'Payout not found or already processed' });
      return;
    }

    await prisma.payout.update({
      where: { id: payout.id },
      data: {
        status: 'REJECTED',
        adminNote: reason || null,
      },
    });

    await prisma.user.update({
      where: { id: payout.userId },
      data: {
        balance: { increment: payout.amount },
      },
    });

    await prisma.notification.create({
      data: {
        userId: payout.userId,
        title: 'Payout Rejected',
        message: `Your payout request for $${payout.amount.toFixed(2)} has been rejected.${reason ? ` Reason: ${reason}` : ''}`,
        type: 'FINANCE',
      },
    });

    res.json({ message: 'Payout rejected' });
  } catch (error) {
    logger.error('Reject payout error', { error });
    res.status(500).json({ message: 'Failed to reject payout' });
  }
});

router.put('/:id/complete', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), async (req: Request, res: Response) => {
  try {
    const payout = await prisma.payout.findUnique({ where: { id: req.params.id } });
    if (!payout || payout.status !== 'APPROVED') {
      res.status(400).json({ message: 'Payout not found or not approved' });
      return;
    }

    await prisma.payout.update({
      where: { id: payout.id },
      data: {
        status: 'COMPLETED',
        processedAt: new Date(),
      },
    });

    await prisma.user.update({
      where: { id: payout.userId },
      data: {
        totalWithdrawn: { increment: payout.amount },
      },
    });

    await prisma.notification.create({
      data: {
        userId: payout.userId,
        title: 'Payout Completed',
        message: `Your payout of $${payout.netAmount.toFixed(2)} has been sent to your account.`,
        type: 'FINANCE',
      },
    });

    res.json({ message: 'Payout completed' });
  } catch (error) {
    logger.error('Complete payout error', { error });
    res.status(500).json({ message: 'Failed to complete payout' });
  }
});

router.get('/export', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), async (req: Request, res: Response) => {
  try {
    const status = req.query.status as string;
    const where: Record<string, any> = {};
    if (status) where.status = status;

    const payouts = await prisma.payout.findMany({
      where,
      include: {
        user: { select: { id: true, email: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const csvLines = ['ID,User,Email,Amount,Fee,Net Amount,Status,Account Details,Created At,Processed At'];
    for (const p of payouts) {
      csvLines.push(
        `"${p.id}","${p.user.name}","${p.user.email}",${p.amount},${p.fee},${p.netAmount},"${p.status}","${(p.accountDetails || '').replace(/"/g, '""')}","${p.createdAt.toISOString()}","${p.processedAt ? p.processedAt.toISOString() : ''}"`
      );
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=payouts.csv');
    res.send(csvLines.join('\n'));
  } catch (error) {
    logger.error('Export payouts error', { error });
    res.status(500).json({ message: 'Failed to export payouts' });
  }
});

export default router;
