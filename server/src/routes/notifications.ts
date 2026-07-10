import { Router, Request, Response } from 'express';
import prisma from '../config/prisma.js';
import { authenticate } from '../middleware/auth.js';
import logger from '../utils/logger.js';

const router = Router();

router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const unreadOnly = req.query.unreadOnly === 'true';

    const where: Record<string, any> = { userId: req.user!.userId };
    if (unreadOnly) where.isRead = false;

    const total = await prisma.notification.count({ where });
    const unreadCount = await prisma.notification.count({
      where: { userId: req.user!.userId, isRead: false },
    });

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    res.json({
      notifications,
      unreadCount,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error('Get notifications error', { error });
    res.status(500).json({ message: 'Failed to fetch notifications' });
  }
});

router.put('/:id/read', authenticate, async (req: Request, res: Response) => {
  try {
    const notification = await prisma.notification.findFirst({
      where: { id: req.params.id, userId: req.user!.userId },
    });

    if (!notification) {
      res.status(404).json({ message: 'Notification not found' });
      return;
    }

    await prisma.notification.update({
      where: { id: req.params.id },
      data: { isRead: true },
    });

    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    logger.error('Mark notification read error', { error });
    res.status(500).json({ message: 'Failed to mark notification as read' });
  }
});

router.put('/read-all', authenticate, async (req: Request, res: Response) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user!.userId, isRead: false },
      data: { isRead: true },
    });

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    logger.error('Mark all read error', { error });
    res.status(500).json({ message: 'Failed to mark notifications as read' });
  }
});

export default router;
