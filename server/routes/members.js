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

// Get all members (admin only)
router.get('/', requireAuth, requireAdmin, (req, res) => {
  const members = db.prepare('SELECT id, provider, provider_id, name, display_name, email, avatar, role, discord_id, joined_at FROM members ORDER BY joined_at DESC').all();
  res.json(members);
});

// Get current member profile
router.get('/me', requireAuth, (req, res) => {
  const member = db.prepare('SELECT id, provider, provider_id, name, display_name, email, avatar, role, discord_id, joined_at FROM members WHERE id = ?').get(req.session.userId);
  if (!member) {
    return res.status(404).json({ error: 'Member not found' });
  }
  res.json(member);
});

// Approve member (admin only)
router.post('/:id/approve', requireAuth, requireAdmin, (req, res) => {
  const { id } = req.params;
  
  const stmt = db.prepare('UPDATE members SET role = ?, updated_at = strftime("%s", "now") WHERE id = ?');
  const result = stmt.run('member', id);
  
  if (result.changes === 0) {
    return res.status(404).json({ error: 'Member not found' });
  }
  
  logAudit('member_approved', req.session.userId, id, null, null);
  res.json({ success: true });
});

// Deny member (admin only)
router.post('/:id/deny', requireAuth, requireAdmin, (req, res) => {
  const { id } = req.params;
  
  const stmt = db.prepare('DELETE FROM members WHERE id = ?');
  const result = stmt.run(id);
  
  if (result.changes === 0) {
    return res.status(404).json({ error: 'Member not found' });
  }
  
  logAudit('member_denied', req.session.userId, id, null, null);
  res.json({ success: true });
});

// Sign agreement
router.post('/agreement', requireAuth, (req, res) => {
  const { ip } = req;
  
  const stmt = db.prepare(`
    UPDATE members 
    SET agreement_signed_at = strftime("%s", "now"), 
        agreement_ip = ?,
        updated_at = strftime("%s", "now")
    WHERE id = ?
  `);
  const result = stmt.run(ip, req.session.userId);
  
  if (result.changes === 0) {
    return res.status(404).json({ error: 'Member not found' });
  }
  
  logAudit('agreement_signed', req.session.userId, req.session.userId, null, null);
  res.json({ success: true });
});

// Get member contribution stats
router.get('/:id/stats', requireAuth, (req, res) => {
  const { id } = req.params;
  
  // Get total contributed
  const totalResult = db.prepare(`
    SELECT COALESCE(SUM(amount_chf), 0) as total
    FROM contributions
    WHERE member_id = ? AND status = 'confirmed'
  `).get(id);
  
  // Get months with contributions
  const monthsResult = db.prepare(`
    SELECT COUNT(DISTINCT strftime("%Y-%m", datetime(created_at, "unixepoch"))) as months
    FROM contributions
    WHERE member_id = ? AND status = 'confirmed'
  `).get(id);
  
  // Get member info for joined date
  const member = db.prepare('SELECT joined_at FROM members WHERE id = ?').get(id);
  if (!member) {
    return res.status(404).json({ error: 'Member not found' });
  }
  
  // Calculate active months
  const joinedDate = new Date(member.joined_at * 1000);
  const now = new Date();
  const activeMonths = Math.max(1, 
    (now.getFullYear() - joinedDate.getFullYear()) * 12 + 
    (now.getMonth() - joinedDate.getMonth()) + 1
  );
  
  // Calculate consistency score
  const consistencyScore = activeMonths > 0 ? (monthsResult.months / activeMonths) * 100 : 0;
  
  // Calculate contribution score
  const volumeScore = totalResult.total;
  const contributionScore = (consistencyScore * 0.45) + (volumeScore * 0.55);
  
  // Determine tier
  let tier = 'starter';
  if (contributionScore >= 50) tier = 'contributor';
  if (monthsResult.months >= 3 && consistencyScore >= 60) tier = 'regular';
  if ((monthsResult.months >= 6 && consistencyScore >= 70) || totalResult.total >= 500) tier = 'backbone';
  if (monthsResult.months >= 12 && consistencyScore >= 80 && totalResult.total >= 1000) tier = 'legend';
  
  res.json({
    total_contributed: totalResult.total,
    months_with_contributions: monthsResult.months,
    active_months: activeMonths,
    consistency_score: consistencyScore,
    contribution_score: contributionScore,
    tier
  });
});

export default router;