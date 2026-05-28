import { t } from '../lib/i18n.js'
import { api } from '../lib/api.js'
import { formatCHF, formatDateTime } from '../lib/format.js'
import { showSuccess, showError } from '../lib/toast.js'
import { confirmModal } from '../lib/modal.js'

export async function renderAdmin(user) {
  const app = document.getElementById('app')
  const reload = () => renderAdmin(user)

  app.innerHTML = `<div class="container" style="padding:3rem 1rem"><p class="text-muted">${t('common.loading')}</p></div>`

  try {
    const [members, contributions] = await Promise.all([
      api.getMembers(),
      api.getContributions()
    ])

    const pendingMembers       = members.filter(m => m.role === 'pending')
    const pendingContributions = contributions.filter(c => c.status === 'pending')

    app.innerHTML = `
      <main class="container admin-page">
        <div class="dashboard-header reveal">
          <h1>${t('admin.title')}</h1>
          <p class="text-muted">${t('admin.subtitle')}</p>
        </div>

        <div class="admin-sections reveal">

          <!-- Pending member approvals -->
          <section>
            <div class="admin-section-header">
              <h2>${t('admin.pending_approvals')}</h2>
              <span class="badge badge-pending">${pendingMembers.length}</span>
            </div>
            ${pendingMembers.length === 0 ? `<p class="text-muted">${t('admin.no_pending')}</p>` : `
              <div class="admin-list">
                ${pendingMembers.map(m => `
                  <div class="card admin-item">
                    <div class="admin-item-info">
                      <div class="admin-item-name">${m.display_name || m.name}</div>
                      <div class="admin-item-meta">${m.email} · ${m.provider}</div>
                    </div>
                    <div class="admin-item-actions">
                      <button class="btn btn-primary btn-sm" data-action="approve" data-id="${m.id}">${t('admin.approve')}</button>
                      <button class="btn btn-danger  btn-sm" data-action="deny"    data-id="${m.id}">${t('admin.deny')}</button>
                    </div>
                  </div>
                `).join('')}
              </div>
            `}
          </section>

          <!-- Pending contribution confirmations -->
          <section>
            <div class="admin-section-header">
              <h2>${t('admin.pending_contributions')}</h2>
              <span class="badge badge-pending">${pendingContributions.length}</span>
            </div>
            ${pendingContributions.length === 0 ? `<p class="text-muted">${t('admin.no_pending')}</p>` : `
              <div class="admin-list">
                ${pendingContributions.map(c => `
                  <div class="card admin-item">
                    <div class="admin-item-info">
                      <div class="admin-item-name">${c.display_name || c.name}</div>
                      <div class="admin-item-meta">
                        <span class="mono">${formatCHF(c.amount_chf)}</span> via ${c.method} · ${formatDateTime(c.created_at)}
                      </div>
                      ${c.note ? `<div class="text-subtle" style="font-size:0.85rem;margin-top:0.25rem;">${c.note}</div>` : ''}
                    </div>
                    <div class="admin-item-actions">
                      <button class="btn btn-primary btn-sm" data-action="confirm" data-id="${c.id}">${t('admin.confirm')}</button>
                      <button class="btn btn-danger  btn-sm" data-action="reject"  data-id="${c.id}">${t('admin.reject')}</button>
                    </div>
                  </div>
                `).join('')}
              </div>
            `}
          </section>
        </div>
      </main>
    `

    // Member approval / denial
    app.querySelectorAll('[data-action="approve"]').forEach(btn => {
      btn.addEventListener('click', async () => {
        try {
          await api.approveMember(btn.dataset.id)
          showSuccess(t('toast.member_approved'))
          reload()
        } catch (err) { showError(err.message || t('common.error')) }
      })
    })

    app.querySelectorAll('[data-action="deny"]').forEach(btn => {
      btn.addEventListener('click', () => {
        confirmModal({
          title: t('admin.deny'),
          message: 'Are you sure you want to deny this member?',
          onConfirm: async () => {
            try {
              await api.denyMember(btn.dataset.id)
              showSuccess(t('toast.member_denied'))
              reload()
            } catch (err) { showError(err.message || t('common.error')) }
          }
        })
      })
    })

    // Contribution confirm / reject
    app.querySelectorAll('[data-action="confirm"]').forEach(btn => {
      btn.addEventListener('click', async () => {
        try {
          await api.confirmContribution(btn.dataset.id)
          showSuccess(t('toast.contribution_confirmed'))
          reload()
        } catch (err) { showError(err.message || t('common.error')) }
      })
    })

    app.querySelectorAll('[data-action="reject"]').forEach(btn => {
      btn.addEventListener('click', () => {
        confirmModal({
          title: t('admin.reject'),
          message: 'Are you sure you want to reject this contribution?',
          onConfirm: async () => {
            try {
              await api.rejectContribution(btn.dataset.id)
              showSuccess(t('toast.contribution_rejected'))
              reload()
            } catch (err) { showError(err.message || t('common.error')) }
          }
        })
      })
    })

  } catch (err) {
    console.error('Admin page error:', err)
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
