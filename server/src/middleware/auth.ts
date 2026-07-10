import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt.js';
import prisma from '../config/prisma.js';

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        role: string;
      };
    }
  }
}

export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, role: true, isSuspended: true, isBanned: true },
    });

    if (!user) {
      res.status(401).json({ message: 'User not found' });
      return;
    }

    if (user.isBanned) {
      res.status(403).json({ message: 'Account has been banned' });
      return;
    }

    if (user.isSuspended) {
      res.status(403).json({ message: 'Account is suspended' });
      return;
    }

    req.user = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    next();
  } catch (error) {
    if (error instanceof Error && error.name === 'TokenExpiredError') {
      res.status(401).json({ message: 'Token expired', code: 'TOKEN_EXPIRED' });
      return;
    }
    res.status(401).json({ message: 'Invalid token' });
  }
}

export function authorize(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ message: 'Insufficient permissions' });
      return;
    }

    next();
  };
}
