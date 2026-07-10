import { Router, Response } from 'express';
import { db } from '../config/db';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// GET /api/support/tickets
router.get('/tickets', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  try {
    const tickets = await db.query('SELECT * FROM support_tickets WHERE user_id = $1 ORDER BY updated_at DESC', [req.user.id]);
    res.json(tickets.rows);
  } catch (error) {
    console.error('Failed to get tickets:', error);
    res.status(500).json({ error: 'Failed to retrieve support tickets' });
  }
});

// POST /api/support/tickets (create ticket)
router.post('/tickets', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  const { subject, category, messageText } = req.body;

  if (!subject || !category || !messageText) {
    return res.status(400).json({ error: 'Missing subject, category, or initial message details' });
  }

  try {
    const ticketId = 'TKT-' + Math.floor(10000 + Math.random() * 90000);
    
    // Create support ticket
    await db.query(
      `INSERT INTO support_tickets (id, user_id, subject, category, status)
      VALUES ($1, $2, $3, $4, $5)`,
      [ticketId, req.user.id, subject, category, 'Open']
    );

    // Insert first message
    const msg = await db.query(
      `INSERT INTO support_messages (ticket_id, sender, text)
      VALUES ($1, $2, $3) RETURNING *`,
      [ticketId, 'User', messageText]
    );

    res.status(201).json({
      id: ticketId,
      subject,
      category,
      status: 'Open',
      messages: [msg.rows[0]]
    });
  } catch (error) {
    console.error('Failed to create ticket:', error);
    res.status(500).json({ error: 'Ticket creation failed' });
  }
});

// GET /api/support/tickets/:id/messages
router.get('/tickets/:id/messages', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  const { id } = req.params;

  try {
    // Verify ownership
    const ticketCheck = await db.query('SELECT * FROM support_tickets WHERE id = $1 AND user_id = $2', [id, req.user.id]);
    if (ticketCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const messages = await db.query('SELECT * FROM support_messages WHERE ticket_id = $1 ORDER BY time ASC', [id]);
    res.json(messages.rows);
  } catch (error) {
    console.error('Failed to retrieve messages:', error);
    res.status(500).json({ error: 'Failed to retrieve messages' });
  }
});

// POST /api/support/tickets/:id/messages (add reply)
router.post('/tickets/:id/messages', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  const { id } = req.params;
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'Message text required' });
  }

  try {
    // Verify ownership
    const ticketCheck = await db.query('SELECT * FROM support_tickets WHERE id = $1 AND user_id = $2', [id, req.user.id]);
    if (ticketCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    // Insert reply message
    const msg = await db.query(
      `INSERT INTO support_messages (ticket_id, sender, text)
      VALUES ($1, $2, $3) RETURNING *`,
      [id, 'User', text]
    );

    // Update ticket status & update timestamp
    await db.query(
      `UPDATE support_tickets
      SET status = 'Open', updated_at = CURRENT_TIMESTAMP
      WHERE id = $1`,
      [id]
    );

    res.status(201).json(msg.rows[0]);
  } catch (error) {
    console.error('Failed to add ticket reply:', error);
    res.status(500).json({ error: 'Reply post failed' });
  }
});

export default router;
