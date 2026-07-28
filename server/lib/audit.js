// ── Append-only audit log ──
import crypto from 'node:crypto'
import { getDb } from '../db/db.js'

const ENV = process.env.APP_ENV || 'PRODUCTION'

export function logEvent({ eventType, actorId, subjectType, subjectId, payload }) {
  const db = getDb()
  const previous = db.prepare('SELECT hash FROM audit_events ORDER BY id DESC LIMIT 1').get()
  const previousHash = previous?.hash || null

  const data = JSON.stringify({
    eventType,
    actorId,
    subjectType,
    subjectId,
    payload,
    environment: ENV,
    previousHash,
    ts: Date.now(),
  })

  const hash = crypto.createHash('sha256').update(data).digest('hex')
  const payloadJson = payload ? JSON.stringify(payload) : null

  db.prepare(`
    INSERT INTO audit_events
      (event_type, actor_id, subject_type, subject_id, payload, hash, previous_hash, environment)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(eventType, actorId, subjectType, subjectId, payloadJson, hash, previousHash, ENV)

  return hash
}
