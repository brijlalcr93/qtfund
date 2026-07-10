import { Router, Response } from 'express';
import { db } from '../config/db';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';

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
    // 1. Fetch challenge details
    const pkgResult = await db.query('SELECT * FROM challenge_plans WHERE id = $1', [packageId]);
    if (pkgResult.rows.length === 0) {
      return res.status(404).json({ error: 'Challenge package not found' });
    }
    const pkg = pkgResult.rows[0];

    // Calculate pricing with coupon if provided
    let finalAmount = parseFloat(pkg.price.replace(/[$,]/g, ''));
    if (couponCode) {
      const couponResult = await db.query('SELECT * FROM coupons WHERE code = $1 AND active = TRUE AND expiry_date > CURRENT_TIMESTAMP', [couponCode.toUpperCase()]);
      if (couponResult.rows.length > 0) {
        const coupon = couponResult.rows[0];
        if (coupon.usage_count < coupon.usage_limit) {
          const discount = finalAmount * (parseFloat(coupon.discount_percent) / 100);
          finalAmount -= discount;
          // Increment usage count
          await db.query('UPDATE coupons SET usage_count = usage_count + 1 WHERE code = $1', [coupon.code]);
        }
      }
    }

    // 2. Generate Account details
    const accountSize = parseFloat(pkg.size.replace(/[$,]/g, ''));
    const accountId = Math.floor(10000000 + Math.random() * 90000000).toString();
    const serverName = pkg.type === 'Instant' ? 'Quantum-Live-Pro' : `Quantum-Evaluation-${pkg.type === '1-Step' ? '1' : '2'}`;
    const initialStatus = pkg.type === 'Instant' ? 'Funded' : 'Phase 1';

    // Set drawdown thresholds based on rules
    let maxDrawdownLimit = - (accountSize * 0.10); // Default 10%
    let dailyDrawdownLimit = - (accountSize * 0.05); // Default 5%
    let profitTarget = accountSize * 0.08; // Default 8% for Phase 1
    let tradingDaysRequired = 10;

    pkg.rules.forEach((rule: { label: string; value: string }) => {
      if (rule.label === 'Max Overall Loss') {
        const pct = parseFloat(rule.value.replace('%', ''));
        maxDrawdownLimit = - (accountSize * (pct / 100));
      }
      if (rule.label === 'Max Daily Loss') {
        const pct = parseFloat(rule.value.replace('%', ''));
        dailyDrawdownLimit = - (accountSize * (pct / 100));
      }
      if (rule.label === 'Profit Target') {
        if (rule.value === 'None') profitTarget = 0;
        else {
          const match = rule.value.match(/(\d+)%/);
          if (match) profitTarget = accountSize * (parseFloat(match[1]) / 100);
        }
      }
      if (rule.label === 'Minimum Trading Days') {
        const days = parseInt(rule.value);
        tradingDaysRequired = isNaN(days) ? 0 : days;
      }
    });

    const mockEquityHistory = [{ day: '1', equity: accountSize }];

    // 3. Insert account
    const newAccount = await db.query(
      `INSERT INTO trading_accounts 
      (id, user_id, name, status, balance, initial_balance, equity, leverage, server, platform, profit_target, daily_drawdown_limit, max_drawdown_limit, trading_days_required, equity_history)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *`,
      [
        accountId,
        req.user.id,
        `${pkg.size} ${pkg.type} Challenge`,
        initialStatus,
        accountSize,
        accountSize,
        accountSize,
        '1:100',
        serverName,
        'MetaTrader 5',
        profitTarget,
        dailyDrawdownLimit,
        maxDrawdownLimit,
        tradingDaysRequired,
        JSON.stringify(mockEquityHistory)
      ]
    );

    // 4. Save Payment record
    const transactionRef = 'TXN-' + Math.floor(100000 + Math.random() * 900000);
    await db.query(
      `INSERT INTO payments (user_id, user_name, user_email, amount, description, method, status, transaction_ref)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        req.user.id,
        req.user.fullName,
        req.user.email,
        finalAmount,
        `Purchase of ${pkg.size} ${pkg.type} Challenge`,
        'Stripe',
        'Paid',
        transactionRef
      ]
    );

    res.status(201).json(newAccount.rows[0]);
  } catch (error) {
    console.error('Failed to purchase challenge:', error);
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
      SET status = 'Phase 1', balance = initial_balance, equity = initial_balance,
          daily_drawdown_current = 0, max_drawdown_current = 0, trading_days_current = 0,
          win_rate = 0.00, trades_count = 0, equity_history = $1::jsonb
      WHERE id = $2 RETURNING *`,
      [JSON.stringify([{ day: '1', equity: parseFloat(acc.initial_balance) }]), id]
    );

    res.json(resetResult.rows[0]);
  } catch (error) {
    console.error('Failed to reset account:', error);
    res.status(500).json({ error: 'Reset request failed' });
  }
});

