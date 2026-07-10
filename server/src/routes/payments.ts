import { Router, Request, Response } from 'express';
import { body } from 'express-validator';
import crypto from 'crypto';
import prisma from '../config/prisma.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import logger from '../utils/logger.js';

const router = Router();

function getRazorpayInstance(): any {
  const Razorpay = require('razorpay');
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
}

router.post(
  '/create-order',
  authenticate,
  body('amount').isFloat({ min: 1 }).withMessage('Amount must be at least 1'),
  body('currency').optional().isString(),
  body('gateway').isIn(['razorpay', 'stripe']).withMessage('Gateway must be razorpay or stripe'),
  body('challengePlanId').optional().isString(),
  body('couponCode').optional().isString(),
  validate,
  async (req: Request, res: Response) => {
    try {
      const { amount, currency = 'INR', gateway, challengePlanId, couponCode } = req.body;
      let finalAmount = amount;
      let discountAmount = 0;

      if (couponCode) {
        const coupon = await prisma.coupon.findUnique({ where: { code: couponCode } });
        if (!coupon || !coupon.isActive) {
          res.status(400).json({ message: 'Invalid coupon code' });
          return;
        }

        const now = new Date();
        if (now < coupon.validFrom || now > coupon.validUntil) {
          res.status(400).json({ message: 'Coupon has expired' });
          return;
        }

        if (coupon.maxUsage && coupon.usedCount >= coupon.maxUsage) {
          res.status(400).json({ message: 'Coupon usage limit reached' });
          return;
        }

        if (coupon.minAmount && amount < coupon.minAmount) {
          res.status(400).json({ message: `Minimum amount of $${coupon.minAmount} required for this coupon` });
          return;
        }

        if (coupon.discountType === 'PERCENTAGE') {
          discountAmount = (amount * coupon.discountValue) / 100;
        } else {
          discountAmount = coupon.discountValue;
        }

        finalAmount = Math.max(0, amount - discountAmount);

        await prisma.coupon.update({
          where: { code: couponCode },
          data: { usedCount: { increment: 1 } },
        });
      }

      const payment = await prisma.payment.create({
        data: {
          userId: req.user!.userId,
          amount: finalAmount,
          currency,
          gateway,
          status: 'PENDING',
          description: challengePlanId ? 'Challenge purchase' : 'Deposit',
          challengePlanId: challengePlanId || null,
          couponCode: couponCode || null,
          discountAmount,
        },
      });

      if (gateway === 'razorpay') {
        const razorpay = getRazorpayInstance();

        const options = {
          amount: Math.round(finalAmount * 100),
          currency,
          receipt: payment.id,
          notes: {
            userId: req.user!.userId,
            paymentId: payment.id,
          },
        };

        const order = await razorpay.orders.create(options);

        await prisma.payment.update({
          where: { id: payment.id },
          data: { gatewayOrderId: order.id },
        });

        res.json({
          gateway: 'razorpay',
          orderId: order.id,
          amount: order.amount,
          currency: order.currency,
          keyId: process.env.RAZORPAY_KEY_ID,
          paymentId: payment.id,
        });
      } else if (gateway === 'stripe') {
        const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(finalAmount * 100),
          currency: currency.toLowerCase(),
          metadata: {
            userId: req.user!.userId,
            paymentId: payment.id,
          },
        });

        await prisma.payment.update({
          where: { id: payment.id },
          data: { gatewayOrderId: paymentIntent.id },
        });

        res.json({
          gateway: 'stripe',
          clientSecret: paymentIntent.client_secret,
          paymentId: payment.id,
        });
      }
    } catch (error) {
      logger.error('Create order error', { error });
      res.status(500).json({ message: 'Failed to create payment order' });
    }
  }
);

