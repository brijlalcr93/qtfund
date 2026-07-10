import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../config/db';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { authRateLimiter } from '../middleware/rateLimiter';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const REFRESH_SECRET = process.env.REFRESH_SECRET || JWT_SECRET + '_refresh';
const REFRESH_EXPIRES_IN = '30d';

function signTokens(payload: { id: string; email: string; role: string; fullName: string }) {
  const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  const refreshToken = jwt.sign({ id: payload.id }, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES_IN });
  return { accessToken, refreshToken };
}

// POST /api/auth/register
router.post('/register', authRateLimiter, async (req, res) => {
  const { email, password, fullName, role } = req.body;

  if (!email || !password || !fullName) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  try {
    // Check if user exists
    const userCheck = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userCheck.rows.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    
    // Assign default role 'Trader' if not specified or not a valid admin role creation (admins created manually or by super admin)
    let assignedRole = 'Trader';
    if (role && ['Trader', 'Super Admin', 'Admin', 'Support Agent', 'Finance Manager', 'Affiliate Manager'].includes(role)) {
      assignedRole = role;
    }

    // Insert user
    const newUser = await db.query(
      'INSERT INTO users (email, password_hash, full_name, role, kyc_status) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, full_name, role, kyc_status, created_at',
      [email, passwordHash, fullName, assignedRole, 'Unsubmitted']
    );

    const user = newUser.rows[0];

    // Auto-create affiliate profile
    const refCode = fullName.replace(/\s+/g, '_').toUpperCase() + '_' + Math.floor(100 + Math.random() * 900);
    await db.query(
      'INSERT INTO affiliate_profiles (user_id, referral_code) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [user.id, refCode]
    );

    // Generate JWT pair
    const { accessToken, refreshToken } = signTokens({
      id: user.id,
      email: user.email,
      role: user.role,
      fullName: user.full_name,
    });

    res.status(201).json({
      token: accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        kycStatus: user.kyc_status,
        createdAt: user.created_at
      }
    });
  } catch (error) {
    console.error('Registration failed:', error);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// POST /api/auth/login
router.post('/login', authRateLimiter, async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  try {
    const userResult = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = userResult.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const { accessToken, refreshToken } = signTokens({
      id: user.id,
      email: user.email,
      role: user.role,
      fullName: user.full_name,
    });

    res.json({
      token: accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        kycStatus: user.kyc_status,
        createdAt: user.created_at
      }
    });
  } catch (error) {
    console.error('Login failed:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  try {
    const userResult = await db.query('SELECT id, email, full_name, role, kyc_status, created_at FROM users WHERE id = $1', [req.user.id]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    const user = userResult.rows[0];
    res.json({
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      role: user.role,
      kycStatus: user.kyc_status,
      createdAt: user.created_at
    });
  } catch (error) {
    console.error('Fetch me failed:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', authRateLimiter, async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });

  try {
    // Verify the email exists (do not reveal whether it does in the response)
    const userResult = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (userResult.rows.length > 0) {
      // In production: generate a reset token, store it, and email it.
      // For now, log it server-side.
      const resetToken = jwt.sign({ id: userResult.rows[0].id, purpose: 'reset' }, JWT_SECRET, { expiresIn: '1h' });
      console.log(`[PASSWORD RESET] Token for ${email}: ${resetToken}`);
    }
  } catch (error) {
    console.error('Reset password error:', error);
  }

  // Always respond the same way regardless of whether email exists
  res.json({ message: 'If the email exists, a password reset link has been sent' });
});

// POST /api/auth/refresh
router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(400).json({ error: 'Refresh token required' });

  try {
    const decoded = jwt.verify(refreshToken, REFRESH_SECRET) as { id: string };

    // Fetch fresh user data from DB
    const userResult = await db.query(
      'SELECT id, email, full_name, role, kyc_status FROM users WHERE id = $1',
      [decoded.id]
    );
    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];
    const { accessToken, refreshToken: newRefreshToken } = signTokens({
      id: user.id,
      email: user.email,
      role: user.role,
      fullName: user.full_name,
    });

    res.json({ token: accessToken, refreshToken: newRefreshToken });
  } catch (error) {
    console.error('Token refresh failed:', error);
    res.status(401).json({ error: 'Invalid or expired refresh token' });
  }
});

export default router;
