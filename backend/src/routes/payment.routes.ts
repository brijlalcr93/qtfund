import { Router, Response } from 'express';
import { db } from '../config/db';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// GET /api/payments/history
router.get('/history', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  try {
    const history = await db.query('SELECT * FROM payments WHERE user_id = $1 ORDER BY date DESC', [req.user.id]);
    res.json(history.rows);
  } catch (error) {
    console.error('Failed to get transaction history:', error);
    res.status(500).json({ error: 'Failed to retrieve transaction history' });
  }
});

// POST /api/payments/checkout
router.post('/checkout', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  const { packageId, method, couponCode } = req.body;

  if (!packageId || !method) {
    return res.status(400).json({ error: 'packageId and payment method required' });
  }

  try {
    // 1. Fetch challenge info
    const pkgResult = await db.query('SELECT * FROM challenge_plans WHERE id = $1', [packageId]);
    if (pkgResult.rows.length === 0) {
      return res.status(404).json({ error: 'Challenge package not found' });
    }
    const pkg = pkgResult.rows[0];

    // Calculate amount
    let amount = parseFloat(pkg.price.replace(/[$,]/g, ''));
    
    // Apply coupon
    if (couponCode) {
      const couponResult = await db.query('SELECT * FROM coupons WHERE code = $1 AND active = TRUE', [couponCode.toUpperCase()]);
      if (couponResult.rows.length > 0) {
        const coupon = couponResult.rows[0];
        const discount = amount * (parseFloat(coupon.discount_percent) / 100);
        amount -= discount;
      }
    }

    // 2. Generate simulated gateway checkouts
    const transactionRef = 'TXN-' + Math.floor(100000 + Math.random() * 900000);
    const mockSessionUrl = `https://checkout.sandbox.gateway.com/pay/${transactionRef}?amount=${amount}&currency=USD`;

    res.json({
      checkoutUrl: mockSessionUrl,
      transactionRef,
      amount,
      description: `Purchase of ${pkg.size} ${pkg.type} Challenge`,
    });
  } catch (error) {
    console.error('Checkout failed:', error);
    res.status(500).json({ error: 'Checkout session creation failed' });
  }
});

// POST /api/payments/refund
router.post('/refund', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const { paymentId } = req.body;
  if (!paymentId) return res.status(400).json({ error: 'paymentId required' });
  try {
    const updated = await db.query(
      "UPDATE payments SET status = 'Refunded' WHERE id = $1 RETURNING *",
      [paymentId]
    );
    if (updated.rows.length === 0) return res.status(404).json({ error: 'Payment record not found' });
    res.json(updated.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Refund processing failed' });
  }
});

export default router;
