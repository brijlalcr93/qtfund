import { Router, Request, Response } from 'express';
import { body } from 'express-validator';
import prisma from '../config/prisma.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { upload } from '../middleware/upload.js';
import logger from '../utils/logger.js';

const router = Router();

router.post(
  '/submit',
  authenticate,
  upload.fields([
    { name: 'documentFront', maxCount: 1 },
    { name: 'documentBack', maxCount: 1 },
    { name: 'selfie', maxCount: 1 },
  ]),
  body('fullName').trim().isLength({ min: 1 }).withMessage('Full name is required'),
  body('documentType').isIn(['PASSPORT', 'DRIVERS_LICENSE', 'NATIONAL_ID', 'RESIDENCE_PERMIT']).withMessage('Invalid document type'),
  body('documentNumber').optional().isString(),
  body('dateOfBirth').optional().isString(),
  body('nationality').optional().isString(),
  body('address').optional().isString(),
  body('city').optional().isString(),
  body('state').optional().isString(),
  body('postalCode').optional().isString(),
  body('country').optional().isString(),
  validate,
  async (req: Request, res: Response) => {
    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };

      if (!files?.documentFront?.[0]) {
        res.status(400).json({ message: 'Front of document is required' });
        return;
      }

      const existingKyc = await prisma.kyc.findFirst({
        where: { userId: req.user!.userId, status: 'PENDING' },
      });

      if (existingKyc) {
        res.status(400).json({ message: 'You already have a pending KYC submission' });
        return;
      }

      const kyc = await prisma.kyc.create({
        data: {
          userId: req.user!.userId,
          fullName: req.body.fullName,
          dateOfBirth: req.body.dateOfBirth || null,
          nationality: req.body.nationality || null,
          address: req.body.address || null,
          city: req.body.city || null,
          state: req.body.state || null,
          postalCode: req.body.postalCode || null,
          country: req.body.country || null,
          documentType: req.body.documentType,
          documentNumber: req.body.documentNumber || null,
          documentFront: files.documentFront[0].path,
          documentBack: files.documentBack?.[0]?.path || null,
          selfie: files.selfie?.[0]?.path || null,
        },
      });

      res.status(201).json({ message: 'KYC documents submitted successfully', kycId: kyc.id });
    } catch (error) {
      logger.error('Submit KYC error', { error });
      res.status(500).json({ message: 'Failed to submit KYC documents' });
    }
  }
);

router.get('/status', authenticate, async (req: Request, res: Response) => {
  try {
    const kyc = await prisma.kyc.findFirst({
      where: { userId: req.user!.userId },
      orderBy: { submittedAt: 'desc' },
    });

    if (!kyc) {
      res.json({ status: 'NOT_SUBMITTED' });
      return;
    }

    res.json({
      status: kyc.status,
      adminFeedback: kyc.adminFeedback,
      submittedAt: kyc.submittedAt,
      reviewedAt: kyc.reviewedAt,
    });
  } catch (error) {
    logger.error('KYC status error', { error });
    res.status(500).json({ message: 'Failed to fetch KYC status' });
  }
});

router.get('/', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string;

    const where: Record<string, any> = {};
    if (status) where.status = status;

    const total = await prisma.kyc.count({ where });
    const submissions = await prisma.kyc.findMany({
      where,
      include: {
        user: { select: { id: true, email: true, name: true } },
      },
      orderBy: { submittedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    res.json({
      submissions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error('List KYC error', { error });
    res.status(500).json({ message: 'Failed to fetch KYC submissions' });
  }
});

router.put('/:id/approve', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), async (req: Request, res: Response) => {
  try {
    const kyc = await prisma.kyc.findUnique({ where: { id: req.params.id } });
    if (!kyc) {
      res.status(404).json({ message: 'KYC submission not found' });
      return;
    }

    await prisma.kyc.update({
      where: { id: kyc.id },
      data: {
        status: 'APPROVED',
        reviewedAt: new Date(),
      },
    });

    await prisma.notification.create({
      data: {
        userId: kyc.userId,
        title: 'KYC Approved',
        message: 'Your identity verification has been approved. You can now access all platform features.',
        type: 'KYC',
      },
    });

    res.json({ message: 'KYC approved successfully' });
  } catch (error) {
    logger.error('Approve KYC error', { error });
    res.status(500).json({ message: 'Failed to approve KYC' });
  }
});

router.put(
  '/:id/reject',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN'),
  body('feedback').isString().withMessage('Feedback is required'),
  validate,
  async (req: Request, res: Response) => {
    try {
      const kyc = await prisma.kyc.findUnique({ where: { id: req.params.id } });
      if (!kyc) {
        res.status(404).json({ message: 'KYC submission not found' });
        return;
      }

      await prisma.kyc.update({
        where: { id: kyc.id },
        data: {
          status: 'REJECTED',
          adminFeedback: req.body.feedback,
          reviewedAt: new Date(),
        },
      });

      await prisma.notification.create({
        data: {
          userId: kyc.userId,
          title: 'KYC Rejected',
          message: `Your identity verification was rejected. Reason: ${req.body.feedback}`,
          type: 'KYC',
        },
      });

      res.json({ message: 'KYC rejected with feedback' });
    } catch (error) {
      logger.error('Reject KYC error', { error });
      res.status(500).json({ message: 'Failed to reject KYC' });
    }
  }
);

export default router;
