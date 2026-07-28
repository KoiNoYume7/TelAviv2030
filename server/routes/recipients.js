// ── Request recipient routes ──
import { Router } from 'express'
import { getDb } from '../db/db.js'
import { requireAuth } from '../middleware/auth.js'
import { logEvent } from '../lib/audit.js'
import { processRequest } from './requests.js'

const router = Router()

const PROPOSAL_WINDOW_SECONDS = 30 * 60 // 30 minutes

function requireTelAviver(req, res, next) {
  if (req.member.community_status !== 'TELAVIVER') {
    return res.status(403).json({ error: 'Only TelAvivers can do this' })
  }
  next()
}

function getCurrentRevision(db, requestId) {
  return db.prepare('SELECT * FROM request_revisions WHERE request_id = ? AND revision_number = (SELECT current_revision FROM requests WHERE id = ?)').get(requestId, requestId)
}

function hasApprovedRequest(db, requestId, memberId) {
  const rev = getCurrentRevision(db, requestId)
  const vote = db.prepare('SELECT vote FROM request_votes WHERE request_id = ? AND revision_id = ? AND member_id = ?').get(requestId, rev.id, memberId)
  return vote?.vote === 'APPROVE'
}

function isActiveRecipient(db, requestId, memberId) {
  const r = db.prepare('SELECT status FROM request_recipients WHERE request_id = ? AND member_id = ?').get(requestId, memberId)
  return r && ['VOLUNTEERED', 'PROPOSED', 'SELECTED'].includes(r.status)
}

function toPublicRecipient(row, member) {
  return {
    id: row.id,
    member_id: row.member_id,
    status: row.status,
    proposed_by: row.proposed_by,
    proposal_expires_at: row.proposal_expires_at,
    objections: row.objections,
    name: member?.name,
    avatar: member?.avatar,
  }
}

// GET /api/requests/:id/recipients
router.get('/api/requests/:id/recipients', requireAuth, (req, res) => {
  const db = getDb()
  const request = processRequest(db, req.params.id)
  if (!request) return res.status(404).json({ error: 'Not found' })

  const rows = db.prepare('SELECT r.*, m.name, m.avatar FROM request_recipients r LEFT JOIN members m ON r.member_id = m.id WHERE r.request_id = ?').all(req.params.id)
  res.json(rows.map(r => toPublicRecipient(r, { name: r.name, avatar: r.avatar })))
})

// POST /api/requests/:id/recipients (volunteer)
router.post('/api/requests/:id/recipients', requireAuth, requireTelAviver, (req, res) => {
  const db = getDb()
  const request = processRequest(db, req.params.id)
  if (!request) return res.status(404).json({ error: 'Not found' })
  if (request.status !== 'RECIPIENT_SELECTION') return res.status(400).json({ error: 'Not in recipient selection' })
  if (!hasApprovedRequest(db, request.id, req.member.id) && request.created_by !== req.member.id) {
    return res.status(403).json({ error: 'You must have approved the Request to volunteer' })
  }

  try {
    db.prepare('INSERT INTO request_recipients (request_id, member_id, status) VALUES (?, ?, ?)').run(request.id, req.member.id, 'VOLUNTEERED')
    logEvent({ eventType: 'RECIPIENT_VOLUNTEERED', actorId: req.member.id, subjectType: 'request', subjectId: request.id.toString(), payload: { member_id: req.member.id } })
  } catch (err) {
    if (err.message.includes('UNIQUE constraint failed')) {
      return res.status(409).json({ error: 'Already volunteered' })
    }
    throw err
  }

  res.json({ ok: true })
})

// POST /api/requests/:id/recipients/:memberId/propose
router.post('/api/requests/:id/recipients/:memberId/propose', requireAuth, requireTelAviver, (req, res) => {
  const db = getDb()
  const request = processRequest(db, req.params.id)
  if (!request) return res.status(404).json({ error: 'Not found' })
  if (request.status !== 'RECIPIENT_SELECTION') return res.status(400).json({ error: 'Not in recipient selection' })

  const proposerId = req.member.id
  const targetId = req.params.memberId

  if (!hasApprovedRequest(db, request.id, proposerId) && request.created_by !== proposerId) {
    return res.status(403).json({ error: 'You must have approved the Request to propose a recipient' })
  }
  if (!isActiveRecipient(db, request.id, targetId)) {
    return res.status(400).json({ error: 'Proposed member is not an eligible volunteer' })
  }

  const existingProposed = db.prepare("SELECT * FROM request_recipients WHERE request_id = ? AND status = 'PROPOSED'").get(request.id)
  if (existingProposed) return res.status(409).json({ error: 'Another recipient is currently proposed; wait for objection/expiration or object it' })

  const target = db.prepare('SELECT * FROM request_recipients WHERE request_id = ? AND member_id = ?').get(request.id, targetId)
  const now = Math.floor(Date.now() / 1000)
  const expires = now + PROPOSAL_WINDOW_SECONDS

  db.prepare('UPDATE request_recipients SET status = ?, proposed_by = ?, proposal_expires_at = ?, objections = 0 WHERE id = ?')
    .run('PROPOSED', proposerId, expires, target.id)

  logEvent({
    eventType: 'RECIPIENT_PROPOSED',
    actorId: proposerId,
    subjectType: 'request_recipient',
    subjectId: target.id.toString(),
    payload: { request_id: request.id, member_id: targetId, proposal_expires_at: expires },
  })

  res.json({ ok: true, proposal_expires_at: expires })
})

