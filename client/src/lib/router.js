import { renderLogin } from '../pages/login.js'
import { renderPending } from '../pages/pending.js'
import { renderDashboard } from '../pages/dashboard.js'
import { renderContribute } from '../pages/contribute.js'
import { renderCashout } from '../pages/cashout.js'
import { renderMembers } from '../pages/members.js'
import { renderAdmin } from '../pages/admin.js'
import { renderAgreement } from '../pages/agreement.js'

const routes = {
  '': renderLogin,
  'login': renderLogin,
  'pending': renderPending,
  'dashboard': renderDashboard,
  'contribute': renderContribute,
  'cashout': renderCashout,
  'members': renderMembers,
  'admin': renderAdmin,
  'agreement': renderAgreement
}

export function initRouter() {
  window.addEventListener('hashchange', handleRoute)
  handleRoute()
}

function handleRoute() {
  const hash = window.location.hash.slice(1) || ''
  const [page, ...params] = hash.split('?')
  const queryParams = new URLSearchParams(params.join('?'))
  
  const renderer = routes[page] || routes['']
  
  if (renderer) {
    renderer(queryParams)
  }
}

export function navigate(page, params = {}) {
  const queryString = new URLSearchParams(params).toString()
  const hash = queryString ? `${page}?${queryString}` : page
  window.location.hash = hash
}