import { Router, Response } from 'express';
import { db } from '../config/db';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { finalizePurchase } from '../services/purchaseService';

const router = Router();

// GET /api/dashboard/packages
router.get('/packages', async (req, res) => {
  try {
    const plans = await db.query('SELECT * FROM challenge_plans WHERE active = TRUE');
    res.json(plans.rows);
  } catch (error) {
    console.error('Failed to get packages:', error);
    res.status(500).json({ error: 'Failed to retrieve challenge packages' });
  }
});

// GET /api/dashboard/accounts
router.get('/accounts', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  try {
    const accounts = await db.query('SELECT * FROM trading_accounts WHERE user_id = $1 ORDER BY created_at DESC', [req.user.id]);
    res.json(accounts.rows);
  } catch (error) {
    console.error('Failed to fetch trading accounts:', error);
    res.status(500).json({ error: 'Failed to retrieve trading accounts' });
  }
});

// POST /api/dashboard/accounts (purchase new challenge)
router.post('/accounts', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  const { packageId, couponCode } = req.body;

  if (!packageId) {
    return res.status(400).json({ error: 'Package ID required' });
  }

  try {
    const transactionRef = 'TXN-' + Math.floor(100000 + Math.random() * 900000);
    const newAccount = await finalizePurchase(
      { id: req.user.id, fullName: req.user.fullName, email: req.user.email },
      packageId,
      couponCode,
      'Stripe',
      transactionRef
    );
    res.status(201).json(newAccount);
  } catch (error: any) {
    console.error('Failed to purchase challenge:', error);
    if (error?.message === 'Challenge package not found') {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: 'Purchase failed' });
  }
});

// POST /api/dashboard/accounts/:id/reset
router.post('/accounts/:id/reset', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  const { id } = req.params;

  try {
    const checkAccount = await db.query('SELECT * FROM trading_accounts WHERE id = $1 AND user_id = $2', [id, req.user.id]);
    if (checkAccount.rows.length === 0) {
      return res.status(404).json({ error: 'Trading account not found' });
    }
    const acc = checkAccount.rows[0];

    // Reset account logic
    const resetResult = await db.query(
      `UPDATE trading_accounts
      SET status = 'Phase 1', phase = 1, compliance = TRUE, violations = '[]'::jsonb,
          balance = initial_balance, equity = initial_balance, phase_start_balance = initial_balance,
          daily_drawdown_current = 0, max_drawdown_current = 0, trading_days_current = 0,
          win_rate = 0.00, trades_count = 0, equity_history = $1::jsonb
      WHERE id = $2 RETURNING *`,
      [JSON.stringify([{ day: '1', equity: parseFloat(acc.initial_balance), balance: parseFloat(acc.initial_balance) }]), id]
    );

    res.json(resetResult.rows[0]);
  } catch (error) {
    console.error('Failed to reset account:', error);
    res.status(500).json({ error: 'Reset request failed' });
  }
});

