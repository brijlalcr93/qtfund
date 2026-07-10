import { Router, Request, Response } from 'express';
import { body } from 'express-validator';
import prisma from '../config/prisma.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import logger from '../utils/logger.js';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  try {
    const plans = await prisma.challengePlan.findMany({
      where: { isActive: true },
      orderBy: { price: 'asc' },
    });
    res.json(plans);
  } catch (error) {
    logger.error('List challenge plans error', { error });
    res.status(500).json({ message: 'Failed to fetch challenge plans' });
  }
});

router.post(
  '/',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN'),
  body('name').trim().isLength({ min: 1 }).withMessage('Name is required'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('accountSize').isFloat({ min: 0 }).withMessage('Account size must be a positive number'),
  body('profitTarget').isFloat({ min: 0 }).withMessage('Profit target must be a positive number'),
  body('maxDrawdown').isFloat({ min: 0 }).withMessage('Max drawdown must be a positive number'),
  body('durationDays').isInt({ min: 1 }).withMessage('Duration must be at least 1 day'),
  validate,
  async (req: Request, res: Response) => {
    try {
      const plan = await prisma.challengePlan.create({
        data: {
          name: req.body.name,
          description: req.body.description || null,
          price: req.body.price,
          accountSize: req.body.accountSize,
          profitTarget: req.body.profitTarget,
          maxDrawdown: req.body.maxDrawdown,
          durationDays: req.body.durationDays,
        },
      });

      res.status(201).json(plan);
    } catch (error) {
      logger.error('Create challenge plan error', { error });
      res.status(500).json({ message: 'Failed to create challenge plan' });
    }
  }
);

router.put(
  '/:id',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN'),
  async (req: Request, res: Response) => {
    try {
      const { name, description, price, accountSize, profitTarget, maxDrawdown, durationDays, isActive } = req.body;
      const updateData: Record<string, any> = {};

      if (name !== undefined) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (price !== undefined) updateData.price = price;
      if (accountSize !== undefined) updateData.accountSize = accountSize;
      if (profitTarget !== undefined) updateData.profitTarget = profitTarget;
      if (maxDrawdown !== undefined) updateData.maxDrawdown = maxDrawdown;
      if (durationDays !== undefined) updateData.durationDays = durationDays;
      if (isActive !== undefined) updateData.isActive = isActive;

      const plan = await prisma.challengePlan.update({
        where: { id: req.params.id },
        data: updateData,
      });

      res.json(plan);
    } catch (error) {
      logger.error('Update challenge plan error', { error });
      res.status(500).json({ message: 'Failed to update challenge plan' });
    }
  }
);

router.delete('/:id', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), async (req: Request, res: Response) => {
  try {
    await prisma.challengePlan.update({
      where: { id: req.params.id },
      data: { isActive: false },
    });

    res.json({ message: 'Challenge plan deactivated' });
  } catch (error) {
    logger.error('Delete challenge plan error', { error });
    res.status(500).json({ message: 'Failed to delete challenge plan' });
  }
});

router.get('/user', authenticate, async (req: Request, res: Response) => {
  try {
    const challenges = await prisma.userChallenge.findMany({
      where: { userId: req.user!.userId },
      include: {
        plan: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(challenges);
  } catch (error) {
    logger.error('Get user challenges error', { error });
    res.status(500).json({ message: 'Failed to fetch challenges' });
  }
});

router.post(
  '/purchase',
  authenticate,
  body('planId').isString().withMessage('Plan ID is required'),
  body('paymentId').isString().withMessage('Payment ID is required'),
  validate,
  async (req: Request, res: Response) => {
    try {
      const { planId, paymentId } = req.body;

      const plan = await prisma.challengePlan.findUnique({ where: { id: planId } });
      if (!plan || !plan.isActive) {
        res.status(404).json({ message: 'Challenge plan not found or inactive' });
        return;
      }

      const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
      if (!payment || payment.userId !== req.user!.userId || payment.status !== 'COMPLETED') {
        res.status(400).json({ message: 'Invalid or uncompleted payment' });
        return;
      }

      const startDate = new Date();
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + plan.durationDays);

      const challenge = await prisma.userChallenge.create({
        data: {
          userId: req.user!.userId,
          planId: plan.id,
          currentBalance: plan.accountSize,
          peakBalance: plan.accountSize,
          startDate,
          endDate,
          lastActivityDate: startDate,
        },
        include: { plan: true },
      });

      await prisma.notification.create({
        data: {
          userId: req.user!.userId,
          title: 'Challenge Started',
          message: `Your ${plan.name} challenge has been activated! You have ${plan.durationDays} days to reach the profit target.`,
          type: 'CHALLENGE',
        },
      });

      res.status(201).json(challenge);
    } catch (error) {
      logger.error('Purchase challenge error', { error });
      res.status(500).json({ message: 'Failed to purchase challenge' });
    }
  }
);

router.post('/:id/reset', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), async (req: Request, res: Response) => {
  try {
    const challenge = await prisma.userChallenge.findUnique({
      where: { id: req.params.id },
      include: { plan: true },
    });

    if (!challenge) {
      res.status(404).json({ message: 'Challenge not found' });
      return;
    }

    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + challenge.plan.durationDays);

    const updated = await prisma.userChallenge.update({
      where: { id: challenge.id },
      data: {
        status: 'ACTIVE',
        currentBalance: challenge.plan.accountSize,
        peakBalance: challenge.plan.accountSize,
        profit: 0,
        trades: 0,
        startDate,
        endDate,
        lastActivityDate: startDate,
        resetCount: { increment: 1 },
      },
    });

    await prisma.notification.create({
      data: {
        userId: challenge.userId,
        title: 'Challenge Reset',
        message: `Your ${challenge.plan.name} challenge has been reset by an admin.`,
        type: 'CHALLENGE',
      },
    });

    res.json(updated);
  } catch (error) {
    logger.error('Reset challenge error', { error });
    res.status(500).json({ message: 'Failed to reset challenge' });
  }
});

export default router;
