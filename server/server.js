// ── TelAviv2030 backend ──
import dotenv from 'dotenv/config'
import express from 'express'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { getDb } from './db/db.js'
import { registerMemberRoutes } from './routes/members.js'
import { registerInflowRoutes } from './routes/inflows.js'
import { registerPlanRoutes } from './routes/plans.js'
import { registerRequestRoutes, processAllRequests } from './routes/requests.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname  = path.dirname(__filename)

const DEV_MODE = process.env.NODE_ENV === 'development' || process.env.DEV_MODE === 'true'
const PORT     = process.env.PORT || 4300

const app = express()

// ── Middleware ──
app.set('trust proxy', 1)
app.use(express.json())

// ── CORS (hand-rolled allowlist) ──
const ALLOWED_ORIGINS = new Set([
  'https://telaviv.yumehana.dev',
  ...(DEV_MODE ? ['http://localhost:5173', 'http://localhost:4300'] : [])
])

app.use((req, res, next) => {
  const origin = req.headers.origin
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin)
    res.setHeader('Access-Control-Allow-Credentials', 'true')
    res.setHeader('Vary', 'Origin')
  }
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    return res.status(204).end()
  }
  next()
})

// ── Health ──
app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'telaviv2030', env: process.env.APP_ENV || 'PRODUCTION', ts: Date.now() })
})

// ── Routes ──
registerMemberRoutes(app)
registerInflowRoutes(app)
registerPlanRoutes(app)
registerRequestRoutes(app)

// ── Static SPA fallback ──
app.use(express.static(path.join(__dirname, 'public')))
app.get(/^(?!\/api\/).*$/, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'))
})

// ── 404 ──
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' })
})

// ── Errors ──
app.use((err, req, res, next) => {
  console.error('[server] error:', err)
  res.status(500).json({ error: 'Internal server error' })
})

// ── Database ──
getDb()

// ── Periodic state transitions ──
processAllRequests()
setInterval(processAllRequests, 60_000)

// ── Listen ──
app.listen(PORT, '127.0.0.1', () => {
  console.log(`[telaviv] listening on 127.0.0.1:${PORT}`)
})
