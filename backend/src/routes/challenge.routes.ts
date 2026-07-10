import { Router, Response } from 'express';
import { db } from '../config/db';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// POST /api/challenges (Admin only - create plan)
router.post('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
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

// DELETE /api/challenges/:id (Admin only - delete plan)
router.delete('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM challenge_plans WHERE id = $1', [id]);
    res.json({ message: 'Challenge plan deleted successfully' });
  } catch (error) {
    console.error('Failed plan delete:', error);
    res.status(500).json({ error: 'Failed plan delete' });
  }
});

// POST /api/challenges/:id/reset (Reset a trader account evaluation metrics)
router.post('/:id/reset', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  try {
    const accountCheck = await db.query('SELECT * FROM trading_accounts WHERE id = $1', [id]);
    if (accountCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Trading account not found' });
    }
    const acc = accountCheck.rows[0];

    const updated = await db.query(
      `UPDATE trading_accounts
      SET status = 'Phase 1', balance = initial_balance, equity = initial_balance,
          daily_drawdown_current = 0, max_drawdown_current = 0, trading_days_current = 0,
          win_rate = 0.00, trades_count = 0, equity_history = $1::jsonb
      WHERE id = $2 RETURNING *`,
      [JSON.stringify([{ day: '1', equity: parseFloat(acc.initial_balance) }]), id]
    );

    res.json(updated.rows[0]);
  } catch (error) {
    console.error('Failed resetting challenge:', error);
    res.status(500).json({ error: 'Failed reset operation' });
  }
});

export default router;
