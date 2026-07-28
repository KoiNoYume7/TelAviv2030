// ── Requests routes ──
import { Router } from 'express'
import { getDb } from '../db/db.js'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { logEvent } from '../lib/audit.js'

const router = Router()

const COOLDOWN_SECONDS = 300        // 5 minutes
const COOLING_OFF_SECONDS = 24 * 60 * 60 // 24 hours
const DEFAULT_EXPIRY_SECONDS = 7 * 24 * 60 * 60 // 7 days

function requireTelAviver(req, res, next) {
  if (req.member.community_status !== 'TELAVIVER') {
    return res.status(403).json({ error: 'Only TelAvivers can do this' })
  }
  next()
}

function canEditRequest(request, member) {
  if (request.created_by === member.id) return true
  return ['SYSTEM_ADMIN', 'SYSTEM_OWNER'].includes(member.technical_role)
}

function getActiveTelAviverCount(db) {
  return db.prepare("SELECT COUNT(*) AS n FROM members WHERE community_status = 'TELAVIVER'").get().n
}

function getSettledInflows(db) {
  const c = db.prepare("SELECT COALESCE(SUM(amount), 0) AS total FROM contributions WHERE status = 'SETTLED'").get().total
  const d = db.prepare("SELECT COALESCE(SUM(amount), 0) AS total FROM donations WHERE status = 'SETTLED'").get().total
  return c + d
}

function getCommittedFunds(db) {
  return db.prepare("SELECT COALESCE(SUM(amount), 0) AS total FROM requests WHERE status IN ('APPROVED_COOLDOWN','LOCKED','RECIPIENT_SELECTION','RECIPIENT_ACCEPTANCE','PAYOUT_PENDING','PURCHASE_PENDING_PROOF')").get().total
}

function getAvailableBalance(db) {
  return getSettledInflows(db) - getCommittedFunds(db)
}

function countActiveRequestsByCreator(db, memberId) {
  return db.prepare("SELECT COUNT(*) AS n FROM requests WHERE created_by = ? AND status IN ('PENDING_VOTE', 'APPROVED_COOLDOWN', 'LOCKED')").get(memberId).n
}

function latestCreationByCreator(db, memberId) {
  return db.prepare("SELECT created_at FROM requests WHERE created_by = ? ORDER BY created_at DESC LIMIT 1").get(memberId)?.created_at ?? 0
}

function getCurrentRevision(db, requestId) {
  return db.prepare('SELECT * FROM request_revisions WHERE request_id = ? AND revision_number = (SELECT current_revision FROM requests WHERE id = ?)').get(requestId, requestId)
}

function getVoteSummary(db, requestId, revisionId) {
  const total = getActiveTelAviverCount(db)
  const rows = db.prepare('SELECT vote, COUNT(*) AS n FROM request_votes WHERE request_id = ? AND revision_id = ? GROUP BY vote').all(requestId, revisionId)
  const approve = rows.find(r => r.vote === 'APPROVE')?.n || 0
  const reject = rows.find(r => r.vote === 'REJECT')?.n || 0
  return { total, approve, reject, missing: total - approve - reject }
}

function ensureCreatorRecipient(db, requestId, creatorId) {
  const existing = db.prepare('SELECT * FROM request_recipients WHERE request_id = ? AND member_id = ?').get(requestId, creatorId)
  if (!existing) {
    db.prepare('INSERT INTO request_recipients (request_id, member_id, status) VALUES (?, ?, ?)')
      .run(requestId, creatorId, 'VOLUNTEERED')
  }
}

