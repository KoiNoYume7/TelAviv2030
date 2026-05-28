import express from 'express';
import db from '../db/db.js';

const router = express.Router();

// Middleware: Check authentication
function requireAuth(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  next();
}

// Middleware: Check admin role
function requireAdmin(req, res, next) {
  if (!req.session.userId || req.session.userRole !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

// Helper: Log audit action
function logAudit(action, actorId, subjectId, amountChf = null, meta = null) {
  const stmt = db.prepare(`
    INSERT INTO audit_log (action, actor_id, subject_id, amount_chf, meta)
    VALUES (?, ?, ?, ?, ?)
  `);
  stmt.run(action, actorId, subjectId, amountChf, meta);
}

// Get all contributions (admin only)
router.get('/', requireAuth, requireAdmin, (req, res) => {
  const contributions = db.prepare(`
    SELECT c.*, m.name, m.display_name
    FROM contributions c
    JOIN members m ON c.member_id = m.id
    ORDER BY c.created_at DESC
  `).all();
  res.json(contributions);
});

// Get current user's contributions
router.get('/me', requireAuth, (req, res) => {
  const contributions = db.prepare(`
    SELECT * FROM contributions 
    WHERE member_id = ? 
    ORDER BY created_at DESC
  `).all(req.session.userId);
  res.json(contributions);
});

// Create contribution
router.post('/', requireAuth, (req, res) => {
  const { amount_chf, method, note } = req.body;
  
  if (!amount_chf || !method) {
    return res.status(400).json({ error: 'Amount and method are required' });
  }
  
  if (!['twint', 'stripe'].includes(method)) {
    return res.status(400).json({ error: 'Invalid payment method' });
  }
  
  const stmt = db.prepare(`
    INSERT INTO contributions (member_id, amount_chf, method, note, status)
    VALUES (?, ?, ?, ?, 'pending')
  `);
  
  const result = stmt.run(req.session.userId, amount_chf, method, note);
  
  logAudit('contribution_created', req.session.userId, req.session.userId, amount_chf, JSON.stringify({ method, note }));
  
  const contribution = db.prepare('SELECT * FROM contributions WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(contribution);
});

// Confirm contribution (admin only)
router.post('/:id/confirm', requireAuth, requireAdmin, (req, res) => {
  const { id } = req.params;
  
  const contribution = db.prepare('SELECT * FROM contributions WHERE id = ?').get(id);
  if (!contribution) {
    return res.status(404).json({ error: 'Contribution not found' });
  }
  
  const stmt = db.prepare(`
    UPDATE contributions 
    SET status = 'confirmed', 
        confirmed_by = ?,
        confirmed_at = strftime("%s", "now")
    WHERE id = ?
  `);
  const result = stmt.run(req.session.userId, id);
  
  if (result.changes === 0) {
    return res.status(404).json({ error: 'Contribution not found' });
  }
  
  logAudit('contribution_confirmed', req.session.userId, contribution.member_id, contribution.amount_chf, JSON.stringify({ method: contribution.method }));
  res.json({ success: true });
});

// Reject contribution (admin only)
router.post('/:id/reject', requireAuth, requireAdmin, (req, res) => {
  const { id } = req.params;
  
  const contribution = db.prepare('SELECT * FROM contributions WHERE id = ?').get(id);
  if (!contribution) {
    return res.status(404).json({ error: 'Contribution not found' });
  }
  
  const stmt = db.prepare(`
    UPDATE contributions 
    SET status = 'rejected'
    WHERE id = ?
  `);
  const result = stmt.run(id);
  
  if (result.changes === 0) {
    return res.status(404).json({ error: 'Contribution not found' });
  }
  
  logAudit('contribution_rejected', req.session.userId, contribution.member_id, contribution.amount_chf, JSON.stringify({ method: contribution.method }));
  res.json({ success: true });
});

// Get group balance (all members)
router.get('/balance/total', requireAuth, (req, res) => {
  const result = db.prepare(`
    SELECT COALESCE(SUM(amount_chf), 0) as total
    FROM contributions
    WHERE status = 'confirmed'
  `).get();
  
  res.json({ total: result.total });
});

export default router;