// ── Members routes ──
import { Router } from 'express'
import { getDb } from '../db/db.js'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { logEvent } from '../lib/audit.js'

const router = Router()

const VALID_STATUS = ['TELAVIVER', 'TELAVIVLING', 'RETIRED_TELAVIVER', 'RETIRED_TELAVIVLING']
const VALID_ROLES  = ['MEMBER', 'SYSTEM_ADMIN', 'SYSTEM_OWNER']

// GET /api/me
router.get('/api/me', requireAuth, (req, res) => {
  res.json({
    id:               req.member.id,
    name:             req.member.name,
    avatar:           req.member.avatar,
    community_status: req.member.community_status,
    technical_role:   req.member.technical_role,
  })
})

function toPublicMember(row) {
  return {
    id:               row.id,
    name:             row.name,
    avatar:           row.avatar,
    community_status: row.community_status,
    technical_role:   row.technical_role,
    created_at:       row.created_at,
  }
}

// GET /api/members
router.get('/api/members', requireAuth, (req, res) => {
  const members = getDb()
    .prepare('SELECT id, name, avatar, community_status, technical_role, created_at FROM members ORDER BY name')
    .all()
  res.json(members.map(toPublicMember))
})

// GET /api/members/:id
router.get('/api/members/:id', requireAuth, (req, res) => {
  const member = getDb()
    .prepare('SELECT id, name, avatar, community_status, technical_role, created_at FROM members WHERE id = ?')
    .get(req.params.id)
  if (!member) return res.status(404).json({ error: 'Not found' })
  res.json(toPublicMember(member))
})

// PATCH /api/members/:id — admin/owner updates status or technical role
router.patch('/api/members/:id', requireAuth, requireRole('SYSTEM_ADMIN'), (req, res) => {
  const { community_status, technical_role } = req.body
  const db = getDb()
  const existing = db.prepare('SELECT * FROM members WHERE id = ?').get(req.params.id)
  if (!existing) return res.status(404).json({ error: 'Not found' })

  if (community_status && !VALID_STATUS.includes(community_status)) {
    return res.status(400).json({ error: `community_status must be one of: ${VALID_STATUS.join(', ')}` })
  }
  if (technical_role && !VALID_ROLES.includes(technical_role)) {
    return res.status(400).json({ error: `technical_role must be one of: ${VALID_ROLES.join(', ')}` })
  }

  db.prepare(`
    UPDATE members
    SET community_status = COALESCE(?, community_status),
        technical_role   = COALESCE(?, technical_role),
        updated_at       = unixepoch()
    WHERE id = ?
  `).run(community_status || null, technical_role || null, req.params.id)

  logEvent({
    eventType: 'MEMBER_UPDATED',
    actorId: req.member.id,
    subjectType: 'member',
    subjectId: req.params.id,
    payload: { community_status, technical_role },
  })

  const updated = db.prepare('SELECT * FROM members WHERE id = ?').get(req.params.id)
  res.json(toPublicMember(updated))
})

export function registerMemberRoutes(app) {
  app.use(router)
}
