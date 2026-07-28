<script>
  import { onMount } from 'svelte'
  import { getJson } from '../lib/api.js'

  let balance = $state(null)
  let requests = $state([])
  let plans = $state([])
  let error = $state('')

  onMount(async () => {
    try {
      ;[balance, requests, plans] = await Promise.all([
        getJson('/balance').catch(() => null),
        getJson('/requests').catch(() => []),
        getJson('/plans').catch(() => []),
      ])
    } catch (err) {
      error = err.message
    }
  })

  function formatChf(rappen) {
    return (rappen / 100).toFixed(2)
  }

  function pct(current, target) {
    return target ? Math.min(100, Math.round((current / target) * 100)) : 0
  }

  function pendingRequests() {
    return requests.filter(r => r.status === 'PENDING_VOTE')
  }

  function lockedRequests() {
    return requests.filter(r => ['APPROVED_COOLDOWN', 'LOCKED', 'RECIPIENT_SELECTION', 'RECIPIENT_ACCEPTANCE', 'PAYOUT_PENDING'].includes(r.status))
  }
</script>

<section class="home">
  <h1>TelAviv2030</h1>
  <p class="tagline">Trust is the foundation. Software is the accountability layer.</p>

  {#if error}
    <p class="error">{error}</p>
  {/if}

  {#if balance}
    <div class="card balance-card">
      <h2>Available Balance</h2>
      <p class="big">CHF {formatChf(balance.available)}</p>
      <p class="small">Pending contributions: CHF {formatChf(balance.contributions_pending)}</p>
      <p class="small">Pending donations: CHF {formatChf(balance.donations_pending)}</p>
    </div>
  {/if}

  <div class="grid">
    <div class="card">
      <h2>Active Requests</h2>
      {#if pendingRequests().length === 0 && lockedRequests().length === 0}
        <p class="empty">No active requests right now.</p>
      {/if}
      {#if pendingRequests().length > 0}
        <ul>
          {#each pendingRequests() as req (req.id)}
            <li>
              <strong>{req.title}</strong>
              <span>CHF {formatChf(req.amount)}</span>
              <span class="pill vote">{req.vote_summary.approve}/{req.vote_summary.total}</span>
            </li>
          {/each}
        </ul>
      {/if}
      {#if lockedRequests().length > 0}
        <ul>
          {#each lockedRequests() as req (req.id)}
            <li>
              <strong>{req.title}</strong>
              <span>CHF {formatChf(req.amount)}</span>
              <span class="pill {req.status.toLowerCase()}">{req.status.replace('_', ' ')}</span>
            </li>
          {/each}
        </ul>
      {/if}
    </div>

    <div class="card">
      <h2>Plans</h2>
      {#if plans.length === 0}
        <p class="empty">No active plans.</p>
      {:else}
        <ul>
          {#each plans as plan (plan.id)}
            <li>
              <div class="plan-top">
                <strong>{plan.name}</strong>
                <span>{pct(plan.current_amount, plan.target_amount)}%</span>
              </div>
              {#if plan.target_amount}
                <div class="progress">
                  <div class="bar" style="width: {pct(plan.current_amount, plan.target_amount)}%"></div>
                </div>
                <p class="small">CHF {formatChf(plan.current_amount)} / CHF {formatChf(plan.target_amount)}</p>
              {/if}
            </li>
          {/each}
        </ul>
      {/if}
    </div>
  </div>
</section>

<style>
  .home {
    padding: 1rem;
  }
  h1 {
    font-size: 1.75rem;
    margin-bottom: 0.25rem;
  }
  .tagline {
    color: #aaa;
    margin-bottom: 1.5rem;
  }
  .card {
    background: #1a1a1a;
    border-radius: 0.5rem;
    padding: 1rem;
    margin-bottom: 1rem;
  }
  .balance-card h2 {
    margin-top: 0;
  }
  .big {
    font-size: 2rem;
    font-weight: 700;
    margin: 0.5rem 0;
  }
  .small, .empty {
    color: #aaa;
    font-size: 0.875rem;
    margin: 0.25rem 0;
  }
  .grid {
    display: grid;
    gap: 1rem;
    grid-template-columns: 1fr;
  }
  @media (min-width: 640px) {
    .grid {
      grid-template-columns: 1fr 1fr;
    }
  }
  ul {
    list-style: none;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  li {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.5rem;
    padding: 0.5rem;
    background: #252525;
    border-radius: 0.25rem;
  }
  .plan-top {
    display: flex;
    justify-content: space-between;
    width: 100%;
  }
  .progress {
    background: #333;
    border-radius: 999px;
    height: 0.5rem;
    overflow: hidden;
    width: 100%;
    margin: 0.5rem 0;
  }
  .bar {
    background: #a2f;
    height: 100%;
    border-radius: 999px;
  }
  .pill {
    font-size: 0.7rem;
    padding: 0.15rem 0.4rem;
    border-radius: 999px;
    background: #444;
    color: #fff;
  }
  .vote {
    background: #2a5;
    color: #000;
  }
</style>
