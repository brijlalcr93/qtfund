import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { body, param } from 'express-validator';
import prisma from '../config/prisma.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt.js';
import { sendEmail } from '../utils/email.js';
import logger from '../utils/logger.js';

const router = Router();

function generateAffiliateCode(length: number = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

router.post(
  '/register',
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('name').trim().isLength({ min: 1 }).withMessage('Name is required'),
  validate,
  async (req: Request, res: Response) => {
    try {
      const { email, password, name } = req.body;

      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        res.status(409).json({ message: 'Email already registered' });
        return;
      }

      const hashedPassword = await bcrypt.hash(password, 12);
      const verificationToken = uuidv4();

      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          verificationToken,
          affiliateCode: generateAffiliateCode(),
        },
      });

      try {
        await sendEmail({
          to: email,
          subject: 'Verify your email',
          template: 'verify-email',
          variables: {
            verifyUrl: `${process.env.CORS_ORIGIN || 'http://localhost:5173'}/verify-email/${verificationToken}`,
          },
        });
      } catch (emailError) {
        logger.error('Failed to send verification email', { error: emailError });
      }

      res.status(201).json({
        message: 'Registration successful. Please check your email to verify your account.',
        userId: user.id,
      });
    } catch (error) {
      logger.error('Registration error', { error });
      res.status(500).json({ message: 'Registration failed' });
    }
  }
);

router.post(
  '/login',
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 1 }).withMessage('Password is required'),
  validate,
  async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        res.status(401).json({ message: 'Invalid email or password' });
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

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        res.status(401).json({ message: 'Invalid email or password' });
        return;
      }

      if (user.twoFactorEnabled) {
        res.json({
          requiresTwoFactor: true,
          userId: user.id,
        });
        return;
      }

      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);

      const refreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
      const refreshExpiresMs = parseDuration(refreshExpiresIn);

      await prisma.refreshToken.create({
        data: {
          token: refreshToken,
          userId: user.id,
          expiresAt: new Date(Date.now() + refreshExpiresMs),
        },
      });

      res.json({
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      });
    } catch (error) {
      logger.error('Login error', { error });
      res.status(500).json({ message: 'Login failed' });
    }
  }
);

router.post(
  '/refresh',
  body('refreshToken').isString().withMessage('Refresh token is required'),
  validate,
  async (req: Request, res: Response) => {
    try {
      const { refreshToken } = req.body;

      let decoded;
      try {
        decoded = verifyRefreshToken(refreshToken);
      } catch {
        res.status(401).json({ message: 'Invalid or expired refresh token' });
        return;
      }

      const storedToken = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });
      if (!storedToken) {
        res.status(401).json({ message: 'Refresh token has been revoked' });
        return;
      }

      if (storedToken.expiresAt < new Date()) {
        await prisma.refreshToken.delete({ where: { id: storedToken.id } });
        res.status(401).json({ message: 'Refresh token expired' });
        return;
      }

      const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
      if (!user) {
        res.status(401).json({ message: 'User not found' });
        return;
      }

      await prisma.refreshToken.delete({ where: { id: storedToken.id } });

      const newAccessToken = generateAccessToken(user);
      const newRefreshToken = generateRefreshToken(user);

      const refreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
      const refreshExpiresMs = parseDuration(refreshExpiresIn);

      await prisma.refreshToken.create({
        data: {
          token: newRefreshToken,
          userId: user.id,
          expiresAt: new Date(Date.now() + refreshExpiresMs),
        },
      });

      res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
    } catch (error) {
      logger.error('Token refresh error', { error });
      res.status(500).json({ message: 'Token refresh failed' });
    }
  }
);

router.post(
  '/logout',
  body('refreshToken').optional().isString(),
  validate,
  async (req: Request, res: Response) => {
    try {
      const { refreshToken } = req.body;
      if (refreshToken) {
        await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
      }
      res.json({ message: 'Logged out successfully' });
    } catch (error) {
      logger.error('Logout error', { error });
      res.status(500).json({ message: 'Logout failed' });
    }
  }
);

router.post(
  '/forgot-password',
  body('email').isEmail().normalizeEmail(),
  validate,
  async (req: Request, res: Response) => {
    try {
      const { email } = req.body;

      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        res.json({ message: 'If that email is registered, a reset link has been sent.' });
        return;
      }

      const resetToken = uuidv4();
      const resetTokenExpiry = new Date(Date.now() + 3600000);

      await prisma.user.update({
        where: { id: user.id },
        data: { resetToken, resetTokenExpiry },
      });

      try {
        await sendEmail({
          to: email,
          subject: 'Reset your password',
          template: 'reset-password',
          variables: {
            resetUrl: `${process.env.CORS_ORIGIN || 'http://localhost:5173'}/reset-password/${resetToken}`,
          },
        });
      } catch (emailError) {
        logger.error('Failed to send reset email', { error: emailError });
      }

      res.json({ message: 'If that email is registered, a reset link has been sent.' });
    } catch (error) {
      logger.error('Forgot password error', { error });
      res.status(500).json({ message: 'Failed to process request' });
    }
  }
);

