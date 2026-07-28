<script>
  import { onMount } from 'svelte'
  import { getJson, postJson, patchJson, del, postFile } from '../lib/api.js'

  let me = $state(null)
  let requests = $state([])
  let title = $state('')
  let description = $state('')
  let amount = $state('')
  let payoutReference = $state('')
  let payoutReason = $state('')
  let error = $state('')

  onMount(async () => {
    try {
      me = await getJson('/me')
      await load()
    } catch (err) {
      error = err.message
    }
  })

  async function load() {
    requests = await getJson('/requests')
  }

  function toRappen(v) {
    return Math.round(parseFloat(v) * 100)
  }

  function formatChf(rappen) {
    return (rappen / 100).toFixed(2)
  }

  function isTelAviver() {
    return me?.community_status === 'TELAVIVER'
  }

  function isAdmin() {
    return ['SYSTEM_ADMIN', 'SYSTEM_OWNER'].includes(me?.technical_role)
  }

  async function submitRequest() {
    try {
      await postJson('/requests', { title, description, amount: toRappen(amount) })
      title = ''
      description = ''
      amount = ''
      await load()
    } catch (err) {
      error = err.message
    }
  }

  async function vote(req, v) {
    try {
      await postJson(`/requests/${req.id}/votes`, { vote: v })
      await load()
    } catch (err) {
      error = err.message
    }
  }

  async function cancel(req) {
    try {
      await del(`/requests/${req.id}`)
      await load()
    } catch (err) {
      error = err.message
    }
  }

  async function volunteer(req) {
    try {
      await postJson(`/requests/${req.id}/recipients`, {})
      await load()
    } catch (err) {
      error = err.message
    }
  }

  async function propose(req, memberId) {
    try {
      await postJson(`/requests/${req.id}/recipients/${memberId}/propose`, {})
      await load()
    } catch (err) {
      error = err.message
    }
  }

  async function object(req, memberId) {
    try {
      await postJson(`/requests/${req.id}/recipients/${memberId}/object`, {})
      await load()
    } catch (err) {
      error = err.message
    }
  }

  async function accept(req) {
    try {
      await postJson(`/requests/${req.id}/recipient/accept`, {})
      await load()
    } catch (err) {
      error = err.message
    }
  }

  async function decline(req) {
    try {
      await postJson(`/requests/${req.id}/recipient/decline`, {})
      await load()
    } catch (err) {
      error = err.message
    }
  }

  async function submitPayout(req) {
    try {
      await postJson(`/requests/${req.id}/payout/submit`, { reference: payoutReference })
      payoutReference = ''
      await load()
    } catch (err) {
      error = err.message
    }
  }

  async function updatePayoutStatus(req) {
    try {
      await patchJson(`/requests/${req.id}/payout/status`, { status: req._payoutStatus, reason: payoutReason })
      payoutReason = ''
      req._payoutStatus = ''
      await load()
    } catch (err) {
      error = err.message
    }
  }

  async function complete(req) {
    try {
      await postJson(`/requests/${req.id}/complete`, {})
      await load()
    } catch (err) {
      error = err.message
    }
  }

  async function uploadProof(req) {
    const input = document.getElementById(`proof-${req.id}`)
    if (!input?.files?.[0]) return
    const form = new FormData()
    form.append('file', input.files[0])
    try {
      await postFile(`/requests/${req.id}/proofs`, form)
      input.value = ''
      await load()
    } catch (err) {
      error = err.message
    }
  }

  function statusColor(status) {
    return {
      PENDING_VOTE: '#a2f',
      APPROVED_COOLDOWN: '#fa2',
      LOCKED: '#2a5',
      RECIPIENT_SELECTION: '#29f',
      RECIPIENT_ACCEPTANCE: '#f82',
      PAYOUT_PENDING: '#f82',
      PURCHASE_PENDING_PROOF: '#fa2',
      COMPLETED: '#2a5',
      CANCELLED: '#666',
      EXPIRED: '#666',
    }[status] || '#444'
  }
</script>