// POST /api/dashboard/accounts/:id/simulate-trade
// Server computes the simulated P/L (ported from testprop's win/loss bands) rather than trusting
// a client-supplied profitAmount — the account owner can trigger a trade, but not dictate its size.
router.post('/accounts/:id/simulate-trade', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  const { id } = req.params;
  const { result } = req.body;

  if (result !== 'win' && result !== 'loss') {
    return res.status(400).json({ error: "result must be 'win' or 'loss'" });
  }

  try {
    const checkAccount = await db.query('SELECT * FROM trading_accounts WHERE id = $1 AND user_id = $2', [id, req.user.id]);
    if (checkAccount.rows.length === 0) {
      return res.status(404).json({ error: 'Trading account not found' });
    }

    const acc = checkAccount.rows[0];
    if (acc.status === 'Breached') {
      return res.status(400).json({ error: 'This account has already failed limits and is disabled.' });
    }

    const size = parseFloat(acc.initial_balance);
    const changeAmt = result === 'win'
      ? Math.round(size * (0.015 + Math.random() * 0.02) * 100) / 100
      : -Math.round(size * (0.012 + Math.random() * 0.018) * 100) / 100;

    const newBalance = Math.round((parseFloat(acc.balance) + changeAmt) * 100) / 100;
    const newEquity = Math.round((parseFloat(acc.equity) + changeAmt) * 100) / 100;
    const newTradesCount = acc.trades_count + 1;

    const winsCount = result === 'win' ? Math.round(acc.win_rate * acc.trades_count / 100) + 1 : Math.round(acc.win_rate * acc.trades_count / 100);
    const newWinRate = parseFloat(((winsCount / newTradesCount) * 100).toFixed(1));

    const history = Array.isArray(acc.equity_history) ? acc.equity_history : [];
    const nextDay = (history.length + 1).toString();
    const newHistory = [...history, { day: nextDay, equity: newEquity, balance: newBalance }];

    const violations: string[] = Array.isArray(acc.violations) ? [...acc.violations] : [];
    let status = acc.status;
    let phase = acc.phase;
    let compliance = acc.compliance;
    let phaseStartBalance = parseFloat(acc.phase_start_balance);
    let message = `Trade executed successfully: ${result === 'win' ? 'Profit' : 'Loss'} of $${Math.abs(changeAmt).toLocaleString()}`;

    const startingBalance = parseFloat(acc.initial_balance);
    const maxDrawdownCurrent = newEquity - startingBalance;
    const dailyDrawdownCurrent = parseFloat(acc.daily_drawdown_current) + (changeAmt < 0 ? changeAmt : 0);

    if (maxDrawdownCurrent <= parseFloat(acc.max_drawdown_limit)) {
      compliance = false;
      status = 'Breached';
      violations.push(`Maximum Drawdown Limit Exceeded: Equity dropped to $${newEquity.toLocaleString()} (Max Loss: $${Math.abs(parseFloat(acc.max_drawdown_limit)).toLocaleString()})`);
      message = 'Drawdown violation! The maximum overall loss limit has been breached. Account deactivated.';
    } else if (dailyDrawdownCurrent <= parseFloat(acc.daily_drawdown_limit)) {
      compliance = false;
      status = 'Breached';
      violations.push(`Daily Drawdown Limit Exceeded: Equity dropped to $${newEquity.toLocaleString()} (Daily Limit: $${Math.abs(parseFloat(acc.daily_drawdown_limit)).toLocaleString()})`);
      message = 'Drawdown violation! The daily maximum loss limit has been breached. Account deactivated.';
    } else if (compliance && phase < 3) {
      // Profit-target check is measured from phase_start_balance (the balance when the CURRENT
      // phase began), not from the account's original size — so Phase 2 requires a genuine
      // additional gain rather than being auto-satisfied by Phase 1's (larger) target.
      const currentPhaseProfit = newEquity - phaseStartBalance;
      const targetProfit = phase === 1 ? parseFloat(acc.profit_target) : parseFloat(acc.profit_target_phase2 ?? '0');

      if (targetProfit > 0 && currentPhaseProfit >= targetProfit) {
        if (phase === 1) {
          phase = 2;
          status = 'Phase 2';
          phaseStartBalance = newEquity;
          message = `Congratulations! You have passed Phase 1. Promoting account to Phase 2 ($${size.toLocaleString()} Challenge).`;
        } else if (phase === 2) {
          phase = 3;
          status = 'Funded';
          phaseStartBalance = newEquity;
          message = `Outstanding! You have passed Phase 2. Your funded account credentials are now active at $${size.toLocaleString()}.`;

          const refundTxRef = 'TXN-' + Math.floor(100000 + Math.random() * 900000);
          await db.query(
            `INSERT INTO payments (user_id, user_name, user_email, amount, description, method, status, transaction_ref)
            VALUES ($1, $2, $3, $4, $5, 'Stripe', 'Refunded', $6)`,
            [
              req.user.id,
              req.user.fullName,
              req.user.email,
              size === 10000 ? 89 : size === 50000 ? 299 : size === 100000 ? 499 : 39,
              'Evaluation fee refund processed for passing the challenge',
              refundTxRef
            ]
          );
        }
      }
    }

    const updatedAccount = await db.query(
      `UPDATE trading_accounts
      SET balance = $1, equity = $2, trades_count = $3, win_rate = $4,
          equity_history = $5::jsonb, max_drawdown_current = $6, daily_drawdown_current = $7,
          status = $8, phase = $9, compliance = $10, violations = $11::jsonb, phase_start_balance = $12,
          trading_days_current = trading_days_current + 1
      WHERE id = $13 RETURNING *`,
      [newBalance, newEquity, newTradesCount, newWinRate, JSON.stringify(newHistory), maxDrawdownCurrent, dailyDrawdownCurrent, status, phase, compliance, JSON.stringify(violations), phaseStartBalance, id]
    );

    res.json({ ...updatedAccount.rows[0], message });
  } catch (error) {
    console.error('Failed to simulate trade:', error);
    res.status(500).json({ error: 'Simulation failed' });
  }
});

export default router;
