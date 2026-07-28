// ── Emergency freeze helpers ──
import { getDb } from '../db/db.js'

export function isFrozen(key) {
  const row = getDb().prepare('SELECT value FROM system_settings WHERE key = ?').get(key)
  return row?.value === 'true'
}

export function requireUnfrozen(key) {
  return (req, res, next) => {
    if (isFrozen(key)) return res.status(503).json({ error: `Financial operation temporarily frozen: ${key}` })
    next()
  }
}