router.post(
  '/reset-password',
  body('token').isString().withMessage('Token is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  validate,
  async (req: Request, res: Response) => {
    try {
      const { token, password } = req.body;

      const user = await prisma.user.findFirst({
        where: {
          resetToken: token,
          resetTokenExpiry: { gt: new Date() },
        },
      });

      if (!user) {
        res.status(400).json({ message: 'Invalid or expired reset token' });
        return;
      }

      const hashedPassword = await bcrypt.hash(password, 12);

      await prisma.user.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
          resetToken: null,
          resetTokenExpiry: null,
        },
      });

      res.json({ message: 'Password reset successful' });
    } catch (error) {
      logger.error('Reset password error', { error });
      res.status(500).json({ message: 'Failed to reset password' });
    }
  }
);

router.get(
  '/verify-email/:token',
  param('token').isString(),
  validate,
  async (req: Request, res: Response) => {
    try {
      const { token } = req.params;

      const user = await prisma.user.findFirst({
        where: { verificationToken: token },
      });

      if (!user) {
        res.status(400).json({ message: 'Invalid or expired verification token' });
        return;
      }

      await prisma.user.update({
        where: { id: user.id },
        data: {
          isVerified: true,
          verificationToken: null,
        },
      });

      res.json({ message: 'Email verified successfully' });
    } catch (error) {
      logger.error('Email verification error', { error });
      res.status(500).json({ message: 'Verification failed' });
    }
  }
);

router.get('/me', authenticate, async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isVerified: true,
        twoFactorEnabled: true,
        balance: true,
        totalDeposited: true,
        totalWithdrawn: true,
        affiliateCode: true,
        commissionRate: true,
        createdAt: true,
      },
    });

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.json(user);
  } catch (error) {
    logger.error('Get profile error', { error });
    res.status(500).json({ message: 'Failed to fetch profile' });
  }
});

router.put(
  '/me',
  authenticate,
  body('name').optional().trim().isLength({ min: 1 }),
  validate,
  async (req: Request, res: Response) => {
    try {
      const { name } = req.body;
      const updateData: Record<string, any> = {};

      if (name) updateData.name = name;

      const user = await prisma.user.update({
        where: { id: req.user!.userId },
        data: updateData,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
        },
      });

      res.json(user);
    } catch (error) {
      logger.error('Update profile error', { error });
      res.status(500).json({ message: 'Failed to update profile' });
    }
  }
);

router.post('/2fa/enable', authenticate, async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    const speakeasy = require('speakeasy');
    // In production, generate a real secret
    const secret = speakeasy.generateSecret({ name: `PropFirm:${user.email}` });

    await prisma.user.update({
      where: { id: user.id },
      data: { twoFactorSecret: secret.base32 },
    });

    res.json({
      message: '2FA setup initiated',
      secret: secret.base32,
      otpauthUrl: secret.otpauth_url,
    });
  } catch (error) {
    logger.error('Enable 2FA error', { error });
    res.status(500).json({ message: 'Failed to enable 2FA' });
  }
});

router.post(
  '/2fa/verify',
  authenticate,
  body('token').isString().withMessage('Token is required'),
  validate,
  async (req: Request, res: Response) => {
    try {
      const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
      if (!user || !user.twoFactorSecret) {
        res.status(400).json({ message: '2FA not set up' });
        return;
      }

      const speakeasy = require('speakeasy');

      // In a real app, create a notification or store a temp verification
      const isValid = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: 'base32',
        token: req.body.token,
      });

      if (isValid) {
        await prisma.user.update({
          where: { id: user.id },
          data: { twoFactorEnabled: true },
        });
        res.json({ message: '2FA enabled successfully' });
      } else {
        res.status(400).json({ message: 'Invalid 2FA token' });
      }
    } catch (error) {
      logger.error('Verify 2FA error', { error });
      res.status(500).json({ message: 'Failed to verify 2FA' });
    }
  }
);

router.post('/2fa/disable', authenticate, async (req: Request, res: Response) => {
  try {
    await prisma.user.update({
      where: { id: req.user!.userId },
      data: { twoFactorEnabled: false, twoFactorSecret: null },
    });

    res.json({ message: '2FA disabled successfully' });
  } catch (error) {
    logger.error('Disable 2FA error', { error });
    res.status(500).json({ message: 'Failed to disable 2FA' });
  }
});

function parseDuration(duration: string): number {
  const match = duration.match(/^(\d+)\s*(s|m|h|d)$/);
  if (!match) return 7 * 24 * 60 * 60 * 1000;

  const value = parseInt(match[1]);
  const unit = match[2];

  switch (unit) {
    case 's': return value * 1000;
    case 'm': return value * 60 * 1000;
    case 'h': return value * 3600 * 1000;
    case 'd': return value * 86400 * 1000;
    default: return 7 * 24 * 60 * 60 * 1000;
  }
}

export default router;
