<script>
  import { onMount } from 'svelte'
  import { getJson, postJson, patchJson } from '../lib/api.js'

  let me = $state(null)
  let balance = $state(null)
  let contributions = $state([])
  let donations = $state([])
  let amount = $state('')
  let note = $state('')
  let error = $state('')
  let activeTab = $state('inflows')

  onMount(async () => {
    try {
      me = await getJson('/me')
      await load()
    } catch (err) {
      error = err.message
    }
  })

  async function load() {
    const status = me?.community_status
    if (status !== 'TELAVIVLING') {
      balance = await getJson('/balance').catch(() => null)
      contributions = await getJson('/contributions').catch(() => [])
    }
    donations = await getJson('/donations').catch(() => [])
  }

  function toRappen(v) {
    return Math.round(parseFloat(v) * 100)
  }

  function formatChf(rappen) {
    return (rappen / 100).toFixed(2)
  }

  async function submitContribution() {
    try {
      await postJson('/contributions', { amount: toRappen(amount), note })
      amount = ''
      note = ''
      await load()
    } catch (err) {
      error = err.message
    }
  }

  async function submitDonation() {
    try {
      await postJson('/donations', { amount: toRappen(amount), note })
      amount = ''
      note = ''
      await load()
    } catch (err) {
      error = err.message
    }
  }

  async function settle(item, type) {
    try {
      await patchJson(`/${type}s/${item.id}`, { status: 'SETTLED' })
      await load()
    } catch (err) {
      error = err.message
    }
  }

  function canAdd() {
    if (!me) return false
    return ['TELAVIVER', 'TELAVIVLING'].includes(me.community_status)
  }

  function isTelAviver() {
    return me?.community_status === 'TELAVIVER'
  }
</script>

<section class="inflows">
  <h1>Money In</h1>
  {#if error}
    <p class="error">{error}</p>
  {/if}

  {#if balance}
    <div class="balance">
      <h2>Balance</h2>
      <p class="big">CHF {formatChf(balance.available)}</p>
      <p class="small">Pending contributions: CHF {formatChf(balance.contributions_pending)}</p>
      <p class="small">Pending donations: CHF {formatChf(balance.donations_pending)}</p>
    </div>
  {/if}

  {#if canAdd()}
    <form onsubmit={(e) => { e.preventDefault(); isTelAviver() ? submitContribution() : submitDonation() }}>
      <h2>{isTelAviver() ? 'Add Contribution' : 'Add Donation'}</h2>
      <label>
        Amount (CHF)
        <input type="number" step="0.01" min="0.01" bind:value={amount} required />
      </label>
      <label>
        Note
        <input type="text" bind:value={note} />
      </label>
      <button type="submit">Submit</button>
    </form>
  {/if}

  {#if isTelAviver()}
    <h2>Contributions</h2>
    <ul>
      {#each contributions as c (c.id)}
        <li>
          <span>CHF {formatChf(c.amount)}</span>
          <span class="status">{c.status}</span>
          {#if c.status === 'PENDING'}
            <button onclick={() => settle(c, 'contribution')}>Settle</button>
          {/if}
        </li>
      {/each}
    </ul>
  {/if}

  <h2>Donations</h2>
  <ul>
    {#each donations as d (d.id)}
      <li>
        <span>CHF {formatChf(d.amount)}</span>
        <span class="status">{d.status}</span>
        {#if isTelAviver() && d.status === 'PENDING'}
          <button onclick={() => settle(d, 'donation')}>Settle</button>
        {/if}
      </li>
    {/each}
  </ul>
</section>

<style>
  .inflows {
    padding: 1rem;
  }
  h1, h2 {
    font-size: 1.25rem;
    margin-top: 1.5rem;
  }
  .balance {
    background: #1a1a1a;
    padding: 1rem;
    border-radius: 0.5rem;
    margin-bottom: 1rem;
  }
  .big {
    font-size: 2rem;
    font-weight: 700;
  }
  .small {
    color: #aaa;
  }
  form {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }
  label {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  input {
    padding: 0.5rem;
    border: 1px solid #555;
    background: #222;
    color: #eee;
    border-radius: 0.25rem;
  }
  button {
    align-self: flex-start;
    padding: 0.5rem 1rem;
    background: #2a5;
    color: #000;
    border: none;
    border-radius: 0.25rem;
    cursor: pointer;
  }
  ul {
    list-style: none;
    padding: 0;
  }
  li {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem;
    border-bottom: 1px solid #333;
  }
  .status {
    font-size: 0.75rem;
    padding: 0.2rem 0.5rem;
    border-radius: 999px;
    background: #444;
  }
</style>
