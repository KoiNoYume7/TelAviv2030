import { t } from './i18n.js'

export function showModal({ title, content, actions = [] }) {
  // Remove existing modal
  const existing = document.querySelector('.modal-overlay')
  if (existing) existing.remove()
  
  const overlay = document.createElement('div')
  overlay.className = 'modal-overlay'
  
  const actionsHtml = actions.map(action => {
    const btnClass = action.primary ? 'btn btn-primary' : 'btn btn-ghost'
    return `<button class="${btnClass}" data-action="${action.id}">${action.label}</button>`
  }).join('')
  
  overlay.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <h3 class="modal-title">${title}</h3>
        <button class="modal-close" data-action="close">&times;</button>
      </div>
      <div class="modal-body">
        ${content}
      </div>
      ${actions.length ? `
        <div class="modal-footer">
          ${actionsHtml}
        </div>
      ` : ''}
    </div>
  `
  
  document.body.appendChild(overlay)
  
  // Handle clicks
  overlay.addEventListener('click', (e) => {
    const action = e.target.dataset.action
    if (action === 'close' || e.target === overlay) {
      closeModal()
      return
    }
    
    const actionObj = actions.find(a => a.id === action)
    if (actionObj && actionObj.handler) {
      actionObj.handler()
    }
  })
  
  // Handle escape key
  const escapeHandler = (e) => {
    if (e.key === 'Escape') {
      closeModal()
      document.removeEventListener('keydown', escapeHandler)
    }
  }
  document.addEventListener('keydown', escapeHandler)
}

export function closeModal() {
  const overlay = document.querySelector('.modal-overlay')
  if (overlay) {
    overlay.style.opacity = '0'
    setTimeout(() => overlay.remove(), 200)
  }
}

export function confirmModal({ title, message, onConfirm }) {
  showModal({
    title,
    content: `<p>${message}</p>`,
    actions: [
      { id: 'cancel', label: t('modal.cancel') },
      { id: 'confirm', label: t('modal.confirm'), primary: true, handler: () => {
        closeModal()
        onConfirm()
      }}
    ]
  })
}