import { Router, Response } from 'express';
import { db } from '../config/db';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// GET /api/affiliates/profile
router.get('/profile', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  try {
    // Fetch profile
    let profileResult = await db.query('SELECT * FROM affiliate_profiles WHERE user_id = $1', [req.user.id]);
    
    // Auto-create affiliate profile if it does not exist
    if (profileResult.rows.length === 0) {
      const refCode = req.user.fullName.replace(/\s+/g, '_').toUpperCase() + '_' + Math.floor(100 + Math.random() * 900);
      profileResult = await db.query(
        'INSERT INTO affiliate_profiles (user_id, referral_code) VALUES ($1, $2) RETURNING *',
        [req.user.id, refCode]
      );
    }
    
    const profile = profileResult.rows[0];

    // Fetch referrals
    const referrals = await db.query('SELECT * FROM referrals WHERE affiliate_id = $1 ORDER BY created_at DESC', [profile.id]);

    res.json({
      userId: profile.user_id,
      referralCode: profile.referral_code,
      commissionPercent: parseFloat(profile.commission_percent),
      totalEarned: parseFloat(profile.total_earned),
      pendingPayout: parseFloat(profile.pending_payout),
      referrals: referrals.rows.map(r => ({
        name: r.referred_user_name,
        date: r.created_at,
        status: r.status,
        commission: parseFloat(r.commission)
      }))
    });
  } catch (error) {
    console.error('Failed to retrieve affiliate profile:', error);
    res.status(500).json({ error: 'Failed to retrieve affiliate profile' });
  }
});

// POST /api/affiliates/claim-payout
router.post('/claim-payout', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });

  try {
    const profileResult = await db.query('SELECT * FROM affiliate_profiles WHERE user_id = $1', [req.user.id]);
    if (profileResult.rows.length === 0) {
      return res.status(404).json({ error: 'Affiliate profile not found' });
    }
    const profile = profileResult.rows[0];
    const pendingAmount = parseFloat(profile.pending_payout);

    if (pendingAmount <= 0) {
      return res.status(400).json({ error: 'No pending affiliate commissions to claim' });
    }

    // Create payout request
    const payoutId = 'PAY-AFF-' + Math.floor(1000 + Math.random() * 9000);
    await db.query(
      `INSERT INTO payouts (id, user_id, name, amount, method, status, country)
      VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [payoutId, req.user.id, `Affiliate Payout - ${req.user.fullName.substring(0, 10)}`, pendingAmount, 'USDT (TRC20)', 'Pending', 'IN']
    );

    // Reset pending payout
    const updated = await db.query(
      'UPDATE affiliate_profiles SET pending_payout = 0.00 WHERE id = $1 RETURNING *',
      [profile.id]
    );

    res.json({
      message: 'Affiliate payout claim submitted successfully',
      payoutId,
      amount: pendingAmount,
      pendingPayout: 0.00
    });
  } catch (error) {
    console.error('Affiliate payout claim failed:', error);
    res.status(500).json({ error: 'Payout claim failed' });
  }
});

// GET /api/affiliates/track/:code (landing click tracker)
router.get('/track/:code', async (req, res) => {
  const { code } = req.params;
  try {
    const profileResult = await db.query('SELECT * FROM affiliate_profiles WHERE referral_code = $1', [code.toUpperCase()]);
    if (profileResult.rows.length === 0) {
      return res.status(404).json({ error: 'Referral code not found' });
    }
    
    // Simulate recording referral click and sign up
    res.json({ message: 'Referral code tracked successfully', referralCode: code });
  } catch (error) {
    console.error('Failed tracking referral:', error);
    res.status(500).json({ error: 'Tracking error' });
  }
});

// PUT /api/affiliates/:userId/commission (Admin only)
router.put('/:userId/commission', authenticateToken, requireRole(['Super Admin', 'Admin', 'Affiliate Manager']), async (req: AuthenticatedRequest, res: Response) => {
  const { userId } = req.params;
  const { commissionRate } = req.body;
  if (commissionRate === undefined) return res.status(400).json({ error: 'commissionRate required' });
  try {
    const updated = await db.query(
      'UPDATE affiliate_profiles SET commission_percent = $1 WHERE user_id = $2 RETURNING *',
      [commissionRate, userId]
    );
    res.json(updated.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update commission rate' });
  }
});

export default router;