router.post(
  '/verify',
  authenticate,
  body('paymentId').isString().withMessage('Payment ID is required'),
  body('gateway').isIn(['razorpay', 'stripe']).withMessage('Gateway must be razorpay or stripe'),
  body('gatewayPaymentId').optional().isString(),
  body('gatewaySignature').optional().isString(),
  validate,
  async (req: Request, res: Response) => {
    try {
      const { paymentId, gateway, gatewayPaymentId, gatewaySignature } = req.body;

      const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
      if (!payment || payment.userId !== req.user!.userId) {
        res.status(404).json({ message: 'Payment not found' });
        return;
      }

      if (payment.status === 'COMPLETED') {
        res.json({ message: 'Payment already verified', payment });
        return;
      }

      if (gateway === 'razorpay') {
        const expectedSignature = crypto
          .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
          .update(`${payment.gatewayOrderId}|${gatewayPaymentId}`)
          .digest('hex');

        if (expectedSignature !== gatewaySignature) {
          await prisma.payment.update({
            where: { id: payment.id },
            data: { status: 'FAILED' },
          });
          res.status(400).json({ message: 'Payment verification failed' });
          return;
        }
      }

      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'COMPLETED',
          gatewayPaymentId: gatewayPaymentId || null,
          gatewaySignature: gatewaySignature || null,
        },
      });

      await prisma.user.update({
        where: { id: req.user!.userId },
        data: {
          totalDeposited: { increment: payment.amount },
          balance: { increment: payment.amount },
        },
      });

      if (payment.couponCode) {
        await prisma.coupon.update({
          where: { code: payment.couponCode },
          data: { usedCount: { increment: 1 } },
        });
      }

      await prisma.notification.create({
        data: {
          userId: req.user!.userId,
          title: 'Payment Successful',
          message: `Your payment of $${payment.amount.toFixed(2)} has been completed.`,
          type: 'FINANCE',
        },
      });

      res.json({ message: 'Payment verified successfully', payment: { ...payment, status: 'COMPLETED' } });
    } catch (error) {
      logger.error('Verify payment error', { error });
      res.status(500).json({ message: 'Failed to verify payment' });
    }
  }
);

router.post('/refund', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), async (req: Request, res: Response) => {
  try {
    const { paymentId } = req.body;

    const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment || payment.status !== 'COMPLETED') {
      res.status(400).json({ message: 'Payment not found or not completed' });
      return;
    }

    await prisma.payment.update({
      where: { id: paymentId },
      data: { status: 'REFUNDED' },
    });

    await prisma.user.update({
      where: { id: payment.userId },
      data: {
        balance: { decrement: payment.amount },
        totalDeposited: { decrement: payment.amount },
      },
    });

    res.json({ message: 'Payment refunded successfully' });
  } catch (error) {
    logger.error('Refund error', { error });
    res.status(500).json({ message: 'Failed to refund payment' });
  }
});

router.get('/history', authenticate, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const total = await prisma.payment.count({ where: { userId: req.user!.userId } });
    const payments = await prisma.payment.findMany({
      where: { userId: req.user!.userId },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    res.json({
      payments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error('Payment history error', { error });
    res.status(500).json({ message: 'Failed to fetch payment history' });
  }
});

router.post('/webhook/razorpay', async (req: Request, res: Response) => {
  try {
    const secret = process.env.RAZORPAY_KEY_SECRET;
    const signature = req.headers['x-razorpay-signature'] as string;

    const expectedSignature = crypto
      .createHmac('sha256', secret!)
      .update(JSON.stringify(req.body))
      .digest('hex');

    if (expectedSignature !== signature) {
      res.status(400).json({ message: 'Invalid signature' });
      return;
    }

    const { event, payload } = req.body;

    if (event === 'payment.captured') {
      const payment = payload.payment.entity;
      const paymentId = payment.notes?.paymentId;

      if (paymentId) {
        const existingPayment = await prisma.payment.findUnique({ where: { id: paymentId } });
        if (existingPayment && existingPayment.status === 'PENDING') {
          await prisma.payment.update({
            where: { id: paymentId },
            data: {
              status: 'COMPLETED',
              gatewayPaymentId: payment.id,
            },
          });

          await prisma.user.update({
            where: { id: existingPayment.userId },
            data: {
              totalDeposited: { increment: existingPayment.amount },
              balance: { increment: existingPayment.amount },
            },
          });
        }
      }
    }

    res.json({ received: true });
  } catch (error) {
    logger.error('Razorpay webhook error', { error });
    res.status(500).json({ message: 'Webhook processing failed' });
  }
});

router.post('/webhook/stripe', async (req: Request, res: Response) => {
  try {
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const sig = req.headers['stripe-signature'] as string;

    let event;
    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      res.status(400).json({ message: 'Invalid signature' });
      return;
    }

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;
      const paymentId = paymentIntent.metadata?.paymentId;

      if (paymentId) {
        const existingPayment = await prisma.payment.findUnique({ where: { id: paymentId } });
        if (existingPayment && existingPayment.status === 'PENDING') {
          await prisma.payment.update({
            where: { id: paymentId },
            data: {
              status: 'COMPLETED',
              gatewayPaymentId: paymentIntent.id,
            },
          });

          await prisma.user.update({
            where: { id: existingPayment.userId },
            data: {
              totalDeposited: { increment: existingPayment.amount },
              balance: { increment: existingPayment.amount },
            },
          });
        }
      }
    }

    res.json({ received: true });
  } catch (error) {
    logger.error('Stripe webhook error', { error });
    res.status(500).json({ message: 'Webhook processing failed' });
  }
});

export default router;
