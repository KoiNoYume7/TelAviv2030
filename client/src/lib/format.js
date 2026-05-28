export function formatCHF(amount) {
  return new Intl.NumberFormat('de-CH', {
    style: 'currency',
    currency: 'CHF',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount)
}

export function formatDate(timestamp) {
  return new Date(timestamp * 1000).toLocaleDateString('de-CH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

export function formatDateTime(timestamp) {
  return new Date(timestamp * 1000).toLocaleString('de-CH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function formatRelativeTime(timestamp) {
  const now = Math.floor(Date.now() / 1000)
  const diff = now - timestamp
  
  const minutes = Math.floor(diff / 60)
  const hours = Math.floor(diff / 3600)
  const days = Math.floor(diff / 86400)
  
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  
  return formatDate(timestamp)
}

export function formatTier(tier) {
  const tierNames = {
    starter: '🪵 Starter',
    contributor: '🥉 Contributor',
    regular: '🥈 Regular',
    backbone: '🥇 Backbone',
    legend: '🔥 Legend'
  }
  return tierNames[tier] || tier
}

export function formatTierClass(tier) {
  return `tier-${tier}` || 'tier-starter'
}