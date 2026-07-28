// ── Plans routes ──
import { Router } from 'express'
import { getDb } from '../db/db.js'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { logEvent } from '../lib/audit.js'

const router = Router()

const VALID_STATUS = ['ACTIVE', 'COMPLETED', 'CANCELLED']

function requireTelAviver(req, res, next) {
  if (req.member.community_status !== 'TELAVIVER') {
    return res.status(403).json({ error: 'Only TelAvivers can do this' })
  }
  next()
}

function canEdit(plan, member) {
  if (plan.created_by === member.id) return true
  return ['SYSTEM_ADMIN', 'SYSTEM_OWNER'].includes(member.technical_role)
}

function toPublic(row) {
  return {
    id:             row.id,
    name:           row.name,
    description:    row.description,
    target_amount:  row.target_amount,
    current_amount: row.current_amount,
    target_date:    row.target_date,
    status:         row.status,
    created_by:     row.created_by,
    created_at:     row.created_at,
    updated_at:     row.updated_at,
  }
}

// GET /api/plans
router.get('/api/plans', requireAuth, (req, res) => {
  const rows = getDb()
    .prepare('SELECT * FROM plans WHERE status != ? ORDER BY created_at DESC')
    .all('CANCELLED')
  res.json(rows.map(toPublic))
})

// GET /api/plans/:id
router.get('/api/plans/:id', requireAuth, (req, res) => {
  const row = getDb().prepare('SELECT * FROM plans WHERE id = ?').get(req.params.id)
  if (!row) return res.status(404).json({ error: 'Not found' })
  res.json(toPublic(row))
})

// POST /api/plans
router.post('/api/plans', requireAuth, requireTelAviver, (req, res) => {
  const { name, description, target_amount, target_date, current_amount } = req.body
  if (!name || typeof name !== 'string') {
    return res.status(400).json({ error: 'name is required' })
  }

  const db = getDb()
  const result = db.prepare(`
    INSERT INTO plans (name, description, target_amount, target_date, current_amount, created_by)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    name,
    description || null,
    typeof target_amount === 'number' ? target_amount : null,
    target_date ? Math.floor(new Date(target_date).getTime() / 1000) : null,
    typeof current_amount === 'number' ? current_amount : 0,
    req.member.id
  )

  logEvent({
    eventType: 'PLAN_CREATED',
    actorId: req.member.id,
    subjectType: 'plan',
    subjectId: result.lastInsertRowid.toString(),
    payload: { name, target_amount, target_date, current_amount },
  })

  const row = db.prepare('SELECT * FROM plans WHERE id = ?').get(result.lastInsertRowid)
  res.status(201).json(toPublic(row))
})

// PATCH /api/plans/:id
router.patch('/api/plans/:id', requireAuth, requireTelAviver, (req, res) => {
  const { name, description, target_amount, target_date, current_amount, status } = req.body
  const db = getDb()
  const existing = db.prepare('SELECT * FROM plans WHERE id = ?').get(req.params.id)
  if (!existing) return res.status(404).json({ error: 'Not found' })
  if (!canEdit(existing, req.member)) return res.status(403).json({ error: 'Not authorized' })

  if (status && !VALID_STATUS.includes(status)) {
    return res.status(400).json({ error: `status must be one of: ${VALID_STATUS.join(', ')}` })
  }

  db.prepare(`
    UPDATE plans
    SET name           = COALESCE(?, name),
        description    = COALESCE(?, description),
        target_amount  = COALESCE(?, target_amount),
        target_date    = COALESCE(?, target_date),
        current_amount = COALESCE(?, current_amount),
        status         = COALESCE(?, status),
        updated_at     = unixepoch()
    WHERE id = ?
  `).run(
    name || null,
    description === undefined ? undefined : description,
    typeof target_amount === 'number' ? target_amount : undefined,
    target_date ? Math.floor(new Date(target_date).getTime() / 1000) : undefined,
    typeof current_amount === 'number' ? current_amount : undefined,
    status || null,
    req.params.id
  )

  logEvent({
    eventType: 'PLAN_UPDATED',
    actorId: req.member.id,
    subjectType: 'plan',
    subjectId: req.params.id,
    payload: { name, target_amount, target_date, current_amount, status },
  })

  const row = db.prepare('SELECT * FROM plans WHERE id = ?').get(req.params.id)
  res.json(toPublic(row))
})

export function registerPlanRoutes(app) {
  app.use(router)
}
