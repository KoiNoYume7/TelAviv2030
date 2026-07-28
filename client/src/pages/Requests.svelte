<script>
  import { onMount } from 'svelte'
  import { getJson, postJson, patchJson, del } from '../lib/api.js'

  let me = $state(null)
  let requests = $state([])
  let title = $state('')
  let description = $state('')
  let amount = $state('')
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

  function statusColor(status) {
    return {
      PENDING_VOTE: '#a2f',
      APPROVED_COOLDOWN: '#fa2',
      LOCKED: '#2a5',
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
        <p class="meta">
          Votes: {req.vote_summary.approve} / {req.vote_summary.total} approve,
          {req.vote_summary.reject} reject,
          {req.vote_summary.missing} missing
        </p>
        {#if req.status === 'PENDING_VOTE' && isTelAviver()}
          <div class="actions">
            <button onclick={() => vote(req, 'APPROVE')}>Approve</button>
            <button class="reject" onclick={() => vote(req, 'REJECT')}>Reject</button>
            {#if req.created_by === me?.id}
              <button class="danger" onclick={() => cancel(req)}>Cancel</button>
            {/if}
          </div>
        {/if}
        {#if req.cooling_off_until && req.status === 'APPROVED_COOLDOWN'}
          <p class="meta">Cooling-off until {new Date(req.cooling_off_until * 1000).toLocaleString()}</p>
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
  input, textarea {
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
    gap: 0.5rem;
    margin-top: 0.75rem;
  }
</style>
