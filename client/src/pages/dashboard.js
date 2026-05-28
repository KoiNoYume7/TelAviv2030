import { t } from '../lib/i18n.js'
import { api } from '../lib/api.js'
import { formatCHF, formatTier, formatTierClass } from '../lib/format.js'
import { renderNav } from '../components/nav.js'
import { renderFooter } from '../components/footer.js'
import '../styles/base.css'
import '../styles/components.css'
import '../styles/pages.css'

export async function renderDashboard() {
  const app = document.getElementById('app')
  
  try {
    const user = await api.getMe()
    const [stats, balance] = await Promise.all([
      api.getMemberStats(user.id),
      api.getTotalBalance().catch(() => ({ total: 0 }))
    ])
    
    app.innerHTML = `
      ${renderNav().outerHTML}
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
            <div class="tier-badge">
              <span class="badge ${formatTierClass(stats.tier)}">${formatTier(stats.tier)}</span>
            </div>
            <div class="stat-label">${t('dashboard.your_tier')}</div>
          </div>
        </div>
      </main>
      ${renderFooter().outerHTML}
    `
    
    // Re-attach event listeners for nav
    const navElement = document.querySelector('.nav')
    if (navElement && !navElement.hasAttribute('data-initialized')) {
      navElement.setAttribute('data-initialized', 'true')
      const newNav = renderNav()
      navElement.replaceWith(newNav)
    }
    
  } catch (error) {
    console.error('Dashboard error:', error)
    app.innerHTML = `
      <div class="container dashboard-page">
        <div class="card reveal">
          <h1>${t('common.error')}</h1>
          <p class="text-muted">${error.message}</p>
          <button id="retryBtn" class="btn btn-primary">${t('common.loading')}</button>
        </div>
      </div>
    `
    
    document.getElementById('retryBtn')?.addEventListener('click', () => {
      window.location.reload()
    })
  }
}