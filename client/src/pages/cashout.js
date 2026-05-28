import { t } from '../lib/i18n.js'

export function renderCashout(user) {
  const app = document.getElementById('app')

  app.innerHTML = `
    <main class="container cashout-page">
      <div class="dashboard-header reveal">
        <h1>${t('cashout.title')}</h1>
        <p class="text-muted">${t('cashout.subtitle')}</p>
      </div>

      <div class="card reveal text-center" style="padding:3rem 2rem;">
        <div style="font-size:3rem;margin-bottom:1rem;">🏖️</div>
        <h2>${t('cashout.coming_soon')}</h2>
        <p class="text-muted mt-4">
          Cashout proposals and voting will be available in Phase 2,
          once the joint account is set up after your buddy returns.
        </p>
      </div>
    </main>
  `
}
