import en from '../locales/en.json'
import deCH from '../locales/de-CH.json'

const locales = { en, 'de-CH': deCH }
const saved = localStorage.getItem('lang') || 'en'
let current = locales[saved] ? saved : 'en'

export function t(key, vars = {}) {
  const str = locales[current]?.[key] ?? locales['en']?.[key] ?? key
  return str.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? `{${k}}`)
}

export function setLang(lang) {
  if (!locales[lang]) return
  current = lang
  localStorage.setItem('lang', lang)
  // re-render current page
  window.dispatchEvent(new CustomEvent('langchange'))
}

export function getLang() {
  return current
}

export function availableLangs() {
  return Object.keys(locales)
}

export function initI18n() {
  // Set initial language in document
  document.documentElement.lang = current
}