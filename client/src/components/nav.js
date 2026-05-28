import { t } from '../lib/i18n.js'
import { toggleTheme, getTheme } from '../lib/theme.js'
import { setLang, getLang, availableLangs } from '../lib/i18n.js'
import { api } from '../lib/api.js'
import { navigate } from '../lib/router.js'

export function renderNav() {
  const theme = getTheme()
  const lang = getLang()
  
  const nav = document.createElement('nav')
  nav.className = 'nav'
  nav.innerHTML = `
    <div class="container nav-container">
      <a href="#/" class="nav-logo">
        <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M8 24V14H24V24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M6 14L16 6L26 14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M16 6V2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          <path d="M13 2H19" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
        TelAviv2030
      </a>
      <div class="nav-links">
        <a href="#/dashboard" class="nav-link" data-page="dashboard">${t('nav.home')}</a>
        <a href="#/contribute" class="nav-link" data-page="contribute">${t('nav.contribute')}</a>
        <a href="#/cashout" class="nav-link" data-page="cashout">${t('nav.cashout')}</a>
        <a href="#/members" class="nav-link" data-page="members">${t('nav.members')}</a>
        <a href="#/admin" class="nav-link admin-only" data-page="admin">${t('nav.admin')}</a>
        <button id="themeToggle" class="btn btn-ghost btn-sm">
          ${theme === 'dark' ? t('nav.theme_light') : t('nav.theme_dark')}
        </button>
        <button id="langToggle" class="btn btn-ghost btn-sm">
          ${lang.toUpperCase()}
        </button>
        <button id="logoutBtn" class="btn btn-ghost btn-sm">${t('nav.logout')}</button>
      </div>
    </div>
  `
  
  // Theme toggle
  nav.querySelector('#themeToggle').addEventListener('click', () => {
    toggleTheme()
    nav.querySelector('#themeToggle').textContent = 
      getTheme() === 'dark' ? t('nav.theme_light') : t('nav.theme_dark')
  })
  
  // Language toggle
  nav.querySelector('#langToggle').addEventListener('click', () => {
    const langs = availableLangs()
    const currentIndex = langs.indexOf(lang)
    const nextIndex = (currentIndex + 1) % langs.length
    const nextLang = langs[nextIndex]
    setLang(nextLang)
    nav.querySelector('#langToggle').textContent = nextLang.toUpperCase()
  })
  
  // Logout
  nav.querySelector('#logoutBtn').addEventListener('click', async () => {
    try {
      await api.logout()
      navigate('')
    } catch (error) {
      console.error('Logout error:', error)
      navigate('')
    }
  })
  
  // Check admin role
  api.getMe().then(user => {
    if (user.role !== 'admin') {
      const adminLink = nav.querySelector('.admin-only')
      if (adminLink) adminLink.remove()
    }
  }).catch(() => {
    // Not logged in, hide nav
    nav.remove()
  })
  
  // Set active link
  const currentPage = window.location.hash.slice(1).split('?')[0] || 'dashboard'
  const activeLink = nav.querySelector(`[data-page="${currentPage}"]`)
  if (activeLink) activeLink.classList.add('active')
  
  return nav
}