// POST /api/dashboard/accounts/:id/simulate-trade (to populate/manipulate account metrics for testing)
router.post('/accounts/:id/simulate-trade', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  const { id } = req.params;
  const { profitAmount, isWin } = req.body;

  if (profitAmount === undefined) {
    return res.status(400).json({ error: 'profitAmount required' });
  }

  try {
    const checkAccount = await db.query('SELECT * FROM trading_accounts WHERE id = $1 AND user_id = $2', [id, req.user.id]);
    if (checkAccount.rows.length === 0) {
      return res.status(404).json({ error: 'Trading account not found' });
    }
    
    const acc = checkAccount.rows[0];
    const newBalance = parseFloat(acc.balance) + parseFloat(profitAmount);
    const newEquity = newBalance;
    const newTradesCount = acc.trades_count + 1;
    
    // Recalculate win rate
    const winsCount = isWin ? Math.round(acc.win_rate * acc.trades_count / 100) + 1 : Math.round(acc.win_rate * acc.trades_count / 100);
    const newWinRate = parseFloat(((winsCount / newTradesCount) * 100).toFixed(1));

    // Append equity history
    const history = Array.isArray(acc.equity_history) ? acc.equity_history : [];
    const nextDay = (history.length + 1).toString();
    const newHistory = [...history, { day: nextDay, equity: newEquity }];

    // Drawdowns
    const startingBalance = parseFloat(acc.initial_balance);
    const maxDrawdownCurrent = newEquity - startingBalance;
    const dailyDrawdownCurrent = parseFloat(acc.daily_drawdown_current) + (profitAmount < 0 ? parseFloat(profitAmount) : 0);

    // Rule violations
    let updatedStatus = acc.status;
    if (newEquity <= (startingBalance + parseFloat(acc.max_drawdown_limit))) {
      updatedStatus = 'Breached';
    } else if (dailyDrawdownCurrent <= parseFloat(acc.daily_drawdown_limit)) {
      updatedStatus = 'Breached';
    }

    // Auto-advance challenge if targets met
    if (updatedStatus === 'Phase 1' && (newEquity >= startingBalance + parseFloat(acc.profit_target))) {
      updatedStatus = 'Phase 2';
    } else if (updatedStatus === 'Phase 2' && (newEquity >= startingBalance + parseFloat(acc.profit_target))) {
      updatedStatus = 'Funded';
    }

    const updatedAccount = await db.query(
      `UPDATE trading_accounts
      SET balance = $1, equity = $2, trades_count = $3, win_rate = $4,
          equity_history = $5::jsonb, max_drawdown_current = $6, daily_drawdown_current = $7,
          status = $8, trading_days_current = trading_days_current + 1
      WHERE id = $9 RETURNING *`,
      [newBalance, newEquity, newTradesCount, newWinRate, JSON.stringify(newHistory), maxDrawdownCurrent, dailyDrawdownCurrent, updatedStatus, id]
    );

    res.json(updatedAccount.rows[0]);
  } catch (error) {
    console.error('Failed to simulate trade:', error);
    res.status(500).json({ error: 'Simulation failed' });
  }
});

export default router;
