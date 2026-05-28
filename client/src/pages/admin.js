import { t } from '../lib/i18n.js'
import { api } from '../lib/api.js'
import { formatCHF, formatDateTime } from '../lib/format.js'
import { showSuccess, showError } from '../lib/toast.js'
import { confirmModal } from '../lib/modal.js'
import { renderNav } from '../components/nav.js'
import { renderFooter } from '../components/footer.js'
import '../styles/base.css'
import '../styles/components.css'
import '../styles/pages.css'

export async function renderAdmin() {
  const app = document.getElementById('app')
  
  try {
    const user = await api.getMe()
    
    if (user.role !== 'admin') {
      app.innerHTML = `
        ${renderNav().outerHTML}
        <main class="container admin-page">
          <div class="card reveal">
            <h1>${t('common.error')}</h1>
            <p class="text-muted">Admin access required</p>
          </div>
        </main>
        ${renderFooter().outerHTML}
      `
      return
    }
    
    const [members, contributions] = await Promise.all([
      api.getMembers(),
      api.getContributions()
    ])
    
    const pendingMembers = members.filter(m => m.role === 'pending')
    const pendingContributions = contributions.filter(c => c.status === 'pending')
    
    app.innerHTML = `
      ${renderNav().outerHTML}
      <main class="container admin-page">
        <div class="dashboard-header reveal">
          <h1>${t('admin.title')}</h1>
          <p class="text-muted">${t('admin.subtitle')}</p>
        </div>
        
        <div class="admin-sections reveal">
          <!-- Pending Approvals -->
          <section>
            <div class="admin-section-header">
              <h2>${t('admin.pending_approvals')}</h2>
              <span class="badge badge-pending">${pendingMembers.length}</span>
            </div>
            
            ${pendingMembers.length === 0 ? `
              <p class="text-muted">${t('admin.no_pending')}</p>
            ` : `
              <div class="admin-list">
                ${pendingMembers.map(member => `
                  <div class="card admin-item">
                    <div class="admin-item-info">
                      <div class="admin-item-name">${member.display_name || member.name}</div>
                      <div class="admin-item-meta">${member.email} • ${member.provider}</div>
                    </div>
                    <div class="admin-item-actions">
                      <button class="btn btn-primary btn-sm" data-action="approve" data-id="${member.id}">
                        ${t('admin.approve')}
                      </button>
                      <button class="btn btn-danger btn-sm" data-action="deny" data-id="${member.id}">
                        ${t('admin.deny')}
                      </button>
                    </div>
                  </div>
                `).join('')}
              </div>
            `}
          </section>
          
          <!-- Pending Contributions -->
          <section>
            <div class="admin-section-header">
              <h2>${t('admin.pending_contributions')}</h2>
              <span class="badge badge-pending">${pendingContributions.length}</span>
            </div>
            
            ${pendingContributions.length === 0 ? `
              <p class="text-muted">${t('admin.no_pending')}</p>
            ` : `
              <div class="admin-list">
                ${pendingContributions.map(contribution => `
                  <div class="card admin-item">
                    <div class="admin-item-info">
                      <div class="admin-item-name">${contribution.display_name || contribution.name}</div>
                      <div class="admin-item-meta">
                        ${formatCHF(contribution.amount_chf)} via ${contribution.method} • ${formatDateTime(contribution.created_at)}
                      </div>
                      ${contribution.note ? `<div class="text-subtle" style="font-size: 0.85rem;">${contribution.note}</div>` : ''}
                    </div>
                    <div class="admin-item-actions">
                      <button class="btn btn-primary btn-sm" data-action="confirm" data-id="${contribution.id}">
                        ${t('admin.confirm')}
                      </button>
                      <button class="btn btn-danger btn-sm" data-action="reject" data-id="${contribution.id}">
                        ${t('admin.reject')}
                      </button>
                    </div>
                  </div>
                `).join('')}
              </div>
            `}
          </section>
        </div>
      </main>
      ${renderFooter().outerHTML}
    `
    
    // Handle member approvals
    document.querySelectorAll('[data-action="approve"]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id
        try {
          await api.approveMember(id)
          showSuccess(t('toast.member_approved'))
          renderAdmin() // Reload
        } catch (error) {
          showError(error.message || t('common.error'))
        }
      })
    })
    
    document.querySelectorAll('[data-action="deny"]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id
        confirmModal({
          title: t('admin.deny'),
          message: 'Are you sure you want to deny this member?',
          onConfirm: async () => {
            try {
              await api.denyMember(id)
              showSuccess('Member denied')
              renderAdmin() // Reload
            } catch (error) {
              showError(error.message || t('common.error'))
            }
          }
        })
      })
    })
    
    // Handle contribution confirmations
    document.querySelectorAll('[data-action="confirm"]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id
        try {
          await api.confirmContribution(id)
          showSuccess(t('toast.contribution_confirmed'))
          renderAdmin() // Reload
        } catch (error) {
          showError(error.message || t('common.error'))
        }
      })
    })
    
    document.querySelectorAll('[data-action="reject"]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id
        confirmModal({
          title: t('admin.reject'),
          message: 'Are you sure you want to reject this contribution?',
          onConfirm: async () => {
            try {
              await api.rejectContribution(id)
              showSuccess(t('toast.contribution_rejected'))
              renderAdmin() // Reload
            } catch (error) {
              showError(error.message || t('common.error'))
            }
          }
        })
      })
    })
    
  } catch (error) {
    console.error('Admin page error:', error)
    app.innerHTML = `
      ${renderNav().outerHTML}
      <main class="container admin-page">
        <div class="card reveal">
          <h1>${t('common.error')}</h1>
          <p class="text-muted">${error.message}</p>
        </div>
      </main>
      ${renderFooter().outerHTML}
    `
  }
}