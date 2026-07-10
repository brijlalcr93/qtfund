import { Router, Request, Response } from 'express';
import { body } from 'express-validator';
import prisma from '../config/prisma.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import logger from '../utils/logger.js';

const router = Router();

router.post(
  '/',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN'),
  body('code').trim().isLength({ min: 1 }).withMessage('Code is required'),
  body('discountType').isIn(['PERCENTAGE', 'FIXED']).withMessage('Discount type must be PERCENTAGE or FIXED'),
  body('discountValue').isFloat({ min: 0 }).withMessage('Discount value must be a positive number'),
  body('validFrom').isISO8601().withMessage('Valid from date is required'),
  body('validUntil').isISO8601().withMessage('Valid until date is required'),
  body('minAmount').optional().isFloat({ min: 0 }),
  body('maxUsage').optional().isInt({ min: 1 }),
  validate,
  async (req: Request, res: Response) => {
    try {
      const existing = await prisma.coupon.findUnique({ where: { code: req.body.code } });
      if (existing) {
        res.status(409).json({ message: 'Coupon code already exists' });
        return;
      }

      if (req.body.discountType === 'PERCENTAGE' && req.body.discountValue > 100) {
        res.status(400).json({ message: 'Percentage discount must be between 0 and 100' });
        return;
      }

      const coupon = await prisma.coupon.create({
        data: {
          code: req.body.code.toUpperCase(),
          discountType: req.body.discountType,
          discountValue: req.body.discountValue,
          minAmount: req.body.minAmount || null,
          maxUsage: req.body.maxUsage || null,
          validFrom: new Date(req.body.validFrom),
          validUntil: new Date(req.body.validUntil),
        },
      });

      res.status(201).json(coupon);
    } catch (error) {
      logger.error('Create coupon error', { error });
      res.status(500).json({ message: 'Failed to create coupon' });
    }
  }
);

router.get('/', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), async (_req: Request, res: Response) => {
  try {
    const coupons = await prisma.coupon.findMany({
      orderBy: { createdAt: 'desc' },
    });

    res.json(coupons);
  } catch (error) {
    logger.error('List coupons error', { error });
    res.status(500).json({ message: 'Failed to fetch coupons' });
  }
});

router.delete('/:code', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), async (req: Request, res: Response) => {
  try {
    await prisma.coupon.update({
      where: { code: req.params.code },
      data: { isActive: false },
    });

    res.json({ message: 'Coupon deactivated' });
  } catch (error) {
    logger.error('Delete coupon error', { error });
    res.status(500).json({ message: 'Failed to delete coupon' });
  }
});

router.post(
  '/validate',
  body('code').trim().isLength({ min: 1 }).withMessage('Coupon code is required'),
  body('amount').optional().isFloat({ min: 0 }),
  validate,
  async (req: Request, res: Response) => {
    try {
      const { code, amount } = req.body;

      const coupon = await prisma.coupon.findUnique({ where: { code: code.toUpperCase() } });
      if (!coupon) {
        res.status(404).json({ message: 'Invalid coupon code', valid: false });
        return;
      }

      if (!coupon.isActive) {
        res.status(400).json({ message: 'Coupon is no longer active', valid: false });
        return;
      }

      const now = new Date();
      if (now < coupon.validFrom || now > coupon.validUntil) {
        res.status(400).json({ message: 'Coupon has expired', valid: false });
        return;
      }

      if (coupon.maxUsage && coupon.usedCount >= coupon.maxUsage) {
        res.status(400).json({ message: 'Coupon usage limit reached', valid: false });
        return;
      }

      if (coupon.minAmount && amount && amount < coupon.minAmount) {
        res.status(400).json({
          message: `Minimum order amount of $${coupon.minAmount.toFixed(2)} required`,
          valid: false,
          minAmount: coupon.minAmount,
        });
        return;
      }

      let discountAmount = 0;
      if (amount) {
        if (coupon.discountType === 'PERCENTAGE') {
          discountAmount = (amount * coupon.discountValue) / 100;
        } else {
          discountAmount = coupon.discountValue;
        }
        discountAmount = Math.min(discountAmount, amount);
      }

      res.json({
        valid: true,
        coupon: {
          code: coupon.code,
          discountType: coupon.discountType,
          discountValue: coupon.discountValue,
          discountAmount,
        },
      });
    } catch (error) {
      logger.error('Validate coupon error', { error });
      res.status(500).json({ message: 'Failed to validate coupon' });
    }
  }
);

export default router;
