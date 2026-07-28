// ── App version / update endpoint ──
import { Router } from 'express'

const router = Router()

// GET /api/version
router.get('/api/version', (req, res) => {
  res.json({
    version: process.env.APP_VERSION || '0.1.0',
    apk_url: process.env.APK_URL || null,
    required: false,
  })
})

export function registerVersionRoutes(app) {
  app.use(router)
}
