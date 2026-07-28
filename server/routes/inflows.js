// ── Contributions & Donations routes ──
import { Router } from 'express'
import { getDb } from '../db/db.js'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { logEvent } from '../lib/audit.js'

const router = Router()

const VALID_STATUS = ['PENDING', 'SETTLED', 'CANCELLED']

function requireTelAviver(req, res, next) {
  if (req.member.community_status !== 'TELAVIVER') {
    return res.status(403).json({ error: 'Only TelAvivers can do this' })
  }
  next()
}

function requireActive(req, res, next) {
  if (!['TELAVIVER', 'TELAVIVLING'].includes(req.member.community_status)) {
    return res.status(403).json({ error: 'Account is not active' })
  }
  next()
}

function canSettle(record, member) {
  if (record.member_id === member.id) return true
  // SYSTEM_ADMIN or SYSTEM_OWNER may also settle/reconcile
  return ['SYSTEM_ADMIN', 'SYSTEM_OWNER'].includes(member.technical_role)
}

function toPublic(row) {
  return {
    id:         row.id,
    member_id:  row.member_id,
    amount:     row.amount,
    currency:   row.currency,
    note:       row.note,
    status:     row.status,
    settled_by: row.settled_by,
    settled_at: row.settled_at,
    created_at: row.created_at,
  }
}

// ── Contributions ────────────────────────────────────────────────────────────

// POST /api/contributions
router.post('/api/contributions', requireAuth, requireTelAviver, (req, res) => {
  const { amount, note } = req.body
  if (typeof amount !== 'number' || amount <= 0) {
    return res.status(400).json({ error: 'amount must be a positive number of rappen' })
  }

  const db = getDb()
  const result = db.prepare(`
    INSERT INTO contributions (member_id, amount, note)
    VALUES (?, ?, ?)
  `).run(req.member.id, amount, note || null)

  logEvent({
    eventType: 'CONTRIBUTION_CREATED',
    actorId: req.member.id,
    subjectType: 'contribution',
    subjectId: result.lastInsertRowid.toString(),
    payload: { amount, note, currency: 'CHF' },
  })

  const row = db.prepare('SELECT * FROM contributions WHERE id = ?').get(result.lastInsertRowid)
  res.status(201).json(toPublic(row))
})

// GET /api/contributions
router.get('/api/contributions', requireAuth, (req, res) => {
  if (req.member.community_status === 'TELAVIVLING') {
    return res.status(403).json({ error: 'Not authorized' })
  }
  const rows = getDb()
    .prepare('SELECT * FROM contributions ORDER BY created_at DESC')
    .all()
  res.json(rows.map(toPublic))
})

// PATCH /api/contributions/:id
router.patch('/api/contributions/:id', requireAuth, (req, res) => {
  const { status } = req.body
  if (status && !VALID_STATUS.includes(status)) {
    return res.status(400).json({ error: `status must be one of: ${VALID_STATUS.join(', ')}` })
  }

  const db = getDb()
  const row = db.prepare('SELECT * FROM contributions WHERE id = ?').get(req.params.id)
  if (!row) return res.status(404).json({ error: 'Not found' })
  if (!canSettle(row, req.member)) return res.status(403).json({ error: 'Not authorized' })

  db.prepare('UPDATE contributions SET status = ?, settled_by = ?, settled_at = ? WHERE id = ?')
    .run(status, req.member.id, status === 'SETTLED' ? Math.floor(Date.now() / 1000) : null, req.params.id)

  logEvent({
    eventType: 'CONTRIBUTION_UPDATED',
    actorId: req.member.id,
    subjectType: 'contribution',
    subjectId: req.params.id,
    payload: { status },
  })

  const updated = db.prepare('SELECT * FROM contributions WHERE id = ?').get(req.params.id)
  res.json(toPublic(updated))
})

// ── Donations ────────────────────────────────────────────────────────────────

// POST /api/donations
router.post('/api/donations', requireAuth, requireActive, (req, res) => {
  if (req.member.community_status === 'RETIRED_TELAVIVER' || req.member.community_status === 'RETIRED_TELAVIVLING') {
    return res.status(403).json({ error: 'Retired members cannot donate' })
  }

  const { amount, note } = req.body
  if (typeof amount !== 'number' || amount <= 0) {
    return res.status(400).json({ error: 'amount must be a positive number of rappen' })
  }

  const db = getDb()
  const result = db.prepare(`
    INSERT INTO donations (member_id, amount, note)
    VALUES (?, ?, ?)
  `).run(req.member.id, amount, note || null)

  logEvent({
    eventType: 'DONATION_CREATED',
    actorId: req.member.id,
    subjectType: 'donation',
    subjectId: result.lastInsertRowid.toString(),
    payload: { amount, note, currency: 'CHF' },
  })

  const row = db.prepare('SELECT * FROM donations WHERE id = ?').get(result.lastInsertRowid)
  res.status(201).json(toPublic(row))
})

// GET /api/donations
router.get('/api/donations', requireAuth, (req, res) => {
  const db = getDb()
  let rows
  if (req.member.community_status === 'TELAVIVER' || ['SYSTEM_ADMIN', 'SYSTEM_OWNER'].includes(req.member.technical_role)) {
    rows = db.prepare('SELECT * FROM donations ORDER BY created_at DESC').all()
  } else {
    rows = db.prepare('SELECT * FROM donations WHERE member_id = ? ORDER BY created_at DESC').all(req.member.id)
  }
  res.json(rows.map(toPublic))
})

// PATCH /api/donations/:id
router.patch('/api/donations/:id', requireAuth, (req, res) => {
  const { status } = req.body
  if (status && !VALID_STATUS.includes(status)) {
    return res.status(400).json({ error: `status must be one of: ${VALID_STATUS.join(', ')}` })
  }

  const db = getDb()
  const row = db.prepare('SELECT * FROM donations WHERE id = ?').get(req.params.id)
  if (!row) return res.status(404).json({ error: 'Not found' })
  if (!canSettle(row, req.member)) return res.status(403).json({ error: 'Not authorized' })

  db.prepare('UPDATE donations SET status = ?, settled_by = ?, settled_at = ? WHERE id = ?')
    .run(status, req.member.id, status === 'SETTLED' ? Math.floor(Date.now() / 1000) : null, req.params.id)

  logEvent({
    eventType: 'DONATION_UPDATED',
    actorId: req.member.id,
    subjectType: 'donation',
    subjectId: req.params.id,
    payload: { status },
  })

  const updated = db.prepare('SELECT * FROM donations WHERE id = ?').get(req.params.id)
  res.json(toPublic(updated))
})

// ── Balance ──────────────────────────────────────────────────────────────────

// GET /api/balance
router.get('/api/balance', requireAuth, (req, res) => {
  if (req.member.community_status === 'TELAVIVLING') {
    return res.status(403).json({ error: 'Not authorized' })
  }
  const db = getDb()
  const contributions = db.prepare("SELECT COALESCE(SUM(amount), 0) AS total FROM contributions WHERE status = 'SETTLED'").get().total
  const donations = db.prepare("SELECT COALESCE(SUM(amount), 0) AS total FROM donations WHERE status = 'SETTLED'").get().total
  res.json({
    currency: 'CHF',
    available: contributions + donations,
    contributions_pending: db.prepare("SELECT COALESCE(SUM(amount), 0) AS total FROM contributions WHERE status = 'PENDING'").get().total,
    donations_pending: db.prepare("SELECT COALESCE(SUM(amount), 0) AS total FROM donations WHERE status = 'PENDING'").get().total,
  })
})

export function registerInflowRoutes(app) {
  app.use(router)
}
