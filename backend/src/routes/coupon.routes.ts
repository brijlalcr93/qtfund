import { Router, Response } from 'express';
import { db } from '../config/db';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// GET /api/coupons/check/:code
router.get('/check/:code', async (req, res) => {
  const { code } = req.params;
  try {
    const couponResult = await db.query(
      'SELECT * FROM coupons WHERE code = $1 AND active = TRUE AND expiry_date > CURRENT_TIMESTAMP',
      [code.toUpperCase()]
    );
    if (couponResult.rows.length === 0) {
      return res.json({ active: false });
    }
    const coupon = couponResult.rows[0];
    res.json({
      active: coupon.usage_count < coupon.usage_limit,
      discountPercent: parseFloat(coupon.discount_percent)
    });
  } catch (error) {
    res.status(500).json({ error: 'Coupon check failed' });
  }
});

// POST /api/coupons (Admin only)
router.post('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
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

// DELETE /api/coupons/:code (Admin only)
router.delete('/:code', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const { code } = req.params;
  try {
    await db.query('DELETE FROM coupons WHERE code = $1', [code.toUpperCase()]);
    res.json({ message: `Coupon ${code} successfully deleted` });
  } catch (error) {
    console.error('Failed deleting coupon:', error);
    res.status(500).json({ error: 'Failed deleting coupon' });
  }
});

export default router;
