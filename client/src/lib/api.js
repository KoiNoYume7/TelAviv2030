const API_BASE = '/api'

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  }
  
  const response = await fetch(url, config)
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(error.error || 'Request failed')
  }
  
  return response.json()
}

export const api = {
  // Auth
  getMe: () => request('/auth/me'),
  logout: () => request('/auth/logout', { method: 'POST' }),
  
  // Members
  getMembers: () => request('/members'),
  getMeMember: () => request('/members/me'),
  approveMember: (id) => request(`/members/${id}/approve`, { method: 'POST' }),
  denyMember: (id) => request(`/members/${id}/deny`, { method: 'POST' }),
  signAgreement: () => request('/members/agreement', { method: 'POST' }),
  getMemberStats: (id) => request(`/members/${id}/stats`),
  
  // Contributions
  getContributions: () => request('/contributions'),
  getMyContributions: () => request('/contributions/me'),
  createContribution: (data) => request('/contributions', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  confirmContribution: (id) => request(`/contributions/${id}/confirm`, { method: 'POST' }),
  rejectContribution: (id) => request(`/contributions/${id}/reject`, { method: 'POST' }),
  getTotalBalance: () => request('/contributions/balance/total'),
  
  // Cashouts
  getCashouts: () => request('/cashouts'),
  getCashout: (id) => request(`/cashouts/${id}`),
  createCashout: (data) => request('/cashouts', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  voteCashout: (id, vote) => request(`/cashouts/${id}/vote`, {
    method: 'POST',
    body: JSON.stringify({ vote })
  }),
  executeCashout: (id) => request(`/cashouts/${id}/execute`, { method: 'POST' }),
  
  // Discord
  notifyContribution: (data) => request('/discord/notify/contribution', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  notifyProposal: (data) => request('/discord/notify/proposal', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  notifyExecution: (data) => request('/discord/notify/execution', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  notifyApproval: (data) => request('/discord/notify/approval', {
    method: 'POST',
    body: JSON.stringify(data)
  })
}