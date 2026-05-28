import { t } from '../lib/i18n.js'
import { api } from '../lib/api.js'
import { formatCHF, formatTier, formatTierClass } from '../lib/format.js'
import { renderNav } from '../components/nav.js'
import { renderFooter } from '../components/footer.js'
import '../styles/base.css'
import '../styles/components.css'
import '../styles/pages.css'

export async function renderMembers() {
  const app = document.getElementById('app')
  
  try {
    const members = await api.getMembers()
    
    // Get stats for each member
    const membersWithStats = await Promise.all(
      members.map(async member => {
        try {
          const stats = await api.getMemberStats(member.id)
          return { ...member, ...stats }
        } catch (error) {
          return { ...member, tier: 'starter', total_contributed: 0 }
        }
      })
    )
    
    app.innerHTML = `
      ${renderNav().outerHTML}
      <main class="container members-page">
        <div class="dashboard-header reveal">
          <h1>${t('members.title')}</h1>
          <p class="text-muted">${t('members.subtitle')}</p>
        </div>
        
        <div class="members-grid reveal">
          ${membersWithStats.map(member => `
            <div class="card member-card">
              <div class="member-avatar">
                ${member.name.charAt(0).toUpperCase()}
              </div>
              <div class="member-info">
                <div class="member-name">${member.display_name || member.name}</div>
                <div class="member-role">${member.role}</div>
              </div>
              <div class="member-tier">
                <span class="badge ${formatTierClass(member.tier)}">${formatTier(member.tier)}</span>
              </div>
              <div class="mt-2 text-muted" style="font-size: 0.85rem;">
                ${formatCHF(member.total_contributed)}
              </div>
            </div>
          `).join('')}
        </div>
      </main>
      ${renderFooter().outerHTML}
    `
    
  } catch (error) {
    console.error('Members page error:', error)
    app.innerHTML = `
      ${renderNav().outerHTML}
      <main class="container members-page">
        <div class="card reveal">
          <h1>${t('common.error')}</h1>
          <p class="text-muted">${error.message}</p>
        </div>
      </main>
      ${renderFooter().outerHTML}
    `
  }
}