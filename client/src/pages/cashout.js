import { t } from '../lib/i18n.js'
import { renderNav } from '../components/nav.js'
import { renderFooter } from '../components/footer.js'
import '../styles/base.css'
import '../styles/components.css'
import '../styles/pages.css'

export function renderCashout() {
  const app = document.getElementById('app')
  
  app.innerHTML = `
    ${renderNav().outerHTML}
    <main class="container cashout-page">
      <div class="dashboard-header reveal">
        <h1>${t('cashout.title')}</h1>
        <p class="text-muted">${t('cashout.subtitle')}</p>
      </div>
      
      <div class="card reveal">
        <div class="card-body text-center">
          <h2>${t('cashout.coming_soon')}</h2>
          <p class="text-muted mt-4">This feature will be available in Phase 2 after the joint account is set up.</p>
        </div>
      </div>
    </main>
    ${renderFooter().outerHTML}
  `
}