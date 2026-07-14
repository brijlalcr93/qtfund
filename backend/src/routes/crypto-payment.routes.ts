import crypto from 'crypto';
import { Router, Response } from 'express';
import { Invoice as InvoiceNamespace, Facade } from 'bitpay-sdk';
import { db } from '../config/db';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { getBitPayClient, isBitPayConfigured } from '../config/bitpay';
import { finalizePurchase } from '../services/purchaseService';

const router = Router();

// Statuses BitPay uses that mean "funds received, safe to deliver the product".
// "confirmed" = seen on-chain with enough confirmations; "complete" = fully settled.
const PAID_STATUSES = ['confirmed', 'complete'];

// POST /api/payments/crypto/create-invoice — creates a BitPay-hosted checkout page for a
// challenge purchase. The frontend redirects the browser to the returned invoice URL; BitPay
// handles crypto selection, address generation, QR code, and countdown timer itself.
router.post('/create-invoice', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  if (!isBitPayConfigured()) {
    return res.status(503).json({ error: 'Crypto payments are not configured on this server yet.' });
  }

  const { packageId, couponCode } = req.body;
  if (!packageId) {
    return res.status(400).json({ error: 'Package ID required' });
  }

  try {
    const pkgResult = await db.query('SELECT * FROM challenge_plans WHERE id = $1', [packageId]);
    if (pkgResult.rows.length === 0) {
      return res.status(404).json({ error: 'Challenge package not found' });
    }
    const pkg = pkgResult.rows[0];

    let amountUsd = parseFloat(pkg.price.replace(/[$,]/g, ''));
    if (couponCode) {
      const couponResult = await db.query('SELECT * FROM coupons WHERE code = $1 AND active = TRUE AND expiry_date > CURRENT_TIMESTAMP', [couponCode.toUpperCase()]);
      if (couponResult.rows.length > 0) {
        const coupon = couponResult.rows[0];
        if (coupon.usage_count < coupon.usage_limit) {
          amountUsd -= amountUsd * (parseFloat(coupon.discount_percent) / 100);
        }
      }
      // Note: coupon usage_count is only incremented once the purchase is actually finalized
      // (see finalizePurchase), not at invoice-creation time — an abandoned crypto invoice
      // must not burn a coupon redemption.
    }

    // Generate our own reference before creating the invoice — BitPay's invoice id isn't known
    // until after creation, so it can't be embedded in the invoice's own redirectURL. The
    // frontend receives this ref in the redirect URL and polls status by it.
    const orderRef = crypto.randomUUID();

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5174';
    const invoice = new InvoiceNamespace.Invoice(Math.round(amountUsd * 100) / 100, 'USD');
    invoice.orderId = orderRef;
    invoice.itemDesc = `${pkg.size} ${pkg.type} Challenge`;
    invoice.notificationURL = `${(process.env.BACKEND_PUBLIC_URL || `http://localhost:${process.env.PORT || 3002}`)}/api/payments/crypto/webhook`;
    invoice.redirectURL = `${frontendUrl}/checkout/crypto-return?ref=${orderRef}`;
    invoice.buyer = { name: req.user.fullName, email: req.user.email } as any;
    invoice.fullNotifications = true;
    invoice.extendedNotifications = true;

    const client = getBitPayClient();
    const createdInvoice = await client.createInvoice(invoice, Facade.Merchant, true);

    await db.query(
      `INSERT INTO crypto_invoices (id, order_ref, user_id, package_id, coupon_code, amount_usd, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [createdInvoice.id, orderRef, req.user.id, packageId, couponCode || null, amountUsd, createdInvoice.status || 'new']
    );

    res.status(201).json({ orderRef, invoiceUrl: createdInvoice.url });
  } catch (error: any) {
    console.error('Failed to create crypto invoice:', error);
    res.status(500).json({ error: 'Failed to create crypto invoice' });
  }
});

// POST /api/payments/crypto/webhook — BitPay's Instant Payment Notification callback. We never
// trust the webhook body's status directly (it's unauthenticated over the network); instead we
// re-fetch the invoice from BitPay's API using our own merchant credentials and act only on that
// authoritative response. This is idempotent — already-finalized invoices are skipped.
router.post('/webhook', async (req, res) => {
  try {
    const invoiceId = req.body?.data?.id || req.body?.id;
    if (!invoiceId) {
      return res.status(400).json({ error: 'Missing invoice id in webhook payload' });
    }

    if (!isBitPayConfigured()) {
      console.error('Received BitPay webhook but crypto payments are not configured');
      return res.status(503).end();
    }

    const client = getBitPayClient();
    const invoice = await client.getInvoice(invoiceId, Facade.Merchant, true);

    const existing = await db.query('SELECT * FROM crypto_invoices WHERE id = $1', [invoiceId]);
    if (existing.rows.length === 0) {
      console.error(`Webhook for unknown crypto invoice ${invoiceId}`);
      return res.status(404).end();
    }
    const record = existing.rows[0];

    if (record.status === 'paid') {
      // Already finalized — acknowledge without doing anything again.
      return res.status(200).end();
    }

    if (invoice.status && PAID_STATUSES.includes(invoice.status)) {
      const userResult = await db.query('SELECT id, full_name, email FROM users WHERE id = $1', [record.user_id]);
      if (userResult.rows.length === 0) {
        return res.status(404).end();
      }
      const user = userResult.rows[0];

      const account = await finalizePurchase(
        { id: user.id, fullName: user.full_name, email: user.email },
        record.package_id,
        record.coupon_code || undefined,
        'Crypto',
        invoiceId
      );

      await db.query(
        `UPDATE crypto_invoices SET status = 'paid', trading_account_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
        [account.id, invoiceId]
      );
    } else {
      await db.query(
        `UPDATE crypto_invoices SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
        [invoice.status || record.status, invoiceId]
      );
    }

    res.status(200).end();
  } catch (error) {
    console.error('Failed to process BitPay webhook:', error);
    // Return 500 so BitPay retries the notification later.
    res.status(500).end();
  }
});

// GET /api/payments/crypto/status-by-ref/:orderRef — polled by the frontend after BitPay
// redirects back, in case the webhook hasn't landed yet (e.g. the customer's browser gets back
// faster than BitPay's server-to-server callback).
router.get('/status-by-ref/:orderRef', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  const { orderRef } = req.params;

  try {
    const result = await db.query('SELECT * FROM crypto_invoices WHERE order_ref = $1 AND user_id = $2', [orderRef, req.user.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    const record = result.rows[0];
    res.json({ status: record.status, tradingAccountId: record.trading_account_id });
  } catch (error) {
    console.error('Failed to check crypto invoice status:', error);
    res.status(500).json({ error: 'Failed to check invoice status' });
  }
});

export default router;