export function processRequest(db, requestId) {
  let req = db.prepare('SELECT * FROM requests WHERE id = ?').get(requestId)
  if (!req) return null

  let changed = true
  while (changed) {
    changed = false
    const now = Math.floor(Date.now() / 1000)

    if (req.status === 'PENDING_VOTE' && req.expiry_at && req.expiry_at < now) {
      db.prepare("UPDATE requests SET status = 'EXPIRED', updated_at = ? WHERE id = ?").run(now, requestId)
      logEvent({ eventType: 'REQUEST_EXPIRED', subjectType: 'request', subjectId: requestId.toString(), payload: {} })
      changed = true
    } else if (req.status === 'PENDING_VOTE') {
      const rev = getCurrentRevision(db, requestId)
      const summary = getVoteSummary(db, requestId, rev.id)
      if (summary.approve === summary.total && summary.total > 0) {
        const coolingUntil = now + COOLING_OFF_SECONDS
        db.prepare("UPDATE requests SET status = 'APPROVED_COOLDOWN', cooling_off_until = ?, updated_at = ? WHERE id = ?")
          .run(coolingUntil, now, requestId)
        logEvent({ eventType: 'REQUEST_APPROVED', subjectType: 'request', subjectId: requestId.toString(), payload: { cooling_off_until: coolingUntil } })
        changed = true
      }
    } else if (req.status === 'APPROVED_COOLDOWN' && req.cooling_off_until && req.cooling_off_until < now) {
      db.prepare("UPDATE requests SET status = 'LOCKED', locked_at = ?, updated_at = ? WHERE id = ?").run(now, now, requestId)
      logEvent({ eventType: 'REQUEST_LOCKED', subjectType: 'request', subjectId: requestId.toString(), payload: {} })
      changed = true
    } else if (req.status === 'LOCKED' && !req.selected_recipient_id) {
      ensureCreatorRecipient(db, req.id, req.created_by)
      db.prepare("UPDATE requests SET status = 'RECIPIENT_SELECTION', updated_at = ? WHERE id = ?").run(now, requestId)
      logEvent({ eventType: 'REQUEST_RECIPIENT_SELECTION', subjectType: 'request', subjectId: requestId.toString(), payload: {} })
      changed = true
    } else if (req.status === 'RECIPIENT_SELECTION') {
      const proposal = db.prepare("SELECT * FROM request_recipients WHERE request_id = ? AND status = 'PROPOSED' AND proposal_expires_at < ? AND objections = 0").get(requestId, now)
      if (proposal) {
        db.prepare("UPDATE request_recipients SET status = 'SELECTED' WHERE id = ?").run(proposal.id)
        db.prepare("UPDATE requests SET status = 'RECIPIENT_ACCEPTANCE', selected_recipient_id = ?, updated_at = ? WHERE id = ?")
          .run(proposal.member_id, now, requestId)
        logEvent({
          eventType: 'REQUEST_RECIPIENT_SELECTED',
          subjectType: 'request',
          subjectId: requestId.toString(),
          payload: { recipient_id: proposal.member_id },
        })
        changed = true
      }
    } else if (req.status === 'PAYOUT_PENDING' && req.payout_status === 'SETTLED') {
      db.prepare("UPDATE requests SET status = 'PURCHASE_PENDING_PROOF', updated_at = ? WHERE id = ?").run(now, requestId)
      logEvent({ eventType: 'REQUEST_PURCHASE_PENDING_PROOF', subjectType: 'request', subjectId: requestId.toString(), payload: {} })
      changed = true
    }

    if (changed) req = db.prepare('SELECT * FROM requests WHERE id = ?').get(requestId)
  }

  return req
}

function toPublicRequest(db, row) {
  const rev = getCurrentRevision(db, row.id)
  const summary = getVoteSummary(db, row.id, rev.id)
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    amount: row.amount,
    currency: row.currency,
    status: row.status,
    created_by: row.created_by,
    current_revision: row.current_revision,
    expiry_at: row.expiry_at,
    cooling_off_until: row.cooling_off_until,
    locked_at: row.locked_at,
    payout_status: row.payout_status,
    linked_plan_id: row.linked_plan_id,
    created_at: row.created_at,
    updated_at: row.updated_at,
    vote_summary: summary,
  }
}

function resetToPendingVote(db, requestId, reason) {
  const now = Math.floor(Date.now() / 1000)
  db.prepare(`UPDATE requests SET status = 'PENDING_VOTE', cooling_off_until = NULL, locked_at = NULL, updated_at = ? WHERE id = ?`).run(now, requestId)
  logEvent({ eventType: 'REQUEST_RESET_TO_VOTE', subjectType: 'request', subjectId: requestId.toString(), payload: { reason } })
}

