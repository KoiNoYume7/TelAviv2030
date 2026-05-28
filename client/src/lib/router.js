import { api } from './api.js'
import { renderNav } from '../components/nav.js'
import { renderFooter } from '../components/footer.js'
import { renderLogin } from '../pages/login.js'
import { renderPending } from '../pages/pending.js'
import { renderDashboard } from '../pages/dashboard.js'
import { renderContribute } from '../pages/contribute.js'
import { renderCashout } from '../pages/cashout.js'
import { renderMembers } from '../pages/members.js'
import { renderAdmin } from '../pages/admin.js'
import { renderAgreement } from '../pages/agreement.js'

// Pages without nav/footer (full-screen standalone)
const STANDALONE = new Set(['pending', 'agreement'])

export function navigate(page, params = {}) {
  const qs = new URLSearchParams(params).toString()
  window.location.hash = qs ? `/${page}?${qs}` : `/${page}`
}

export function initRouter() {
  window.addEventListener('hashchange', handleRoute)
  window.addEventListener('langchange', handleRoute)
  handleRoute()
}

async function handleRoute() {
  // Strip the leading / that hash-based links produce (e.g. #/dashboard → dashboard)
  const raw = window.location.hash.slice(1).replace(/^\//, '') || ''
  const [page, ...qparts] = raw.split('?')
  const params = new URLSearchParams(qparts.join('?'))

  const navRoot    = document.getElementById('nav-root')
  const footerRoot = document.getElementById('footer-root')

  // Public pages — no auth check
  if (!page || page === 'login') {
    navRoot.innerHTML = ''
    footerRoot.innerHTML = ''
    renderLogin(params)
    return
  }

  // Auth guard — all other pages require a session
  let user
  try {
    user = await api.getMe()
  } catch {
    navRoot.innerHTML = ''
    footerRoot.innerHTML = ''
    renderLogin(params)
    return
  }

  // Flow-based redirects
  if (user.role === 'pending' && page !== 'pending') {
    navigate('pending'); return
  }
  if (!user.agreement_signed_at && !STANDALONE.has(page)) {
    navigate('agreement'); return
  }
  if (page === 'admin' && user.role !== 'admin') {
    navigate('dashboard'); return
  }

  // Standalone pages (pending, agreement) — no nav/footer
  if (STANDALONE.has(page)) {
    navRoot.innerHTML = ''
    footerRoot.innerHTML = ''
  } else {
    navRoot.innerHTML = ''
    navRoot.appendChild(renderNav(user))
    footerRoot.innerHTML = ''
    footerRoot.appendChild(renderFooter())
  }

  switch (page) {
    case 'pending':    renderPending(user);    break
    case 'agreement':  renderAgreement(user);  break
    case 'contribute': renderContribute(user); break
    case 'cashout':    renderCashout(user);    break
    case 'members':    renderMembers(user);    break
    case 'admin':      renderAdmin(user);      break
    default:           renderDashboard(user)
  }
}
