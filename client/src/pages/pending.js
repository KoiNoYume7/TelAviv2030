import { t } from '../lib/i18n.js'
import { api } from '../lib/api.js'
import { navigate } from '../lib/router.js'
import '../styles/base.css'
import '../styles/components.css'
import '../styles/pages.css'

export function renderPending(user) {
  const app = document.getElementById('app')
  
  app.innerHTML = `
    <div class="pending-page">
      <div class="card pending-card reveal">
        <h1 class="login-title">${t('pending.title')}</h1>
        <p class="login-subtitle">${t('pending.subtitle')}</p>
        <button id="refreshBtn" class="btn btn-primary">${t('pending.refresh')}</button>
        <button id="logoutBtn" class="btn btn-ghost">${t('nav.logout')}</button>
      </div>
    </div>
  `
  
  // Refresh status
  document.getElementById('refreshBtn').addEventListener('click', async () => {
    try {
      const user = await api.getMe()
      if (user.role !== 'pending') {
        if (!user.agreement_signed_at) {
          navigate('agreement')
        } else {
          navigate('dashboard')
        }
      }
    } catch (error) {
      console.error('Refresh error:', error)
    }
  })
  
  // Logout
  document.getElementById('logoutBtn').addEventListener('click', async () => {
    try {
      await api.logout()
      navigate('')
    } catch (error) {
      console.error('Logout error:', error)
      navigate('')
    }
  })
}