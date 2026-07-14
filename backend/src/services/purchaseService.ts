import { db } from '../config/db';

interface PurchaseBuyer {
  id: string;
  fullName: string;
  email: string;
}

/**
 * Creates a trading account for a challenge purchase, applies a coupon if valid, and credits
 * the referring affiliate's commission if the buyer signed up under a referral code. Shared by
 * every payment method (card, crypto) so the account-creation/affiliate logic only exists once.
 */
export async function finalizePurchase(
  buyer: PurchaseBuyer,
  packageId: string,
  couponCode: string | undefined,
  method: 'Stripe' | 'PayPal' | 'Razorpay' | 'Crypto',
  transactionRef: string
) {
  const pkgResult = await db.query('SELECT * FROM challenge_plans WHERE id = $1', [packageId]);
  if (pkgResult.rows.length === 0) {
    throw new Error('Challenge package not found');
  }
  const pkg = pkgResult.rows[0];

  let finalAmount = parseFloat(pkg.price.replace(/[$,]/g, ''));
  if (couponCode) {
    const couponResult = await db.query('SELECT * FROM coupons WHERE code = $1 AND active = TRUE AND expiry_date > CURRENT_TIMESTAMP', [couponCode.toUpperCase()]);
    if (couponResult.rows.length > 0) {
      const coupon = couponResult.rows[0];
      if (coupon.usage_count < coupon.usage_limit) {
        const discount = finalAmount * (parseFloat(coupon.discount_percent) / 100);
        finalAmount -= discount;
        await db.query('UPDATE coupons SET usage_count = usage_count + 1 WHERE code = $1', [coupon.code]);
      }
    }
  }

  const accountSize = parseFloat(pkg.size.replace(/[$,]/g, ''));
  const accountId = Math.floor(10000000 + Math.random() * 90000000).toString();
  const serverName = pkg.type === 'Instant' ? 'Quantum-Live-Pro' : `Quantum-Evaluation-${pkg.type === '1-Step' ? '1' : '2'}`;
  const isInstant = pkg.type === 'Instant';
  const initialStatus = isInstant ? 'Funded' : 'Phase 1';
  const initialPhase = isInstant ? 3 : 1;

  const maxDrawdownLimit = -(accountSize * (parseFloat(pkg.max_drawdown_pct ?? 10) / 100));
  const dailyDrawdownLimit = -(accountSize * (parseFloat(pkg.daily_drawdown_pct ?? 5) / 100));
  const profitTargetPhase1 = pkg.profit_target_phase1_pct != null ? accountSize * (parseFloat(pkg.profit_target_phase1_pct) / 100) : 0;
  const profitTargetPhase2 = pkg.profit_target_phase2_pct != null ? accountSize * (parseFloat(pkg.profit_target_phase2_pct) / 100) : null;
  const tradingDaysRequired = 10;

  const mockEquityHistory = [{ day: '1', equity: accountSize, balance: accountSize }];

  const newAccount = await db.query(
    `INSERT INTO trading_accounts
    (id, user_id, name, status, phase, balance, initial_balance, phase_start_balance, equity, leverage, server, platform, profit_target, profit_target_phase2, daily_drawdown_limit, max_drawdown_limit, trading_days_required, equity_history)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
    RETURNING *`,
    [
      accountId,
      buyer.id,
      `${pkg.size} ${pkg.type} Challenge`,
      initialStatus,
      initialPhase,
      accountSize,
      accountSize,
      accountSize,
      accountSize,
      '1:100',
      serverName,
      'MetaTrader 5',
      profitTargetPhase1,
      profitTargetPhase2,
      dailyDrawdownLimit,
      maxDrawdownLimit,
      tradingDaysRequired,
      JSON.stringify(mockEquityHistory)
    ]
  );

  await db.query(
    `INSERT INTO payments (user_id, user_name, user_email, amount, description, method, status, transaction_ref)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      buyer.id,
      buyer.fullName,
      buyer.email,
      finalAmount,
      `Purchase of ${pkg.size} ${pkg.type} Challenge`,
      method,
      'Paid',
      transactionRef
    ]
  );

  // Affiliate commission chain — if this buyer signed up under a referral code, credit the
  // referring affiliate now that a real purchase (not just signup) has occurred.
  const buyerResult = await db.query('SELECT referred_by_code FROM users WHERE id = $1', [buyer.id]);
  const referredByCode = buyerResult.rows[0]?.referred_by_code;
  if (referredByCode) {
    const affiliateResult = await db.query(
      `SELECT ap.*, u.email AS referrer_email, u.full_name AS referrer_name
      FROM affiliate_profiles ap
      JOIN users u ON u.id = ap.user_id
      WHERE ap.referral_code = $1`,
      [referredByCode]
    );
    if (affiliateResult.rows.length > 0) {
      const affiliate = affiliateResult.rows[0];
      const commissionAmount = Math.round(finalAmount * (parseFloat(affiliate.commission_percent) / 100) * 100) / 100;

      await db.query(
        `INSERT INTO referrals (affiliate_id, referred_user_name, status, commission)
        VALUES ($1, $2, 'Purchased', $3)`,
        [affiliate.id, buyer.fullName, commissionAmount]
      );

      await db.query(
        'UPDATE affiliate_profiles SET total_earned = total_earned + $1, pending_payout = pending_payout + $1 WHERE id = $2',
        [commissionAmount, affiliate.id]
      );

      await db.query(
        'UPDATE users SET earnings = earnings + $1 WHERE id = $2',
        [commissionAmount, affiliate.user_id]
      );

      const commissionTxRef = 'TXN-' + Math.floor(100000 + Math.random() * 900000);
      await db.query(
        `INSERT INTO payments (user_id, user_name, user_email, amount, description, method, status, transaction_ref)
        VALUES ($1, $2, $3, $4, $5, 'Stripe', 'Paid', $6)`,
        [
          affiliate.user_id,
          affiliate.referrer_name,
          affiliate.referrer_email,
          commissionAmount,
          `Affiliate commission from referral purchase of ${pkg.size} ${pkg.type} Challenge`,
          commissionTxRef
        ]
      );
    }
  }

  return newAccount.rows[0];
}
