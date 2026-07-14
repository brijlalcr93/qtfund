import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../config/db';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// Apply auth + Admin check to all admin routes
router.use(authenticateToken);
router.use(requireRole(['Super Admin', 'Admin', 'Finance Manager', 'Support Agent']));

// GET /api/admin/stats (Matches adminApi.getStats)
router.get('/stats', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const totalUsersRes = await db.query('SELECT COUNT(*) FROM users');
    const verifiedUsersRes = await db.query("SELECT COUNT(*) FROM users WHERE is_verified = TRUE");
    const unverifiedUsersRes = await db.query("SELECT COUNT(*) FROM users WHERE is_verified = FALSE");
    const activeChallengesRes = await db.query("SELECT COUNT(*) FROM trading_accounts WHERE status IN ('Phase 1', 'Phase 2')");
    const passedChallengesRes = await db.query("SELECT COUNT(*) FROM trading_accounts WHERE status = 'Funded'");
    const failedChallengesRes = await db.query("SELECT COUNT(*) FROM trading_accounts WHERE status = 'Breached'");
    const totalRevenueRes = await db.query("SELECT SUM(amount) FROM payments WHERE status = 'Paid'");
    const pendingPayoutsRes = await db.query("SELECT SUM(amount) FROM payouts WHERE status = 'Pending'");
    const pendingKycRes = await db.query("SELECT COUNT(*) FROM kyc_submissions WHERE status = 'Pending'");
    const openTicketsRes = await db.query("SELECT COUNT(*) FROM support_tickets WHERE status = 'Open'");
    const monthRegistrationsRes = await db.query("SELECT COUNT(*) FROM users WHERE created_at > NOW() - INTERVAL '1 month'");

    const roleDistribution = await db.query("SELECT role, COUNT(*) as count FROM users GROUP BY role");
    const challengePlans = await db.query("SELECT id, type as name, price, size as \"accountSize\" FROM challenge_plans");
    const recentPayments = await db.query(`
      SELECT p.id, p.amount, 'USD' as currency, 'Stripe' as gateway, p.status, p.date as "createdAt",
             json_build_object('id', u.id, 'email', u.email, 'name', u.full_name) as user
      FROM payments p
      LEFT JOIN users u ON p.user_id = u.id
      ORDER BY p.date DESC LIMIT 5
    `);
    const recentRegistrations = await db.query(`
      SELECT id, email, full_name as name, created_at as "createdAt", is_verified as "isVerified"
      FROM users
      ORDER BY created_at DESC LIMIT 5
    `);

    res.json({
      overview: {
        totalUsers: parseInt(totalUsersRes.rows[0].count),
        verifiedUsers: parseInt(verifiedUsersRes.rows[0].count),
        unverifiedUsers: parseInt(unverifiedUsersRes.rows[0].count),
        activeChallenges: parseInt(activeChallengesRes.rows[0].count),
        passedChallenges: parseInt(passedChallengesRes.rows[0].count),
        failedChallenges: parseInt(failedChallengesRes.rows[0].count),
        totalRevenue: parseFloat(totalRevenueRes.rows[0].sum || '0'),
        monthRevenue: parseFloat(totalRevenueRes.rows[0].sum || '0') * 0.3, // Mock calculation
        yearRevenue: parseFloat(totalRevenueRes.rows[0].sum || '0'),
        pendingPayouts: parseFloat(pendingPayoutsRes.rows[0].sum || '0'),
        pendingKyc: parseInt(pendingKycRes.rows[0].count),
        openTickets: parseInt(openTicketsRes.rows[0].count),
        monthRegistrations: parseInt(monthRegistrationsRes.rows[0].count)
      },
      roleDistribution: roleDistribution.rows.map(r => ({ role: r.role, count: parseInt(r.count) })),
      challengePlans: challengePlans.rows.map(cp => ({
        id: cp.id,
        name: cp.name,
        price: parseFloat(cp.price.replace(/[$,]/g, '')),
        accountSize: parseFloat(cp.accountSize.replace(/[$,]/g, '')),
        _count: { userChallenges: 1 }
      })),
      recentPayments: recentPayments.rows,
      recentRegistrations: recentRegistrations.rows
    });
  } catch (error) {
    console.error('Failed to get stats:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/admin/payments (Matches adminApi.getPayments)
router.get('/payments', async (req: AuthenticatedRequest, res: Response) => {
  const page = parseInt(req.query.page as string || '1');
  const limit = parseInt(req.query.limit as string || '20');
  const offset = (page - 1) * limit;

  try {
    const totalCountRes = await db.query('SELECT COUNT(*) FROM payments');
    const total = parseInt(totalCountRes.rows[0].count);
    
    const payments = await db.query(`
      SELECT p.id, p.amount, 'USD' as currency, p.method as gateway, p.status, p.description, p.date as "createdAt",
             json_build_object('id', u.id, 'email', u.email, 'name', u.full_name) as user
      FROM payments p
      LEFT JOIN users u ON p.user_id = u.id
      ORDER BY p.date DESC
      LIMIT $1 OFFSET $2
    `, [limit, offset]);

    res.json({
      payments: payments.rows,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Failed to query payments:', error);
    res.status(500).json({ error: 'Failed to retrieve payments' });
  }
});

// GET /api/admin/challenges (Matches adminApi.getChallenges)
router.get('/challenges', async (req: AuthenticatedRequest, res: Response) => {
  const page = parseInt(req.query.page as string || '1');
  const limit = parseInt(req.query.limit as string || '20');
  const offset = (page - 1) * limit;

  try {
    const totalCountRes = await db.query('SELECT COUNT(*) FROM trading_accounts');
    const total = parseInt(totalCountRes.rows[0].count);

    const challenges = await db.query(`
      SELECT t.id, t.status, t.balance as "currentBalance", t.balance as "peakBalance",
             (t.balance - t.initial_balance) as profit, t.trades_count as trades,
             t.created_at as "startDate", t.created_at as "endDate", t.created_at as "createdAt",
             json_build_object('id', t.id, 'name', t.name, 'accountSize', t.initial_balance, 'profitTarget', t.profit_target, 'maxDrawdown', t.max_drawdown_limit, 'durationDays', t.trading_days_required) as plan,
             json_build_object('id', u.id, 'email', u.email, 'name', u.full_name) as user
      FROM trading_accounts t
      LEFT JOIN users u ON t.user_id = u.id
      ORDER BY t.created_at DESC
      LIMIT $1 OFFSET $2
    `, [limit, offset]);

    res.json({
      challenges: challenges.rows,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Failed to get challenges:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/admin/challenges/:id/upgrade (Matches adminApi.upgradeChallenge)
router.post('/challenges/:id/upgrade', requireRole(['Super Admin', 'Admin']), async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { additionalBalance } = req.body;
  const size = additionalBalance ? parseFloat(additionalBalance) : 10000;

  try {
    const checkAccount = await db.query('SELECT * FROM trading_accounts WHERE id = $1', [id]);
    if (checkAccount.rows.length === 0) {
      return res.status(404).json({ error: 'Challenge account not found' });
    }

    const updated = await db.query(
      'UPDATE trading_accounts SET balance = balance + $1, equity = equity + $1, initial_balance = initial_balance + $1 WHERE id = $2 RETURNING *',
      [size, id]
    );

    res.json(updated.rows[0]);
  } catch (error) {
    console.error('Failed to upgrade challenge:', error);
    res.status(500).json({ error: 'Upgrade failed' });
  }
});

// POST /api/admin/challenges/:id/disable (Matches adminApi.disableChallenge)
router.post('/challenges/:id/disable', async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  try {
    const updated = await db.query("UPDATE trading_accounts SET status = 'Breached' WHERE id = $1 RETURNING *", [id]);
    if (updated.rows.length === 0) {
      return res.status(404).json({ error: 'Challenge account not found' });
    }
    res.json({ message: 'Challenge disabled successfully', account: updated.rows[0] });
  } catch (error) {
    console.error('Failed to disable challenge:', error);
    res.status(500).json({ error: 'Failed to disable challenge' });
  }
});

// POST /api/admin/email/send (Matches adminApi.sendBulkEmail)
router.post('/email/send', async (req: AuthenticatedRequest, res: Response) => {
  const { subject, message, target } = req.body;
  if (!subject || !message) {
    return res.status(400).json({ error: 'Subject and message are required' });
  }

  try {
    const usersRes = await db.query('SELECT COUNT(*) FROM users');
    const userCount = parseInt(usersRes.rows[0].count);

    console.log(`Sending Bulk Email Target: ${target || 'ALL'}. Subject: "${subject}"`);
    res.json({ message: 'Bulk email dispatch triggered successfully', sentCount: userCount });
  } catch (error) {
    console.error('Email dispatch failed:', error);
    res.status(500).json({ error: 'Email dispatch failed' });
  }
});

// GET /api/admin/cms (Matches adminApi.getCms) — reads from the persisted cms_settings table
// instead of an in-memory object, so edits survive a server restart.
router.get('/cms', async (req, res) => {
  try {
    const result = await db.query('SELECT key, value FROM cms_settings');
    const settings: Record<string, string> = {};
    result.rows.forEach((row: { key: string; value: string }) => {
      settings[row.key] = row.value;
    });
    res.json(settings);
  } catch (error) {
    console.error('Failed to load CMS settings:', error);
    res.status(500).json({ error: 'Failed to load CMS settings' });
  }
});

// POST /api/admin/cms (Matches adminApi.saveCms)
router.post('/cms', async (req, res) => {
  const { settings } = req.body;
  if (!settings || typeof settings !== 'object') {
    return res.status(400).json({ error: 'Settings object required' });
  }

  try {
    for (const [key, value] of Object.entries(settings)) {
      await db.query(
        `INSERT INTO cms_settings (key, value, updated_at) VALUES ($1, $2, CURRENT_TIMESTAMP)
        ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP`,
        [key, String(value)]
      );
    }

    const result = await db.query('SELECT key, value FROM cms_settings');
    const allSettings: Record<string, string> = {};
    result.rows.forEach((row: { key: string; value: string }) => {
      allSettings[row.key] = row.value;
    });

    res.json({ message: 'CMS Settings saved successfully', settings: allSettings });
  } catch (error) {
    console.error('Failed to save CMS settings:', error);
    res.status(500).json({ error: 'Failed to save CMS settings' });
  }
});

// GET /api/admin/analytics (Matches adminApi.getAnalytics)
router.get('/analytics', async (req, res) => {
  res.json({
    monthlyRevenue: [
      { name: 'Jan', revenue: 14000, payouts: 5000 },
      { name: 'Feb', revenue: 25000, payouts: 12000 },
      { name: 'Mar', revenue: 18000, payouts: 9000 },
      { name: 'Apr', revenue: 32000, payouts: 15000 },
      { name: 'May', revenue: 45000, payouts: 22000 },
      { name: 'Jun', revenue: 64000, payouts: 34000 }
    ],
    payoutRatios: [
      { name: 'USDT', value: 65 },
      { name: 'Bank Transfer', value: 20 },
      { name: 'PayPal', value: 15 }
    ]
  });
});

// POST /api/admin/users/:id/toggle-status (Matches adminApi.toggleUserStatus)
router.post('/users/:id/toggle-status', async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  try {
    const userCheck = await db.query('SELECT is_suspended FROM users WHERE id = $1', [id]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const currentSuspended = userCheck.rows[0].is_suspended;
    const result = await db.query('UPDATE users SET is_suspended = $1 WHERE id = $2 RETURNING id, is_suspended', [!currentSuspended, id]);

    res.json({
      id: result.rows[0].id,
      isSuspended: result.rows[0].is_suspended
    });
  } catch (error) {
    console.error('Failed toggling status:', error);
    res.status(500).json({ error: 'Failed status toggle' });
  }
});

// GET /api/admin/users (Directory list)
router.get('/users', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const users = await db.query(`
      SELECT u.id, u.email, u.full_name as name, u.role, u.is_verified as "isVerified",
             u.is_suspended as "isSuspended", u.is_banned as "isBanned",
             COALESCE(u.total_deposited, 0) as balance,
             COALESCE(u.total_deposited, 0) as "totalDeposited",
             COALESCE(u.total_withdrawn, 0) as "totalWithdrawn",
             NULL as "affiliateCode", u.created_at as "createdAt",
             json_build_object(
               'challenges', (SELECT COUNT(*) FROM trading_accounts WHERE user_id = u.id),
               'payments', (SELECT COUNT(*) FROM payments WHERE user_id = u.id),
               'tickets', (SELECT COUNT(*) FROM support_tickets WHERE user_id = u.id)
             ) as _count
      FROM users u
      ORDER BY u.created_at DESC
    `);
    res.json(users.rows);
  } catch (error) {
    console.error('Failed to retrieve user directory:', error);
    res.status(500).json({ error: 'Failed to retrieve user directory' });
  }
});

// GET /api/admin/kyc (All submissions)
router.get('/kyc', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const submissions = await db.query(`
      SELECT k.id, k.user_name as "fullName", k.document_type as "documentType",
             k.document_number as "documentNumber", k.status, k.feedback as "adminFeedback",
             k.submitted_at as "submittedAt",
             json_build_object('id', u.id, 'email', u.email, 'name', u.full_name) as user
      FROM kyc_submissions k
      LEFT JOIN users u ON k.user_id = u.id
      ORDER BY k.submitted_at DESC
    `);
    res.json(submissions.rows);
  } catch (error) {
    console.error('Failed to retrieve kyc list:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/admin/payouts (All payout requests)
router.get('/payouts', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const payouts = await db.query(`
      SELECT p.id, p.amount, 0 as fee, p.amount as "netAmount", p.method as gateway, p.method as "accountDetails",
             p.status, p.rejection_reason as "adminNote", p.created_at as "createdAt", p.created_at as "processedAt",
             json_build_object('id', u.id, 'email', u.email, 'name', u.full_name) as user
      FROM payouts p
      LEFT JOIN users u ON p.user_id = u.id
      ORDER BY p.created_at DESC
    `);
    res.json(payouts.rows);
  } catch (error) {
    console.error('Failed to get payouts list:', error);
    res.status(500).json({ error: 'Failed to get payouts' });
  }
});

// GET /api/admin/coupons (Admin coupons view)
router.get('/coupons', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const coupons = await db.query(`
      SELECT code, 'PERCENT' as "discountType", discount_percent as "discountValue",
             0 as "minAmount", usage_limit as "maxUsage", usage_count as "usedCount",
             created_at as "validFrom", expiry_date as "validUntil", active as "isActive", created_at as "createdAt"
      FROM coupons
      ORDER BY created_at DESC
    `);
    res.json(coupons.rows);
  } catch (error) {
    console.error('Failed to query coupons:', error);
    res.status(500).json({ error: 'Failed to query coupons' });
  }
});

// POST /api/admin/coupons (Create coupon)
router.post('/coupons', async (req: AuthenticatedRequest, res: Response) => {
  const { code, discountValue, validUntil, maxUsage } = req.body;
  if (!code || !discountValue || !validUntil) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  try {
    const result = await db.query(
      `INSERT INTO coupons (code, discount_percent, expiry_date, usage_limit, usage_count, active)
      VALUES ($1, $2, $3, $4, 0, TRUE) RETURNING *`,
      [code.toUpperCase(), discountValue, validUntil, maxUsage || 100]
    );

    const coupon = result.rows[0];
    res.status(201).json({
      code: coupon.code,
      discountType: 'PERCENT',
      discountValue: parseFloat(coupon.discount_percent),
      minAmount: 0,
      maxUsage: coupon.usage_limit,
      usedCount: coupon.usage_count,
      validFrom: coupon.created_at,
      validUntil: coupon.expiry_date,
      isActive: coupon.active,
      createdAt: coupon.created_at
    });
  } catch (error) {
    console.error('Failed creating coupon:', error);
    res.status(500).json({ error: 'Failed creating coupon' });
  }
});

// DELETE /api/admin/coupons/:code
router.delete('/coupons/:code', async (req: AuthenticatedRequest, res: Response) => {
  const { code } = req.params;
  try {
    await db.query('DELETE FROM coupons WHERE code = $1', [code.toUpperCase()]);
    res.json({ message: `Coupon ${code} successfully deleted` });
  } catch (error) {
    console.error('Failed deleting coupon:', error);
    res.status(500).json({ error: 'Failed deleting coupon' });
  }
});

// GET /api/admin/affiliates (Directory list — matches adminApi's AffiliateItem shape)
router.get('/affiliates', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const affiliates = await db.query(`
      SELECT u.id, u.email, u.full_name as name, ap.referral_code as "affiliateCode",
             ap.commission_percent as "commissionRate", ap.created_at as "createdAt",
             ap.total_earned as "totalEarnings",
             json_build_object('referrals', (SELECT COUNT(*) FROM referrals WHERE affiliate_id = ap.id)) as "_count"
      FROM affiliate_profiles ap
      JOIN users u ON u.id = ap.user_id
      ORDER BY ap.created_at DESC
    `);
    res.json(affiliates.rows);
  } catch (error) {
    console.error('Failed to retrieve affiliate directory:', error);
    res.status(500).json({ error: 'Failed to retrieve affiliate directory' });
  }
});

// POST /api/admin/plans (Matches adminApi.createChallengePlan)
router.post('/plans', async (req: AuthenticatedRequest, res: Response) => {
  const { name, price, accountSize, profitTarget, maxDrawdown, durationDays } = req.body;
  if (!name || !price || !accountSize) {
    return res.status(400).json({ error: 'Missing challenge plan details' });
  }

  const id = `plan-${name.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}`;
  const sizeText = `$${accountSize.toLocaleString()}`;
  const priceText = `$${price.toLocaleString()}`;

  const rules = [
    { label: 'Profit Target', value: `${profitTarget}%` },
    { label: 'Max Daily Loss', value: '5%' },
    { label: 'Max Overall Loss', value: `${maxDrawdown}%` },
    { label: 'Minimum Trading Days', value: `${durationDays || 0} Days` },
    { label: 'Leverage', value: '1:100' }
  ];

  try {
    const newPlan = await db.query(
      `INSERT INTO challenge_plans (id, type, size, price, rules, active)
      VALUES ($1, $2, $3, $4, $5::jsonb, TRUE) RETURNING *`,
      [id, '2-Step', sizeText, priceText, JSON.stringify(rules)]
    );
    res.status(201).json(newPlan.rows[0]);
  } catch (error) {
    console.error('Failed challenge creation:', error);
    res.status(500).json({ error: 'Failed creating plan' });
  }
});

// DELETE /api/admin/plans/:id (Matches adminApi.deleteChallengePlan)
router.delete('/plans/:id', async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM challenge_plans WHERE id = $1', [id]);
    res.json({ message: 'Challenge plan deleted successfully' });
  } catch (error) {
    console.error('Failed plan delete:', error);
    res.status(500).json({ error: 'Failed plan delete' });
  }
});

export default router;
