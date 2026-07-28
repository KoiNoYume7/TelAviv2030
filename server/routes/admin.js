// ── Admin / diagnostics / audit routes ──
import { Router } from 'express'
import { getDb } from '../db/db.js'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { logEvent } from '../lib/audit.js'

const router = Router()

function isAdmin(member) {
  return ['SYSTEM_ADMIN', 'SYSTEM_OWNER'].includes(member.technical_role)
}

// GET /api/admin/settings
router.get('/api/admin/settings', requireAuth, (req, res) => {
  if (!isAdmin(req.member)) return res.status(403).json({ error: 'Not authorized' })
  const rows = getDb().prepare('SELECT * FROM system_settings ORDER BY key').all()
  res.json(rows)
})

// PATCH /api/admin/settings/:key
router.patch('/api/admin/settings/:key', requireAuth, (req, res) => {
  if (!isAdmin(req.member)) return res.status(403).json({ error: 'Not authorized' })
  const allowed = ['FREEZE_REQUESTS', 'FREEZE_PAYOUTS', 'FREEZE_INFLOWS', 'APP_ENV']
  if (!allowed.includes(req.params.key)) return res.status(400).json({ error: 'Unknown setting' })

  const db = getDb()
  const now = Math.floor(Date.now() / 1000)
  db.prepare('INSERT INTO system_settings (key, value, updated_by, updated_at) VALUES (?, ?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_by = excluded.updated_by, updated_at = excluded.updated_at')
    .run(req.params.key, req.body.value, req.member.id, now)

  logEvent({
    eventType: 'SYSTEM_SETTING_CHANGED',
    actorId: req.member.id,
    subjectType: 'system_setting',
    subjectId: req.params.key,
    payload: { value: req.body.value },
  })

  res.json({ ok: true })
})

// POST /api/admin/freeze/:type
router.post('/api/admin/freeze/:type', requireAuth, requireRole('SYSTEM_OWNER'), (req, res) => {
  const key = `FREEZE_${req.params.type.toUpperCase()}`
  if (!['FREEZE_REQUESTS', 'FREEZE_PAYOUTS', 'FREEZE_INFLOWS'].includes(key)) {
    return res.status(400).json({ error: 'Unknown freeze type' })
  }
  const db = getDb()
  const now = Math.floor(Date.now() / 1000)
  db.prepare('INSERT INTO system_settings (key, value, updated_by, updated_at) VALUES (?, ?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_by = excluded.updated_by, updated_at = excluded.updated_at')
    .run(key, 'true', req.member.id, now)
  logEvent({ eventType: 'FREEZE_ENABLED', actorId: req.member.id, subjectType: 'system_setting', subjectId: key, payload: {} })
  res.json({ ok: true })
})

// POST /api/admin/unfreeze/:type
router.post('/api/admin/unfreeze/:type', requireAuth, requireRole('SYSTEM_OWNER'), (req, res) => {
  const key = `FREEZE_${req.params.type.toUpperCase()}`
  if (!['FREEZE_REQUESTS', 'FREEZE_PAYOUTS', 'FREEZE_INFLOWS'].includes(key)) {
    return res.status(400).json({ error: 'Unknown freeze type' })
  }
  const db = getDb()
  const now = Math.floor(Date.now() / 1000)
  db.prepare('INSERT INTO system_settings (key, value, updated_by, updated_at) VALUES (?, ?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_by = excluded.updated_by, updated_at = excluded.updated_at')
    .run(key, 'false', req.member.id, now)
  logEvent({ eventType: 'FREEZE_DISABLED', actorId: req.member.id, subjectType: 'system_setting', subjectId: key, payload: {} })
  res.json({ ok: true })
})

// GET /api/audit
router.get('/api/audit', requireAuth, (req, res) => {
  if (!isAdmin(req.member)) return res.status(403).json({ error: 'Not authorized' })
  const limit = Math.min(parseInt(req.query.limit) || 50, 200)
  const offset = parseInt(req.query.offset) || 0
  const db = getDb()
  const rows = db.prepare('SELECT * FROM audit_events ORDER BY id DESC LIMIT ? OFFSET ?').all(limit, offset)
  res.json(rows)
})

// GET /api/admin/diagnostics
router.get('/api/admin/diagnostics', requireAuth, (req, res) => {
  if (!isAdmin(req.member)) return res.status(403).json({ error: 'Not authorized' })
  const db = getDb()
  const result = db.prepare(`
    SELECT
      (SELECT COUNT(*) FROM members) AS member_count,
      (SELECT COUNT(*) FROM members WHERE community_status = 'TELAVIVER') AS telaviver_count,
      (SELECT COUNT(*) FROM members WHERE community_status = 'TELAVIVLING') AS telavivling_count,
      (SELECT COALESCE(SUM(amount),0) FROM contributions WHERE status = 'SETTLED') AS settled_contributions,
      (SELECT COALESCE(SUM(amount),0) FROM donations WHERE status = 'SETTLED') AS settled_donations,
      (SELECT COUNT(*) FROM requests) AS request_count,
      (SELECT COUNT(*) FROM requests WHERE status IN ('PENDING_VOTE')) AS pending_requests,
      (SELECT COUNT(*) FROM requests WHERE status = 'COMPLETED') AS completed_requests,
      (SELECT COUNT(*) FROM audit_events) AS audit_event_count
  `).get()
  const settings = db.prepare('SELECT * FROM system_settings ORDER BY key').all()
  res.json({ ...result, settings })
})

export function registerAdminRoutes(app) {
  app.use(router)
}