<section class="requests">
  <h1>Requests</h1>
  {#if error}
    <p class="error">{error}</p>
  {/if}

  {#if isTelAviver()}
    <form onsubmit={(e) => { e.preventDefault(); submitRequest() }}>
      <h2>New Request</h2>
      <label>
        Title
        <input type="text" bind:value={title} required />
      </label>
      <label>
        Description
        <textarea bind:value={description} rows="2"></textarea>
      </label>
      <label>
        Amount (CHF)
        <input type="number" step="0.01" min="0.01" bind:value={amount} required />
      </label>
      <button type="submit">Create Request</button>
    </form>
  {/if}

  <ul>
    {#each requests as req (req.id)}
      <li>
        <div class="top">
          <strong>{req.title}</strong>
          <span class="status" style="background: {statusColor(req.status)}">{req.status}</span>
        </div>
        <p class="amount">CHF {formatChf(req.amount)}</p>
        {#if req.description}
          <p class="desc">{req.description}</p>
        {/if}
        {#if req.status === 'PENDING_VOTE'}
          <p class="meta">
            Votes: {req.vote_summary.approve} / {req.vote_summary.total} approve,
            {req.vote_summary.reject} reject,
            {req.vote_summary.missing} missing
          </p>
        {/if}

        {#if req.status === 'PENDING_VOTE' && isTelAviver()}
          <div class="actions">
            <button onclick={() => vote(req, 'APPROVE')}>Approve</button>
            <button class="reject" onclick={() => vote(req, 'REJECT')}>Reject</button>
            {#if req.created_by === me?.id}
              <button class="danger" onclick={() => cancel(req)}>Cancel</button>
            {/if}
          </div>
        {/if}

        {#if req.status === 'APPROVED_COOLDOWN' && req.cooling_off_until}
          <p class="meta">Cooling-off until {new Date(req.cooling_off_until * 1000).toLocaleString()}</p>
        {/if}

        {#if req.status === 'RECIPIENT_SELECTION' && isTelAviver()}
          <div class="actions">
            <button onclick={() => volunteer(req)}>I can handle this purchase</button>
          </div>
          <!-- Recipients list loaded on demand not shown for brevity; proposal is stubbed below -->
          {#if req.created_by === me?.id || isAdmin()}
            <p class="meta">Recipient selection requires backend proposal flow (volunteer above, then propose).</p>
          {/if}
        {/if}

        {#if req.status === 'RECIPIENT_ACCEPTANCE' && req.selected_recipient_id === me?.id}
          <div class="actions">
            <button onclick={() => accept(req)}>Accept payout</button>
            <button class="danger" onclick={() => decline(req)}>Decline</button>
          </div>
        {/if}

        {#if req.status === 'PAYOUT_PENDING' && (req.selected_recipient_id === me?.id || isAdmin())}
          <div class="actions">
            <input type="text" placeholder="Bank reference (optional)" bind:value={payoutReference} />
            <button onclick={() => submitPayout(req)}>Submit payout</button>
          </div>
        {/if}

        {#if req.status === 'PAYOUT_PENDING' && isAdmin()}
          <div class="actions">
            <select bind:value={req._payoutStatus}>
              <option value="">Update payout status</option>
              <option value="PENDING">Pending</option>
              <option value="SETTLED">Settled</option>
              <option value="FAILED">Failed</option>
              <option value="REQUIRES_REVIEW">Requires review</option>
            </select>
            <input type="text" placeholder="Reason" bind:value={payoutReason} />
            <button onclick={() => updatePayoutStatus(req)}>Update</button>
          </div>
        {/if}

        {#if req.status === 'PURCHASE_PENDING_PROOF' && (req.selected_recipient_id === me?.id || isAdmin())}
          <div class="actions">
            <input type="file" id="proof-{req.id}" accept="image/*,application/pdf" />
            <button onclick={() => uploadProof(req)}>Upload proof</button>
            <button onclick={() => complete(req)}>Mark completed</button>
          </div>
        {/if}

        {#if req.payout_status && req.payout_status !== 'NOT_STARTED'}
          <p class="meta">Payout: {req.payout_status}</p>
        {/if}
      </li>
    {/each}
  </ul>
</section>

<style>
  .requests {
    padding: 1rem;
  }
  h1, h2 {
    font-size: 1.25rem;
    margin-top: 1.5rem;
  }
  form {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-bottom: 1.5rem;
  }
  label {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  input, textarea, select {
    padding: 0.5rem;
    border: 1px solid #555;
    background: #222;
    color: #eee;
    border-radius: 0.25rem;
  }
  button {
    padding: 0.5rem 1rem;
    background: #2a5;
    color: #000;
    border: none;
    border-radius: 0.25rem;
    cursor: pointer;
  }
  .reject {
    background: #a2f;
    color: #fff;
  }
  .danger {
    background: #a33;
    color: #fff;
  }
  ul {
    list-style: none;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  li {
    background: #1a1a1a;
    padding: 1rem;
    border-radius: 0.5rem;
  }
  .top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
  }
  .status {
    font-size: 0.75rem;
    padding: 0.2rem 0.5rem;
    border-radius: 999px;
    color: #fff;
  }
  .amount {
    font-size: 1.1rem;
    font-weight: 600;
    margin: 0.25rem 0;
  }
  .desc, .meta {
    color: #bbb;
    margin: 0.25rem 0;
  }
  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-top: 0.75rem;
    align-items: center;
  }
</style>
