<script>
  import { onMount } from 'svelte'
  import { getJson, postJson, patchJson } from '../lib/api.js'

  let me = $state(null)
  let plans = $state([])
  let name = $state('')
  let description = $state('')
  let targetAmount = $state('')
  let targetDate = $state('')
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
    plans = await getJson('/plans')
  }

  function toRappen(v) {
    return Math.round(parseFloat(v) * 100)
  }

  function formatChf(rappen) {
    return (rappen / 100).toFixed(2)
  }

  function pct(current, target) {
    if (!target) return 0
    return Math.min(100, Math.round((current / target) * 100))
  }

  async function submitPlan() {
    try {
      await postJson('/plans', {
        name,
        description,
        target_amount: targetAmount ? toRappen(targetAmount) : null,
        target_date: targetDate || null,
      })
      name = ''
      description = ''
      targetAmount = ''
      targetDate = ''
      await load()
    } catch (err) {
      error = err.message
    }
  }

  async function complete(plan) {
    try {
      await patchJson(`/plans/${plan.id}`, { status: 'COMPLETED' })
      await load()
    } catch (err) {
      error = err.message
    }
  }

  function isTelAviver() {
    return me?.community_status === 'TELAVIVER'
  }
</script>

<section class="plans">
  <h1>Plans</h1>
  {#if error}
    <p class="error">{error}</p>
  {/if}

  {#if isTelAviver()}
    <form onsubmit={(e) => { e.preventDefault(); submitPlan() }}>
      <h2>New Plan</h2>
      <label>
        Name
        <input type="text" bind:value={name} required />
      </label>
      <label>
        Description
        <textarea bind:value={description} rows="2"></textarea>
      </label>
      <label>
        Target amount (CHF)
        <input type="number" step="0.01" min="0" bind:value={targetAmount} />
      </label>
      <label>
        Target date
        <input type="date" bind:value={targetDate} />
      </label>
      <button type="submit">Create Plan</button>
    </form>
  {/if}

  <ul>
    {#each plans as plan (plan.id)}
      <li>
        <div class="top">
          <strong>{plan.name}</strong>
          <span class="status">{plan.status}</span>
        </div>
        {#if plan.description}
          <p class="desc">{plan.description}</p>
        {/if}
        {#if plan.target_amount}
          <div class="progress">
            <div class="bar" style="width: {pct(plan.current_amount, plan.target_amount)}%"></div>
          </div>
          <p class="meta">
            CHF {formatChf(plan.current_amount)} / CHF {formatChf(plan.target_amount)} ({pct(plan.current_amount, plan.target_amount)}%)
          </p>
        {/if}
        {#if plan.target_date}
          <p class="meta">Target: {new Date(plan.target_date * 1000).toLocaleDateString()}</p>
        {/if}
        {#if isTelAviver() && plan.status === 'ACTIVE'}
          <button onclick={() => complete(plan)}>Mark completed</button>
        {/if}
      </li>
    {/each}
  </ul>
</section>

<style>
  .plans {
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
    background: #444;
  }
  .desc {
    color: #bbb;
    margin: 0.25rem 0 0.75rem;
  }
  .progress {
    background: #333;
    border-radius: 999px;
    height: 0.75rem;
    overflow: hidden;
    margin-bottom: 0.5rem;
  }
  .bar {
    background: #a2f;
    height: 100%;
    border-radius: 999px;
  }
  .meta {
    color: #aaa;
    font-size: 0.875rem;
    margin: 0.25rem 0;
  }
</style>
