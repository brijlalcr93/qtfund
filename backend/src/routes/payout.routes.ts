import { Router, Response } from 'express';
import { db } from '../config/db';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// GET /api/payouts
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  try {
    const payouts = await db.query('SELECT * FROM payouts WHERE user_id = $1 ORDER BY created_at DESC', [req.user.id]);
    res.json(payouts.rows);
  } catch (error) {
    console.error('Failed to get payouts:', error);
    res.status(500).json({ error: 'Failed to retrieve payouts' });
  }
});

// POST /api/payouts (request payout)
router.post('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  const { accountId, amount, method, country } = req.body;

  if (!accountId || !amount || !method || !country) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  try {
    // 1. Verify account ownership and profit eligibility
    const accResult = await db.query('SELECT * FROM trading_accounts WHERE id = $1 AND user_id = $2', [accountId, req.user.id]);
    if (accResult.rows.length === 0) {
      return res.status(404).json({ error: 'Trading account not found' });
    }
    const account = accResult.rows[0];

    if (account.status !== 'Funded') {
      return res.status(403).json({ error: 'Only active funded partner accounts are eligible for payouts' });
    }

    const availableProfit = parseFloat(account.balance) - parseFloat(account.initial_balance);
    if (availableProfit <= 0 || parseFloat(amount) > availableProfit) {
      return res.status(400).json({ error: `Insufficient profit available. Eligible balance above baseline: $${availableProfit.toLocaleString()}` });
    }

    // 2. Insert payout request
    const payoutId = 'PAY-' + Math.floor(1000 + Math.random() * 9000);
    const newPayout = await db.query(
      `INSERT INTO payouts (id, user_id, name, amount, method, status, country)
      VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [payoutId, req.user.id, req.user.fullName, amount, method, 'Pending', country]
    );

    // 3. Deduct amount from account balance/equity to prevent double-spending
    const newBalance = parseFloat(account.balance) - parseFloat(amount);
    await db.query(
      'UPDATE trading_accounts SET balance = $1, equity = $1 WHERE id = $2',
      [newBalance, accountId]
    );

    res.status(201).json(newPayout.rows[0]);
  } catch (error) {
    console.error('Failed to submit payout request:', error);
    res.status(500).json({ error: 'Payout submission failed' });
  }
});

// PUT /api/payouts/:id/approve
router.put('/:id/approve', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  try {
    const updated = await db.query("UPDATE payouts SET status = 'Approved' WHERE id = $1 RETURNING *", [id]);
    if (updated.rows.length === 0) return res.status(404).json({ error: 'Payout not found' });
    res.json(updated.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to approve payout' });
  }
});

// PUT /api/payouts/:id/reject
router.put('/:id/reject', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { reason } = req.body;
  try {
    const updated = await db.query("UPDATE payouts SET status = 'Rejected', rejection_reason = $1 WHERE id = $2 RETURNING *", [reason || 'Rejected by admin', id]);
    if (updated.rows.length === 0) return res.status(404).json({ error: 'Payout not found' });
    res.json(updated.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to reject payout' });
  }
});

// PUT /api/payouts/:id/complete
router.put('/:id/complete', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  try {
    const updated = await db.query("UPDATE payouts SET status = 'Paid' WHERE id = $1 RETURNING *", [id]);
    if (updated.rows.length === 0) return res.status(404).json({ error: 'Payout not found' });
    res.json(updated.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to complete payout' });
  }
});

export default router;