// GET /api/requests
router.get('/api/requests', requireAuth, (req, res) => {
  const db = getDb()
  const rows = db.prepare('SELECT * FROM requests ORDER BY created_at DESC').all()
  const processed = rows.map(r => {
    const p = processRequest(db, r.id)
    return toPublicRequest(db, p || r)
  })
  res.json(processed)
})

// GET /api/requests/:id
router.get('/api/requests/:id', requireAuth, (req, res) => {
  const db = getDb()
  const row = db.prepare('SELECT * FROM requests WHERE id = ?').get(req.params.id)
  if (!row) return res.status(404).json({ error: 'Not found' })
  const processed = processRequest(db, row.id)
  res.json(toPublicRequest(db, processed || row))
})

// POST /api/requests
router.post('/api/requests', requireAuth, requireTelAviver, (req, res) => {
  const { title, description, amount, linked_plan_id } = req.body
  if (!title || typeof title !== 'string') return res.status(400).json({ error: 'title is required' })
  if (typeof amount !== 'number' || amount <= 0) return res.status(400).json({ error: 'amount must be a positive number of rappen' })

  const db = getDb()
  const now = Math.floor(Date.now() / 1000)

  if (countActiveRequestsByCreator(db, req.member.id) >= 1) {
    return res.status(429).json({ error: 'You already have an active Request' })
  }
  const lastCreated = latestCreationByCreator(db, req.member.id)
  if (now - lastCreated < COOLDOWN_SECONDS) {
    return res.status(429).json({ error: `Please wait ${COOLDOWN_SECONDS - (now - lastCreated)} seconds before creating another Request` })
  }
  if (getAvailableBalance(db) < amount) {
    return res.status(400).json({ error: 'Insufficient group funds for this Request' })
  }

  const expiry = now + DEFAULT_EXPIRY_SECONDS
  const result = db.prepare(`
    INSERT INTO requests (title, description, amount, created_by, expiry_at, linked_plan_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(title, description || null, amount, req.member.id, expiry, linked_plan_id || null)

  const requestId = result.lastInsertRowid

  db.prepare(`
    INSERT INTO request_revisions (request_id, revision_number, title, description, amount, created_by)
    VALUES (?, 1, ?, ?, ?, ?)
  `).run(requestId, title, description || null, amount, req.member.id)

  // Owner automatically approves the first revision
  const rev = getCurrentRevision(db, requestId)
  db.prepare(`
    INSERT INTO request_votes (request_id, revision_id, member_id, vote)
    VALUES (?, ?, ?, 'APPROVE')
  `).run(requestId, rev.id, req.member.id)

  logEvent({
    eventType: 'REQUEST_CREATED',
    actorId: req.member.id,
    subjectType: 'request',
    subjectId: requestId.toString(),
    payload: { title, amount, currency: 'CHF', expiry },
  })

  const row = db.prepare('SELECT * FROM requests WHERE id = ?').get(requestId)
  res.status(201).json(toPublicRequest(db, row))
})

// PATCH /api/requests/:id (material edit creates a new revision)
router.patch('/api/requests/:id', requireAuth, (req, res) => {
  const { title, description, amount, reason } = req.body
  const db = getDb()
  const request = db.prepare('SELECT * FROM requests WHERE id = ?').get(req.params.id)
  if (!request) return res.status(404).json({ error: 'Not found' })
  if (!canEditRequest(request, req.member)) return res.status(403).json({ error: 'Not authorized' })

  if (!['PENDING_VOTE', 'APPROVED_COOLDOWN'].includes(request.status)) {
    return res.status(400).json({ error: 'Cannot edit a locked or cancelled Request' })
  }

  const now = Math.floor(Date.now() / 1000)
  const newRevision = request.current_revision + 1
  const newAmount = typeof amount === 'number' ? amount : request.amount

  if (newAmount > getAvailableBalance(db) + (request.status === 'APPROVED_COOLDOWN' || request.status === 'LOCKED' ? request.amount : 0)) {
    return res.status(400).json({ error: 'Insufficient group funds for the new amount' })
  }

  db.prepare(`
    UPDATE requests
    SET title = ?, description = ?, amount = ?, current_revision = ?, status = 'PENDING_VOTE', cooling_off_until = NULL, locked_at = NULL, updated_at = ?
    WHERE id = ?
  `).run(
    title || request.title,
    description !== undefined ? description : request.description,
    newAmount,
    newRevision,
    now,
    request.id
  )

  db.prepare(`
    INSERT INTO request_revisions (request_id, revision_number, title, description, amount, reason, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(request.id, newRevision, title || request.title, description !== undefined ? description : request.description, newAmount, reason || null, req.member.id)

  const rev = getCurrentRevision(db, request.id)
  db.prepare(`
    INSERT INTO request_votes (request_id, revision_id, member_id, vote)
    VALUES (?, ?, ?, 'APPROVE')
  `).run(request.id, rev.id, request.created_by)

  logEvent({
    eventType: 'REQUEST_EDITED',
    actorId: req.member.id,
    subjectType: 'request',
    subjectId: request.id.toString(),
    payload: { revision: newRevision, title, amount: newAmount, reason },
  })

  const updated = processRequest(db, request.id)
  res.json(toPublicRequest(db, updated || db.prepare('SELECT * FROM requests WHERE id = ?').get(request.id)))
})

// DELETE /api/requests/:id (cancel)
router.delete('/api/requests/:id', requireAuth, (req, res) => {
  const db = getDb()
  const request = db.prepare('SELECT * FROM requests WHERE id = ?').get(req.params.id)
  if (!request) return res.status(404).json({ error: 'Not found' })
  if (!canEditRequest(request, req.member)) return res.status(403).json({ error: 'Not authorized' })

  if (!['PENDING_VOTE', 'APPROVED_COOLDOWN'].includes(request.status)) {
    return res.status(400).json({ error: 'Cannot cancel a locked or completed Request' })
  }

  db.prepare("UPDATE requests SET status = 'CANCELLED', updated_at = ? WHERE id = ?").run(Math.floor(Date.now() / 1000), request.id)
  logEvent({ eventType: 'REQUEST_CANCELLED', actorId: req.member.id, subjectType: 'request', subjectId: request.id.toString(), payload: {} })
  res.json({ ok: true })
})

// POST /api/requests/:id/votes
router.post('/api/requests/:id/votes', requireAuth, requireTelAviver, (req, res) => {
  const { vote } = req.body
  if (!['APPROVE', 'REJECT'].includes(vote)) return res.status(400).json({ error: 'vote must be APPROVE or REJECT' })

  const db = getDb()
  const request = db.prepare('SELECT * FROM requests WHERE id = ?').get(req.params.id)
  if (!request) return res.status(404).json({ error: 'Not found' })

  const processed = processRequest(db, request.id)
  const current = processed || request
  if (current.status !== 'PENDING_VOTE') return res.status(400).json({ error: 'Voting is closed' })

  const rev = getCurrentRevision(db, current.id)
  const now = Math.floor(Date.now() / 1000)

  const existing = db.prepare('SELECT * FROM request_votes WHERE request_id = ? AND revision_id = ? AND member_id = ?').get(current.id, rev.id, req.member.id)
  if (existing) {
    db.prepare('UPDATE request_votes SET vote = ?, updated_at = ? WHERE id = ?').run(vote, now, existing.id)
  } else {
    db.prepare('INSERT INTO request_votes (request_id, revision_id, member_id, vote) VALUES (?, ?, ?, ?)').run(current.id, rev.id, req.member.id, vote)
  }

  logEvent({
    eventType: 'REQUEST_VOTE_CAST',
    actorId: req.member.id,
    subjectType: 'request',
    subjectId: current.id.toString(),
    payload: { vote, revision: rev.revision_number },
  })

  const updated = processRequest(db, current.id)
  res.json(toPublicRequest(db, updated || db.prepare('SELECT * FROM requests WHERE id = ?').get(current.id)))
})

export function processAllRequests() {
  const db = getDb()
  const rows = db.prepare('SELECT id FROM requests WHERE status IN (?, ?)').all('PENDING_VOTE', 'APPROVED_COOLDOWN')
  for (const row of rows) {
    processRequest(db, row.id)
  }
}

export function registerRequestRoutes(app) {
  app.use(router)
}
