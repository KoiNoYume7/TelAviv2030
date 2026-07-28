// ── Auth via AnniCore ──
import { getDb } from '../db/db.js'
import { logEvent } from '../lib/audit.js'

const DEV_MODE     = process.env.NODE_ENV === 'development' || process.env.DEV_MODE === 'true'
const ANNI_CORE_URL = process.env.ANNI_CORE_URL || 'http://127.0.0.1:4200'

export async function ensureUser(req) {
  if (DEV_MODE && req.headers['x-dev-user']) {
    try {
      const user = JSON.parse(req.headers['x-dev-user'])
      return resolveOrCreateMember(user)
    } catch {
      return null
    }
  }

  const cookie = req.headers.cookie
  if (!cookie) return null

  try {
    const res = await fetch(`${ANNI_CORE_URL}/api/auth/me`, {
      headers: { cookie },
    })
    if (!res.ok) return null
    const data = await res.json()
    if (!data.ok) return null
    return resolveOrCreateMember(data.user)
  } catch (err) {
    console.error('[auth] AnniCore check failed:', err)
    return null
  }
}

export async function requireAuth(req, res, next) {
  const member = await ensureUser(req)
  if (!member) return res.status(401).json({ error: 'Not authenticated' })
  req.member = member
  next()
}

const ROLE_PRIORITY = {
  MEMBER:       0,
  SYSTEM_ADMIN: 1,
  SYSTEM_OWNER: 2,
}

export function requireRole(...roles) {
  const minPriority = Math.max(...roles.map(r => ROLE_PRIORITY[r] ?? 0))
  return (req, res, next) => {
    if (!req.member) return res.status(401).json({ error: 'Not authenticated' })
    if ((ROLE_PRIORITY[req.member.technical_role] ?? 0) < minPriority) {
      return res.status(403).json({ error: 'Not authorized' })
    }
    next()
  }
}

function resolveOrCreateMember(user) {
  const db = getDb()
  const existing = db.prepare('SELECT * FROM members WHERE id = ?').get(user.id)
  if (existing) return existing

  const [provider, providerId] = splitProviderId(user.id)
  db.prepare(`
    INSERT INTO members (id, provider, provider_id, email, name, avatar, community_status, technical_role)
    VALUES (?, ?, ?, ?, ?, ?, 'TELAVIVLING', 'MEMBER')
  `).run(user.id, provider, providerId, user.email || null, user.name || 'Unknown', user.avatar || null)

  const member = db.prepare('SELECT * FROM members WHERE id = ?').get(user.id)
  logEvent({
    eventType: 'MEMBER_CREATED',
    actorId: member.id,
    subjectType: 'member',
    subjectId: member.id,
    payload: { provider, email: member.email, name: member.name },
  })
  return member
}

function splitProviderId(id) {
  const idx = id.indexOf(':')
  if (idx === -1) return ['unknown', id]
  return [id.slice(0, idx), id.slice(idx + 1)]
}
