import { t } from '../lib/i18n.js'
import { api } from '../lib/api.js'
import { showSuccess, showError } from '../lib/toast.js'
import { renderNav } from '../components/nav.js'
import { renderFooter } from '../components/footer.js'
import '../styles/base.css'
import '../styles/components.css'
import '../styles/pages.css'

export async function renderContribute() {
  const app = document.getElementById('app')
  
  app.innerHTML = `
    ${renderNav().outerHTML}
    <main class="container contribute-page">
      <div class="dashboard-header reveal">
        <h1>${t('contribute.title')}</h1>
        <p class="text-muted">${t('contribute.subtitle')}</p>
      </div>
      
      <div class="contribute-methods reveal">
        <div class="card method-card" id="twintCard">
          <div class="method-icon">💳</div>
          <h3 class="method-title">${t('contribute.twint_title')}</h3>
          <p class="method-desc">${t('contribute.twint_desc')}</p>
        </div>
        
        <div class="card method-card" style="opacity: 0.5; cursor: not-allowed;">
          <div class="method-icon">💳</div>
          <h3 class="method-title">${t('contribute.card_title')}</h3>
          <p class="method-desc">${t('contribute.card_desc')}</p>
          <span class="tag">${t('contribute.coming_soon')}</span>
        </div>
      </div>
      
      <div class="card reveal" id="twintForm" style="display: none;">
        <div class="card-header">
          <h3 class="card-title">${t('contribute.twint_title')}</h3>
        </div>
        <div class="card-body">
          <p class="mb-4">${t('contribute.twint_instructions')}</p>
          
          <form id="contributionForm">
            <div class="form-group">
              <label class="form-label">${t('contribute.amount')}</label>
              <input type="number" step="0.01" min="0.01" class="form-input" id="amount" required placeholder="50.00">
            </div>
            
            <div class="form-group">
              <label class="form-label">${t('contribute.note')}</label>
              <textarea class="form-input form-textarea" id="note" placeholder="${t('common.note')}"></textarea>
            </div>
            
            <button type="submit" class="btn btn-primary">${t('contribute.submit')}</button>
          </form>
        </div>
      </div>
    </main>
    ${renderFooter().outerHTML}
  `
  
  // Show TWINT form on click
  document.getElementById('twintCard').addEventListener('click', () => {
    document.getElementById('twintForm').style.display = 'block'
    document.getElementById('twintForm').scrollIntoView({ behavior: 'smooth' })
  })
  
  // Handle form submission
  document.getElementById('contributionForm').addEventListener('submit', async (e) => {
    e.preventDefault()
    
    const amount = parseFloat(document.getElementById('amount').value)
    const note = document.getElementById('note').value
    
    if (!amount || amount <= 0) {
      showError('Please enter a valid amount')
      return
    }
    
    try {
      await api.createContribution({
        amount_chf: amount,
        method: 'twint',
        note
      })
      showSuccess(t('toast.contribution_submitted'))
      document.getElementById('contributionForm').reset()
      document.getElementById('twintForm').style.display = 'none'
    } catch (error) {
      showError(error.message || t('common.error'))
    }
  })
}