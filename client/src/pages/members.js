import { t } from '../lib/i18n.js'
import { api } from '../lib/api.js'
import { formatCHF, formatTier, formatTierClass } from '../lib/format.js'

export async function renderMembers(user) {
  const app = document.getElementById('app')
  app.innerHTML = `<div class="container" style="padding:3rem 1rem"><p class="text-muted">${t('common.loading')}</p></div>`

  try {
    const members = await api.getMembers()

    // Fetch stats for all members in parallel
    const membersWithStats = await Promise.all(
      members.map(async m => {
        try {
          const stats = await api.getMemberStats(m.id)
          return { ...m, ...stats }
        } catch {
          return { ...m, tier: 'starter', total_contributed: 0 }
        }
      })
    )

    app.innerHTML = `
      <main class="container members-page">
        <div class="dashboard-header reveal">
          <h1>${t('members.title')}</h1>
          <p class="text-muted">${t('members.subtitle')}</p>
        </div>

        <div class="members-grid reveal">
          ${membersWithStats.map(m => {
            const isMe = m.id === user.id
            return `
              <div class="card member-card${isMe ? ' member-card--me' : ''}">
                <div class="member-avatar">
                  ${m.avatar
                    ? `<img src="${m.avatar}" alt="${m.display_name || m.name}" class="avatar-img">`
                    : `<span class="avatar-initials">${(m.display_name || m.name).charAt(0).toUpperCase()}</span>`
                  }
                </div>
                <div class="member-info">
                  <div class="member-name">
                    ${m.display_name || m.name}
                    ${isMe ? '<span class="tag ml-2">You</span>' : ''}
                  </div>
                  <span class="badge ${formatTierClass(m.tier)}">${formatTier(m.tier)}</span>
                </div>
                ${isMe ? `
                  <div class="member-stat mono text-muted" style="font-size:0.85rem;margin-top:0.5rem;">
                    ${formatCHF(m.total_contributed)} contributed
                  </div>
                ` : ''}
              </div>
            `
          }).join('')}
        </div>
      </main>
    `
  } catch (err) {
    console.error('Members page error:', err)
    app.innerHTML = `
      <main class="container" style="padding-top:3rem">
        <div class="card reveal">
          <h2>${t('common.error')}</h2>
          <p class="text-muted mt-2">${err.message}</p>
        </div>
      </main>
    `
  }
}
