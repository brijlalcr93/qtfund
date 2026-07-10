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
  body('subject').trim().isLength({ min: 1 }).withMessage('Subject is required'),
  body('description').trim().isLength({ min: 1 }).withMessage('Description is required'),
  body('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  validate,
  async (req: Request, res: Response) => {
    try {
      const ticket = await prisma.ticket.create({
        data: {
          userId: req.user!.userId,
          subject: req.body.subject,
          description: req.body.description,
          priority: req.body.priority || 'MEDIUM',
        },
      });

      await prisma.ticketMessage.create({
        data: {
          ticketId: ticket.id,
          userId: req.user!.userId,
          message: req.body.description,
        },
      });

      res.status(201).json(ticket);
    } catch (error) {
      logger.error('Create ticket error', { error });
      res.status(500).json({ message: 'Failed to create ticket' });
    }
  }
);

router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const where: Record<string, any> = { userId: req.user!.userId };

    const total = await prisma.ticket.count({ where });
    const tickets = await prisma.ticket.findMany({
      where,
      include: {
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          select: { message: true, createdAt: true },
        },
        _count: { select: { messages: true } },
      },
      orderBy: { updatedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    res.json({
      tickets,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error('List tickets error', { error });
    res.status(500).json({ message: 'Failed to fetch tickets' });
  }
});

router.get('/all', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string;
    const priority = req.query.priority as string;

    const where: Record<string, any> = {};
    if (status) where.status = status;
    if (priority) where.priority = priority;

    const total = await prisma.ticket.count({ where });
    const tickets = await prisma.ticket.findMany({
      where,
      include: {
        user: { select: { id: true, email: true, name: true } },
        _count: { select: { messages: true } },
      },
      orderBy: [
        { priority: 'desc' },
        { updatedAt: 'desc' },
      ],
      skip: (page - 1) * limit,
      take: limit,
    });

    res.json({
      tickets,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error('List all tickets error', { error });
    res.status(500).json({ message: 'Failed to fetch tickets' });
  }
});

router.get('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id: req.params.id },
      include: {
        user: { select: { id: true, email: true, name: true } },
        messages: {
          include: {
            user: { select: { id: true, email: true, name: true, role: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!ticket) {
      res.status(404).json({ message: 'Ticket not found' });
      return;
    }

    if (ticket.userId !== req.user!.userId && !['ADMIN', 'SUPER_ADMIN'].includes(req.user!.role)) {
      res.status(403).json({ message: 'Access denied' });
      return;
    }

    res.json(ticket);
  } catch (error) {
    logger.error('Get ticket error', { error });
    res.status(500).json({ message: 'Failed to fetch ticket' });
  }
});

router.post(
  '/:id/reply',
  authenticate,
  body('message').trim().isLength({ min: 1 }).withMessage('Message is required'),
  validate,
  async (req: Request, res: Response) => {
    try {
      const ticket = await prisma.ticket.findUnique({ where: { id: req.params.id } });
      if (!ticket) {
        res.status(404).json({ message: 'Ticket not found' });
        return;
      }

      if (ticket.userId !== req.user!.userId && !['ADMIN', 'SUPER_ADMIN'].includes(req.user!.role)) {
        res.status(403).json({ message: 'Access denied' });
        return;
      }

      if (ticket.status === 'RESOLVED' || ticket.status === 'CLOSED') {
        res.status(400).json({ message: 'Cannot reply to a resolved or closed ticket' });
        return;
      }

      const isStaff = ['ADMIN', 'SUPER_ADMIN'].includes(req.user!.role);

      const message = await prisma.ticketMessage.create({
        data: {
          ticketId: ticket.id,
          userId: req.user!.userId,
          message: req.body.message,
          isStaff,
        },
        include: {
          user: { select: { id: true, email: true, name: true, role: true } },
        },
      });

      if (isStaff && ticket.status === 'OPEN') {
        await prisma.ticket.update({
          where: { id: ticket.id },
          data: { status: 'IN_PROGRESS' },
        });
      }

      await prisma.ticket.update({
        where: { id: ticket.id },
        data: { updatedAt: new Date() },
      });

      res.status(201).json(message);
    } catch (error) {
      logger.error('Reply ticket error', { error });
      res.status(500).json({ message: 'Failed to reply to ticket' });
    }
  }
);

router.put(
  '/:id/status',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN'),
  body('status').isIn(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']).withMessage('Invalid status'),
  validate,
  async (req: Request, res: Response) => {
    try {
      const ticket = await prisma.ticket.update({
        where: { id: req.params.id },
        data: { status: req.body.status },
      });

      await prisma.notification.create({
        data: {
          userId: ticket.userId,
          title: 'Ticket Status Updated',
          message: `Your ticket "${ticket.subject}" has been updated to ${req.body.status}.`,
          type: 'TICKET',
          link: `/tickets/${ticket.id}`,
        },
      });

      res.json(ticket);
    } catch (error) {
      logger.error('Update ticket status error', { error });
      res.status(500).json({ message: 'Failed to update ticket status' });
    }
  }
);

router.put(
  '/:id/assign',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN'),
  body('assignedTo').optional().isString(),
  validate,
  async (req: Request, res: Response) => {
    try {
      const ticket = await prisma.ticket.update({
        where: { id: req.params.id },
        data: { assignedTo: req.body.assignedTo || null },
      });

      res.json(ticket);
    } catch (error) {
      logger.error('Assign ticket error', { error });
      res.status(500).json({ message: 'Failed to assign ticket' });
    }
  }
);

export default router;
