import { t } from '../lib/i18n.js'
import { api } from '../lib/api.js'
import { formatCHF, formatTier, formatTierClass } from '../lib/format.js'

export async function renderDashboard(user) {
  const app = document.getElementById('app')
  app.innerHTML = `<div class="container" style="padding:3rem 1rem"><p class="text-muted">${t('common.loading')}</p></div>`

  try {
    const [stats, balance] = await Promise.all([
      api.getMemberStats(user.id),
      api.getTotalBalance().catch(() => ({ total: 0 }))
    ])

    app.innerHTML = `
      <main class="container dashboard-page">
        <div class="dashboard-header reveal">
          <h1>${t('dashboard.title')}</h1>
          <p class="text-muted">Welcome back, ${user.display_name || user.name}</p>
        </div>

        <div class="dashboard-grid reveal">
          <div class="card stat-card">
            <div class="stat-value mono">${formatCHF(balance.total)}</div>
            <div class="stat-label">${t('dashboard.group_balance')}</div>
          </div>

          <div class="card stat-card">
            <div class="stat-value mono">${formatCHF(stats.total_contributed)}</div>
            <div class="stat-label">${t('dashboard.your_contributions')}</div>
          </div>

          <div class="card stat-card">
            <span class="badge ${formatTierClass(stats.tier)}">${formatTier(stats.tier)}</span>
            <div class="stat-label mt-2">${t('dashboard.your_tier')}</div>
          </div>
        </div>

        <div class="dashboard-actions reveal mt-6">
          <a href="#/contribute" class="btn btn-primary">${t('contribute.title')}</a>
        </div>
      </main>
    `
  } catch (err) {
    console.error('Dashboard error:', err)
    app.innerHTML = `
      <main class="container" style="padding-top:3rem">
        <div class="card reveal">
          <h2>${t('common.error')}</h2>
          <p class="text-muted mt-2">${err.message}</p>
          <button onclick="window.location.reload()" class="btn btn-primary mt-4">Retry</button>
        </div>
      </main>
    `
  }
}