// POST /api/requests/:id/recipients/:memberId/object
router.post('/api/requests/:id/recipients/:memberId/object', requireAuth, requireTelAviver, (req, res) => {
  const db = getDb()
  const request = processRequest(db, req.params.id)
  if (!request) return res.status(404).json({ error: 'Not found' })

  const targetId = req.params.memberId
  const target = db.prepare('SELECT * FROM request_recipients WHERE request_id = ? AND member_id = ?').get(request.id, targetId)
  if (!target || target.status !== 'PROPOSED') return res.status(400).json({ error: 'No active proposal for this member' })

  try {
    db.prepare('INSERT INTO request_recipient_objections (request_recipient_id, member_id) VALUES (?, ?)').run(target.id, req.member.id)
  } catch (err) {
    if (err.message.includes('UNIQUE constraint failed')) {
      return res.status(409).json({ error: 'Already objected' })
    }
    throw err
  }

  db.prepare('UPDATE request_recipients SET status = ?, objections = objections + 1 WHERE id = ?').run('VOLUNTEERED', target.id)

  logEvent({
    eventType: 'RECIPIENT_OBJECTED',
    actorId: req.member.id,
    subjectType: 'request_recipient',
    subjectId: target.id.toString(),
    payload: { request_id: request.id, member_id: targetId },
  })

  res.json({ ok: true })
})

// POST /api/requests/:id/recipient/accept
router.post('/api/requests/:id/recipient/accept', requireAuth, requireTelAviver, (req, res) => {
  const db = getDb()
  const request = processRequest(db, req.params.id)
  if (!request) return res.status(404).json({ error: 'Not found' })
  if (request.status !== 'RECIPIENT_ACCEPTANCE') return res.status(400).json({ error: 'No recipient awaiting acceptance' })
  if (request.selected_recipient_id !== req.member.id) return res.status(403).json({ error: 'You are not the selected recipient' })

  const now = Math.floor(Date.now() / 1000)
  const target = db.prepare('SELECT * FROM request_recipients WHERE request_id = ? AND member_id = ?').get(request.id, req.member.id)
  db.prepare("UPDATE request_recipients SET status = 'ACCEPTED', accepted_at = ? WHERE id = ?").run(now, target.id)
  db.prepare("UPDATE requests SET status = 'PAYOUT_PENDING', updated_at = ? WHERE id = ?").run(now, request.id)

  logEvent({ eventType: 'RECIPIENT_ACCEPTED', actorId: req.member.id, subjectType: 'request', subjectId: request.id.toString(), payload: { recipient_id: req.member.id } })

  res.json({ ok: true })
})

// POST /api/requests/:id/recipient/decline
router.post('/api/requests/:id/recipient/decline', requireAuth, requireTelAviver, (req, res) => {
  const db = getDb()
  const request = processRequest(db, req.params.id)
  if (!request) return res.status(404).json({ error: 'Not found' })
  if (request.status !== 'RECIPIENT_ACCEPTANCE') return res.status(400).json({ error: 'No recipient awaiting acceptance' })
  if (request.selected_recipient_id !== req.member.id) return res.status(403).json({ error: 'You are not the selected recipient' })

  const now = Math.floor(Date.now() / 1000)
  const target = db.prepare('SELECT * FROM request_recipients WHERE request_id = ? AND member_id = ?').get(request.id, req.member.id)
  db.prepare("UPDATE request_recipients SET status = 'DECLINED', declined_at = ? WHERE id = ?").run(now, target.id)
  db.prepare("UPDATE requests SET status = 'RECIPIENT_SELECTION', selected_recipient_id = NULL, updated_at = ? WHERE id = ?").run(now, request.id)

  logEvent({ eventType: 'RECIPIENT_DECLINED', actorId: req.member.id, subjectType: 'request', subjectId: request.id.toString(), payload: { recipient_id: req.member.id } })

  res.json({ ok: true })
})

export function registerRecipientRoutes(app) {
  app.use(router)
}
