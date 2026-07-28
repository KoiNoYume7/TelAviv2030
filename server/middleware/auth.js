// ── Auth via AnniCore ──
const DEV_MODE = process.env.NODE_ENV === 'development' || process.env.DEV_MODE === 'true'
const ANNI_CORE_URL = process.env.ANNI_CORE_URL || 'http://127.0.0.1:4200'

export async function ensureUser(req) {
  if (DEV_MODE && req.headers['x-dev-user']) {
    try {
      return JSON.parse(req.headers['x-dev-user'])
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
    return data.ok ? data.user : null
  } catch (err) {
    console.error('[auth] AnniCore check failed:', err)
    return null
  }
}

export async function requireAuth(req, res, next) {
  const user = await ensureUser(req)
  if (!user) return res.status(401).json({ error: 'Not authenticated' })
  req.user = user
  next()
}
