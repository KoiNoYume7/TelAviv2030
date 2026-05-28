import { t } from './i18n.js'

let toastContainer = null

function ensureContainer() {
  if (!toastContainer) {
    toastContainer = document.createElement('div')
    toastContainer.className = 'toast-container'
    document.body.appendChild(toastContainer)
  }
}

export function showToast(message, type = 'info') {
  ensureContainer()
  
  const toast = document.createElement('div')
  toast.className = `toast toast-${type}`
  
  let icon = 'ℹ️'
  if (type === 'success') icon = '✅'
  if (type === 'error') icon = '❌'
  
  toast.innerHTML = `
    <span class="toast-icon">${icon}</span>
    <span class="toast-message">${message}</span>
  `
  
  toastContainer.appendChild(toast)
  
  // Auto remove after 4 seconds
  setTimeout(() => {
    toast.style.opacity = '0'
    toast.style.transform = 'translateX(100%)'
    setTimeout(() => toast.remove(), 300)
  }, 4000)
}

export function showSuccess(message) {
  showToast(message, 'success')
}

export function showError(message) {
  showToast(message, 'error')
}

export function showInfo(message) {
  showToast(message, 'info')
}