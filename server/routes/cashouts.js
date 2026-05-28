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

// Get all proposals
router.get('/', requireAuth, (req, res) => {
  const proposals = db.prepare(`
    SELECT p.*, m.name as proposer_name, 
           (SELECT COUNT(*) FROM cashout_votes WHERE proposal_id = p.id AND vote = 'approve') as approve_count,
           (SELECT COUNT(*) FROM cashout_votes WHERE proposal_id = p.id AND vote = 'deny') as deny_count
    FROM cashout_proposals p
    JOIN members m ON p.proposed_by = m.id
    ORDER BY p.created_at DESC
  `).all();
  
  res.json(proposals);
});

// Get single proposal with votes
router.get('/:id', requireAuth, (req, res) => {
  const { id } = req.params;
  
  const proposal = db.prepare(`
    SELECT p.*, m.name as proposer_name
    FROM cashout_proposals p
    JOIN members m ON p.proposed_by = m.id
    WHERE p.id = ?
  `).get(id);
  
  if (!proposal) {
    return res.status(404).json({ error: 'Proposal not found' });
  }
  
  const votes = db.prepare(`
    SELECT v.*, m.name as voter_name
    FROM cashout_votes v
    JOIN members m ON v.member_id = m.id
    WHERE v.proposal_id = ?
    ORDER BY v.voted_at ASC
  `).all(id);
  
  // Check if current user has voted
  const userVote = db.prepare(`
    SELECT vote FROM cashout_votes 
    WHERE proposal_id = ? AND member_id = ?
  `).get(id, req.session.userId);
  
  res.json({ ...proposal, votes, userVote: userVote?.vote || null });
});

// Create proposal
router.post('/', requireAuth, (req, res) => {
  const { title, description, amount_chf, evidence_url } = req.body;
  
  if (!title || !amount_chf) {
    return res.status(400).json({ error: 'Title and amount are required' });
  }
  
  // Calculate closing time (48 hours from now)
  const closesAt = Math.floor(Date.now() / 1000) + (48 * 60 * 60);
  
  const stmt = db.prepare(`
    INSERT INTO cashout_proposals (proposed_by, title, description, amount_chf, evidence_url, closes_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  
  const result = stmt.run(req.session.userId, title, description, amount_chf, evidence_url);
  
  logAudit('cashout_proposed', req.session.userId, null, amount_chf, JSON.stringify({ title, description }));
  
  const proposal = db.prepare('SELECT * FROM cashout_proposals WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(proposal);
});

// Vote on proposal
router.post('/:id/vote', requireAuth, (req, res) => {
  const { id } = req.params;
  const { vote } = req.body;
  
  if (!['approve', 'deny'].includes(vote)) {
    return res.status(400).json({ error: 'Invalid vote' });
  }
  
  const proposal = db.prepare('SELECT * FROM cashout_proposals WHERE id = ?').get(id);
  if (!proposal) {
    return res.status(404).json({ error: 'Proposal not found' });
  }
  
  if (proposal.status !== 'voting') {
    return res.status(400).json({ error: 'Proposal is not in voting status' });
  }
  
  if (proposal.closes_at < Math.floor(Date.now() / 1000)) {
    return res.status(400).json({ error: 'Voting has closed' });
  }
  
  // Check if already voted
  const existingVote = db.prepare(`
    SELECT id FROM cashout_votes 
    WHERE proposal_id = ? AND member_id = ?
  `).get(id, req.session.userId);
  
  if (existingVote) {
    // Update vote
    const stmt = db.prepare(`
      UPDATE cashout_votes 
      SET vote = ?, voted_at = strftime("%s", "now")
      WHERE id = ?
    `);
    stmt.run(vote, existingVote.id);
  } else {
    // Insert new vote
    const stmt = db.prepare(`
      INSERT INTO cashout_votes (proposal_id, member_id, vote)
      VALUES (?, ?, ?)
    `);
    stmt.run(id, req.session.userId, vote);
  }
  
  logAudit('cashout_voted', req.session.userId, id, null, JSON.stringify({ vote }));
  res.json({ success: true });
});

// Execute cashout (admin only)
router.post('/:id/execute', requireAuth, requireAdmin, (req, res) => {
  const { id } = req.params;
  
  const proposal = db.prepare('SELECT * FROM cashout_proposals WHERE id = ?').get(id);
  if (!proposal) {
    return res.status(404).json({ error: 'Proposal not found' });
  }
  
  if (proposal.status !== 'approved') {
    return res.status(400).json({ error: 'Proposal must be approved before execution' });
  }
  
  const stmt = db.prepare(`
    UPDATE cashout_proposals 
    SET status = 'executed', 
        executed_at = strftime("%s", "now"),
        executed_by = ?
    WHERE id = ?
  `);
  const result = stmt.run(req.session.userId, id);
  
  if (result.changes === 0) {
    return res.status(404).json({ error: 'Proposal not found' });
  }
  
  logAudit('cashout_executed', req.session.userId, id, proposal.amount_chf, JSON.stringify({ title: proposal.title }));
  res.json({ success: true });
});

export default router;