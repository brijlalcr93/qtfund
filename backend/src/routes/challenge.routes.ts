import { Router, Response } from 'express';
import { db } from '../config/db';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../middleware/auth';

const router = Router();
const CHALLENGE_ADMIN_ROLES = ['Super Admin', 'Admin'];

// POST /api/challenges (Admin only - create plan)
router.post('/', authenticateToken, requireRole(CHALLENGE_ADMIN_ROLES), async (req: AuthenticatedRequest, res: Response) => {
  const { name, price, accountSize, profitTarget, maxDrawdown, durationDays, type, dailyLoss, profitTargetPhase2 } = req.body;
  if (!name || !price || !accountSize) {
    return res.status(400).json({ error: 'Missing challenge plan details' });
  }

  const planType = ['1-Step', '2-Step', 'Instant'].includes(type) ? type : '2-Step';
  const id = `plan-${name.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}`;
  const sizeText = `$${accountSize.toLocaleString()}`;
  const priceText = `$${price.toLocaleString()}`;
  const dailyLossPct = dailyLoss ?? 5;

  const isInstant = planType === 'Instant';
  const isTwoStep = planType === '2-Step';
  const profitTargetLabel = isInstant ? 'None' : isTwoStep ? `${profitTarget}% (Ph 1) / ${profitTargetPhase2 ?? Math.round(profitTarget / 1.6)}% (Ph 2)` : `${profitTarget}%`;

  const rules = [
    { label: 'Profit Target', value: profitTargetLabel },
    { label: 'Max Daily Loss', value: `${dailyLossPct}%` },
    { label: 'Max Overall Loss', value: `${maxDrawdown}%` },
    { label: 'Minimum Trading Days', value: isInstant ? 'None' : `${durationDays || 0} Days` },
    { label: 'Leverage', value: isInstant ? '1:50' : '1:100' }
  ];

  try {
    const newPlan = await db.query(
      `INSERT INTO challenge_plans
      (id, type, size, price, rules, active, profit_target_phase1_pct, profit_target_phase2_pct, daily_drawdown_pct, max_drawdown_pct)
      VALUES ($1, $2, $3, $4, $5::jsonb, TRUE, $6, $7, $8, $9) RETURNING *`,
      [
        id, planType, sizeText, priceText, JSON.stringify(rules),
        isInstant ? null : profitTarget,
        isTwoStep ? (profitTargetPhase2 ?? Math.round(profitTarget / 1.6)) : null,
        dailyLossPct,
        maxDrawdown
      ]
    );
    res.status(201).json(newPlan.rows[0]);
  } catch (error) {
    console.error('Failed challenge creation:', error);
    res.status(500).json({ error: 'Failed creating plan' });
  }
});

// DELETE /api/challenges/:id (Admin only - delete plan)
router.delete('/:id', authenticateToken, requireRole(CHALLENGE_ADMIN_ROLES), async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM challenge_plans WHERE id = $1', [id]);
    res.json({ message: 'Challenge plan deleted successfully' });
  } catch (error) {
    console.error('Failed plan delete:', error);
    res.status(500).json({ error: 'Failed plan delete' });
  }
});

// POST /api/challenges/:id/reset (Admin only — resets any account by ID with no ownership
// check, so it must not be reachable by a regular authenticated Trader)
router.post('/:id/reset', authenticateToken, requireRole(CHALLENGE_ADMIN_ROLES), async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  try {
    const accountCheck = await db.query('SELECT * FROM trading_accounts WHERE id = $1', [id]);
    if (accountCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Trading account not found' });
    }
    const acc = accountCheck.rows[0];

    const updated = await db.query(
      `UPDATE trading_accounts
      SET status = 'Phase 1', phase = 1, compliance = TRUE, violations = '[]'::jsonb,
          balance = initial_balance, equity = initial_balance, phase_start_balance = initial_balance,
          daily_drawdown_current = 0, max_drawdown_current = 0, trading_days_current = 0,
          win_rate = 0.00, trades_count = 0, equity_history = $1::jsonb
      WHERE id = $2 RETURNING *`,
      [JSON.stringify([{ day: '1', equity: parseFloat(acc.initial_balance), balance: parseFloat(acc.initial_balance) }]), id]
    );

    res.json(updated.rows[0]);
  } catch (error) {
    console.error('Failed resetting challenge:', error);
    res.status(500).json({ error: 'Failed reset operation' });
  }
});

export default router;
