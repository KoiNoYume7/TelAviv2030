// ── Payout, proof, and completion routes ──
import { Router } from 'express'
import multer from 'multer'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { getDb } from '../db/db.js'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { logEvent } from '../lib/audit.js'
import { processRequest } from './requests.js'
import { isFrozen } from '../lib/freeze.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const router = Router()
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads', 'requests')

fs.mkdirSync(UPLOAD_DIR, { recursive: true })

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(UPLOAD_DIR, req.params.id)
    fs.mkdirSync(dir, { recursive: true })
    cb(null, dir)
  },
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`
    cb(null, unique)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
    cb(null, allowed.includes(file.mimetype))
  },
})

function canManagePayout(request, member) {
  if (request.selected_recipient_id === member.id) return true
  return ['SYSTEM_ADMIN', 'SYSTEM_OWNER'].includes(member.technical_role)
}

// POST /api/requests/:id/payout/submit
router.post('/api/requests/:id/payout/submit', requireAuth, (req, res) => {
  if (isFrozen('FREEZE_PAYOUTS')) return res.status(503).json({ error: 'Payouts are temporarily frozen' })
  const db = getDb()
  const request = processRequest(db, req.params.id)
  if (!request) return res.status(404).json({ error: 'Not found' })
  if (request.status !== 'PAYOUT_PENDING') return res.status(400).json({ error: 'Request is not awaiting payout' })
  if (!canManagePayout(request, req.member)) return res.status(403).json({ error: 'Not authorized' })

  const { reference } = req.body
  const now = Math.floor(Date.now() / 1000)
  db.prepare("UPDATE requests SET payout_status = 'SUBMITTED', payout_reference = ?, payout_submitted_at = ?, updated_at = ? WHERE id = ?")
    .run(reference || null, now, now, request.id)

  logEvent({ eventType: 'PAYOUT_SUBMITTED', actorId: req.member.id, subjectType: 'request', subjectId: request.id.toString(), payload: { reference } })
  res.json({ ok: true })
})

// PATCH /api/requests/:id/payout/status
router.patch('/api/requests/:id/payout/status', requireAuth, requireRole('SYSTEM_ADMIN'), (req, res) => {
  const { status, reason } = req.body
  const valid = ['SUBMITTED', 'PENDING', 'SETTLED', 'FAILED', 'CANCELLED', 'REQUIRES_REVIEW']
  if (!valid.includes(status)) return res.status(400).json({ error: `status must be one of: ${valid.join(', ')}` })

  const db = getDb()
  const request = processRequest(db, req.params.id)
  if (!request) return res.status(404).json({ error: 'Not found' })

  const now = Math.floor(Date.now() / 1000)
  const settledAt = status === 'SETTLED' ? now : request.payout_settled_at
  db.prepare(`
    UPDATE requests
    SET payout_status = ?, payout_failed_reason = ?, payout_settled_at = ?, updated_at = ?
    WHERE id = ?
  `).run(status, reason || null, settledAt, now, request.id)

  logEvent({
    eventType: 'PAYOUT_STATUS_UPDATED',
    actorId: req.member.id,
    subjectType: 'request',
    subjectId: request.id.toString(),
    payload: { status, reason },
  })

  const updated = processRequest(db, request.id)
  res.json({ ok: true, status: updated.payout_status, request_status: updated.status })
})

// POST /api/requests/:id/proofs
router.post('/api/requests/:id/proofs', requireAuth, upload.single('file'), (req, res) => {
  const db = getDb()
  const request = processRequest(db, req.params.id)
  if (!request) return res.status(404).json({ error: 'Not found' })
  if (!['PAYOUT_PENDING', 'PURCHASE_PENDING_PROOF'].includes(request.status)) return res.status(400).json({ error: 'Cannot upload proof at this stage' })

  const file = req.file
  if (!file) return res.status(400).json({ error: 'Invalid or missing file' })

  const now = Math.floor(Date.now() / 1000)
  db.prepare('INSERT INTO request_proofs (request_id, member_id, filename, mime_type, note) VALUES (?, ?, ?, ?, ?)')
    .run(request.id, req.member.id, file.filename, file.mimetype, req.body.note || null)

  if (request.status === 'PAYOUT_PENDING') {
    db.prepare("UPDATE requests SET status = 'PURCHASE_PENDING_PROOF', updated_at = ? WHERE id = ?").run(now, request.id)
  }

  logEvent({
    eventType: 'PROOF_UPLOADED',
    actorId: req.member.id,
    subjectType: 'request',
    subjectId: request.id.toString(),
    payload: { filename: file.filename, mime_type: file.mimetype },
  })

  res.json({ ok: true, filename: file.filename })
})

// GET /api/requests/:id/proofs
router.get('/api/requests/:id/proofs', requireAuth, (req, res) => {
  const db = getDb()
  const rows = db.prepare('SELECT id, request_id, member_id, filename, mime_type, note, created_at FROM request_proofs WHERE request_id = ?').all(req.params.id)
  res.json(rows)
})

// POST /api/requests/:id/complete
router.post('/api/requests/:id/complete', requireAuth, (req, res) => {
  const db = getDb()
  const request = processRequest(db, req.params.id)
  if (!request) return res.status(404).json({ error: 'Not found' })
  if (request.status !== 'PURCHASE_PENDING_PROOF') return res.status(400).json({ error: 'Request is not awaiting completion' })
  if (!canManagePayout(request, req.member)) return res.status(403).json({ error: 'Not authorized' })

  const now = Math.floor(Date.now() / 1000)
  db.prepare("UPDATE requests SET status = 'COMPLETED', updated_at = ? WHERE id = ?").run(now, request.id)

  logEvent({ eventType: 'REQUEST_COMPLETED', actorId: req.member.id, subjectType: 'request', subjectId: request.id.toString(), payload: {} })
  res.json({ ok: true })
})

export function registerPayoutRoutes(app) {
  app.use(router)
}
