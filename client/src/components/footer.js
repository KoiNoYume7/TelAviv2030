import { t } from '../lib/i18n.js'

export function renderFooter() {
  const footer = document.createElement('footer')
  footer.className = 'footer'
  footer.innerHTML = `
    <div class="container footer-content">
      <p class="footer-text">${t('footer.disclaimer')}</p>
      <div class="footer-links">
        <a href="https://github.com/yumehana/telaviv" target="_blank" class="footer-link">GitHub</a>
        <span class="footer-text">© 2024 TelAviv2030. ${t('footer.rights')}</span>
      </div>
    </div>
  `
  
  return footer
}