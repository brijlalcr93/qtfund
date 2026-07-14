import { Router, Response } from 'express';
import { db } from '../config/db';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../middleware/auth';

const router = Router();
const KYC_ADMIN_ROLES = ['Super Admin', 'Admin', 'Support Agent'];

// GET /api/kyc
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  try {
    const kycResult = await db.query('SELECT * FROM kyc_submissions WHERE user_id = $1', [req.user.id]);
    if (kycResult.rows.length === 0) {
      return res.status(200).json(null);
    }
    res.json(kycResult.rows[0]);
  } catch (error) {
    console.error('Failed to retrieve KYC details:', error);
    res.status(500).json({ error: 'Failed to retrieve KYC details' });
  }
});

// POST /api/kyc (submit KYC verification)
router.post('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  const { documentType, documentNumber, documentFileUrl, selfieFileUrl } = req.body;

  if (!documentType || !documentNumber) {
    return res.status(400).json({ error: 'Missing document type or serial ID' });
  }

  try {
    // Check if user already has an active KYC submission
    const existing = await db.query('SELECT * FROM kyc_submissions WHERE user_id = $1', [req.user.id]);
    
    let result;
    if (existing.rows.length > 0) {
      // Re-submit / update existing record
      result = await db.query(
        `UPDATE kyc_submissions
        SET document_type = $1, document_number = $2, document_file_url = $3, selfie_file_url = $4, status = 'Pending', feedback = NULL, submitted_at = CURRENT_TIMESTAMP
        WHERE user_id = $5 RETURNING *`,
        [documentType, documentNumber, documentFileUrl || 'https://via.placeholder.com/150', selfieFileUrl || 'https://via.placeholder.com/150', req.user.id]
      );
    } else {
      // Create new record
      result = await db.query(
        `INSERT INTO kyc_submissions (user_id, user_name, user_email, document_type, document_number, document_file_url, selfie_file_url, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
        [
          req.user.id,
          req.user.fullName,
          req.user.email,
          documentType,
          documentNumber,
          documentFileUrl || 'https://via.placeholder.com/150',
          selfieFileUrl || 'https://via.placeholder.com/150',
          'Pending'
        ]
      );
    }

    // Update KYC status on users table
    await db.query('UPDATE users SET kyc_status = $1 WHERE id = $2', ['Pending', req.user.id]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Failed to submit KYC verification:', error);
    res.status(500).json({ error: 'KYC submission failed' });
  }
});

// PUT /api/kyc/:userId/approve
router.put('/:userId/approve', authenticateToken, requireRole(KYC_ADMIN_ROLES), async (req: AuthenticatedRequest, res: Response) => {
  const { userId } = req.params;
  try {
    const updated = await db.query("UPDATE kyc_submissions SET status = 'Approved' WHERE user_id = $1 RETURNING *", [userId]);
    if (updated.rows.length === 0) return res.status(404).json({ error: 'KYC record not found' });
    await db.query("UPDATE users SET kyc_status = 'Approved' WHERE id = $1", [userId]);
    res.json(updated.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to approve KYC' });
  }
});

// PUT /api/kyc/:userId/reject
router.put('/:userId/reject', authenticateToken, requireRole(KYC_ADMIN_ROLES), async (req: AuthenticatedRequest, res: Response) => {
  const { userId } = req.params;
  const { feedback } = req.body;
  try {
    const updated = await db.query("UPDATE kyc_submissions SET status = 'Rejected', feedback = $1 WHERE user_id = $2 RETURNING *", [feedback || 'Rejected by admin', userId]);
    if (updated.rows.length === 0) return res.status(404).json({ error: 'KYC record not found' });
    await db.query("UPDATE users SET kyc_status = 'Rejected' WHERE id = $1", [userId]);
    res.json(updated.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to reject KYC' });
  }
});

export default router;
