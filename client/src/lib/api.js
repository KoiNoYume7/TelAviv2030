// ── API helpers ──
const API_BASE = '/api'

async function api(method, path, body) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  }
  if (body) opts.body = JSON.stringify(body)

  const res = await fetch(`${API_BASE}${path}`, opts)
  const data = await res.json().catch(() => null)
  if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`)
  return data
}

export const getJson = (path) => api('GET', path)
export const postJson = (path, body) => api('POST', path, body)
export const patchJson = (path, body) => api('PATCH', path, body)
export const del = (path) => api('DELETE', path)
