import { t } from '../lib/i18n.js'
import '../styles/base.css'
import '../styles/components.css'
import '../styles/pages.css'

export function renderLogin() {
  const app = document.getElementById('app')
  
  app.innerHTML = `
    <div class="login-page">
      <div class="card login-card reveal">
        <h1 class="login-title">${t('login.title')}</h1>
        <p class="login-subtitle">${t('login.subtitle')}</p>
        
        <div class="login-methods">
          <a href="/api/auth/discord" class="btn btn-primary login-method">
            <div class="login-method-title">${t('login.discord_title')}</div>
            <div class="login-method-desc">${t('login.discord_desc')}</div>
          </a>
          
          <a href="/api/auth/google" class="btn btn-ghost login-method">
            <div class="login-method-title">${t('login.google_title')}</div>
            <div class="login-method-desc">${t('login.google_desc')}</div>
          </a>
        </div>
      </div>
    </div>
  `
}