export function initTheme() {
  const saved = localStorage.getItem('theme') || 'dark'
  document.documentElement.setAttribute('data-theme', saved)
}

export function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme')
  const next = current === 'dark' ? 'light' : 'dark'
  document.documentElement.setAttribute('data-theme', next)
  localStorage.setItem('theme', next)
  
  // update toggle button label
  const btn = document.getElementById('themeToggle')
  if (btn) {
    btn.textContent = next === 'dark' ? '☀️ Light' : '🌙 Dark'
  }
  
  // dispatch event for components that need to react
  window.dispatchEvent(new CustomEvent('themechange'))
}

export function getTheme() {
  return document.documentElement.getAttribute('data-theme') || 'dark'
}