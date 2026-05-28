import { t } from '../lib/i18n.js'
import { api } from '../lib/api.js'
import { showSuccess, showError } from '../lib/toast.js'
import { navigate } from '../lib/router.js'
import '../styles/base.css'
import '../styles/components.css'
import '../styles/pages.css'

export function renderAgreement(user) {
  const app = document.getElementById('app')
  
  app.innerHTML = `
    <div class="pending-page">
      <div class="card pending-card reveal">
        <h1 class="login-title">${t('agreement.title')}</h1>
        <p class="login-subtitle">${t('agreement.subtitle')}</p>
        
        <div class="card-body" style="background: var(--bg3); padding: 1rem; border-radius: var(--radius); margin-bottom: 1.5rem; text-align: left;">
          <p style="line-height: 1.8;">${t('agreement.text')}</p>
        </div>
        
        <div class="flex gap-4 justify-center">
          <button id="signBtn" class="btn btn-primary">${t('agreement.sign')}</button>
          <button id="declineBtn" class="btn btn-ghost btn-danger">${t('agreement.decline')}</button>
        </div>
      </div>
    </div>
  `
  
  // Sign agreement
  document.getElementById('signBtn').addEventListener('click', async () => {
    try {
      await api.signAgreement()
      showSuccess(t('toast.success'))
      navigate('dashboard')
    } catch (error) {
      showError(error.message || t('common.error'))
    }
  })
  
  // Decline (logout)
  document.getElementById('declineBtn').addEventListener('click', async () => {
    try {
      await api.logout()
      navigate('')
    } catch (error) {
      console.error('Logout error:', error)
      navigate('')
    }
  })
}