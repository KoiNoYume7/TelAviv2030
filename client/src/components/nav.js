import { t } from '../lib/i18n.js'
import { toggleTheme, getTheme } from '../lib/theme.js'
import { setLang, getLang, availableLangs } from '../lib/i18n.js'
import { api } from '../lib/api.js'
import { navigate } from '../lib/router.js'

export function renderNav(user = null) {
  const theme = getTheme()
  const lang = getLang()
  const isAdmin = user?.role === 'admin'

  const nav = document.createElement('nav')
  nav.className = 'nav'
  nav.innerHTML = `
    <div class="container nav-container">
      <a href="#/dashboard" class="nav-logo">
        <svg viewBox="0 0 32 40" fill="none" xmlns="http://www.w3.org/2000/svg" width="28" height="28">
          <path d="M10 36V22H22V36" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M10 22V16H22V22" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M7 22L16 14L25 22" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M14 6C14 6 12 3 16 1C20 3 18 6 18 6" stroke="var(--accent)" stroke-width="1.8" stroke-linecap="round" fill="none"/>
          <path d="M16 1C16 1 15 4 16 7C17 4 16 1 16 1Z" fill="var(--accent)" opacity="0.6"/>
        </svg>
        TelAviv2030
      </a>
      <div class="nav-links">
        <a href="#/dashboard"  class="nav-link" data-page="dashboard">${t('nav.home')}</a>
        <a href="#/contribute" class="nav-link" data-page="contribute">${t('nav.contribute')}</a>
        <a href="#/cashout"    class="nav-link" data-page="cashout">${t('nav.cashout')}</a>
        <a href="#/members"    class="nav-link" data-page="members">${t('nav.members')}</a>
        ${isAdmin ? `<a href="#/admin" class="nav-link" data-page="admin">${t('nav.admin')}</a>` : ''}
        <button id="themeToggle" class="btn btn-ghost btn-sm">
          ${theme === 'dark' ? t('nav.theme_light') : t('nav.theme_dark')}
        </button>
        <button id="langToggle" class="btn btn-ghost btn-sm">${lang.toUpperCase()}</button>
        <button id="logoutBtn"  class="btn btn-ghost btn-sm">${t('nav.logout')}</button>
      </div>
    </div>
  `

  // Theme toggle — event attached to DOM element directly (survives appendChild)
  nav.querySelector('#themeToggle').addEventListener('click', () => {
    toggleTheme()
    nav.querySelector('#themeToggle').textContent =
      getTheme() === 'dark' ? t('nav.theme_light') : t('nav.theme_dark')
  })

  // Language toggle
  nav.querySelector('#langToggle').addEventListener('click', () => {
    const langs = availableLangs()
    const next = langs[(langs.indexOf(getLang()) + 1) % langs.length]
    setLang(next)
  })

  // Logout
  nav.querySelector('#logoutBtn').addEventListener('click', async () => {
    try { await api.logout() } catch {}
    navigate('')
  })

  // Active link highlight
  const currentPage = window.location.hash.slice(1).replace(/^\//, '').split('?')[0]
  const activeLink = nav.querySelector(`[data-page="${currentPage}"]`)
  if (activeLink) activeLink.classList.add('active')

  return nav
}
