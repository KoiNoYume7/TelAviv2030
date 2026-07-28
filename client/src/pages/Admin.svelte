<script>
  import { onMount } from 'svelte'
  import { getJson, postJson, patchJson } from '../lib/api.js'

  let me = $state(null)
  let audit = $state([])
  let diag = $state(null)
  let settings = $state({})
  let error = $state('')

  onMount(async () => {
    try {
      me = await getJson('/me')
      if (!['SYSTEM_ADMIN', 'SYSTEM_OWNER'].includes(me.technical_role)) {
        error = 'Admin access only'
        return
      }
      await load()
    } catch (err) {
      error = err.message
    }
  })

  async function load() {
    diag = await getJson('/admin/diagnostics')
    audit = await getJson('/audit')
    const rows = await getJson('/admin/settings')
    settings = Object.fromEntries(rows.map(r => [r.key, r.value]))
  }

  function isAdmin() {
    return ['SYSTEM_ADMIN', 'SYSTEM_OWNER'].includes(me?.technical_role)
  }

  async function toggle(key) {
    try {
      const next = settings[key] === 'true' ? 'false' : 'true'
      await patchJson(`/admin/settings/${key}`, { value: next })
      await load()
    } catch (err) {
      error = err.message
    }
  }

  async function quickFreeze(type) {
    try {
      await postJson(`/admin/freeze/${type}`, {})
      await load()
    } catch (err) {
      error = err.message
    }
  }

  async function quickUnfreeze(type) {
    try {
      await postJson(`/admin/unfreeze/${type}`, {})
      await load()
    } catch (err) {
      error = err.message
    }
  }

  function formatTime(epoch) {
    return new Date(epoch * 1000).toLocaleString()
  }
</script>

<section class="admin">
  <h1>Admin & Diagnostics</h1>
  {#if error}
    <p class="error">{error}</p>
  {/if}

  {#if isAdmin() && diag}
    <div class="card">
      <h2>Diagnostics</h2>
      <div class="grid">
        <div><strong>{diag.member_count}</strong><span>members</span></div>
        <div><strong>{diag.telaviver_count}</strong><span>TelAvivers</span></div>
        <div><strong>{diag.telavivling_count}</strong><span>TelAvivlings</span></div>
        <div><strong>{diag.request_count}</strong><span>requests</span></div>
        <div><strong>{diag.pending_requests}</strong><span>pending</span></div>
        <div><strong>{diag.completed_requests}</strong><span>completed</span></div>
        <div><strong>{(diag.settled_contributions / 100).toFixed(2)}</strong><span>CHF contributions</span></div>
        <div><strong>{(diag.settled_donations / 100).toFixed(2)}</strong><span>CHF donations</span></div>
        <div><strong>{diag.audit_event_count}</strong><span>audit events</span></div>
      </div>
    </div>

    <div class="card">
      <h2>Emergency Freeze</h2>
      <div class="freeze-grid">
        {#each ['FREEZE_REQUESTS', 'FREEZE_PAYOUTS', 'FREEZE_INFLOWS'] as key (key)}
          <div class="freeze-row">
            <span>{key.replace('FREEZE_', '')}</span>
            <button class={settings[key] === 'true' ? 'danger' : ''} onclick={() => toggle(key)}>
              {settings[key] === 'true' ? 'FROZEN — unfreeze' : 'Freeze'}
            </button>
          </div>
        {/each}
      </div>
    </div>

    <div class="card">
      <h2>Recent Audit Log</h2>
      <ul>
        {#each audit as event (event.id)}
          <li>
            <span class="time">{formatTime(event.created_at)}</span>
            <span class="type">{event.event_type}</span>
            <span class="actor">{event.actor_id || 'system'}</span>
            {#if event.payload}
              <pre>{JSON.stringify(JSON.parse(event.payload), null, 2)}</pre>
            {/if}
          </li>
        {/each}
      </ul>
    </div>
  {/if}
</section>

<style>
  .admin {
    padding: 1rem;
  }
  h1, h2 {
    font-size: 1.25rem;
    margin-top: 1.5rem;
  }
  .card {
    background: #1a1a1a;
    border-radius: 0.5rem;
    padding: 1rem;
    margin-bottom: 1rem;
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.75rem;
  }
  .grid div {
    display: flex;
    flex-direction: column;
    background: #252525;
    padding: 0.75rem;
    border-radius: 0.25rem;
  }
  .grid strong {
    font-size: 1.25rem;
  }
  .grid span {
    color: #aaa;
    font-size: 0.75rem;
  }
  .freeze-grid {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  .freeze-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem;
    background: #252525;
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
  .danger {
    background: #a33;
    color: #fff;
  }
  ul {
    list-style: none;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  li {
    background: #252525;
    padding: 0.75rem;
    border-radius: 0.25rem;
  }
  .time {
    color: #888;
    font-size: 0.75rem;
    display: block;
  }
  .type {
    font-weight: 600;
    margin-right: 0.5rem;
  }
  .actor {
    color: #aaa;
    font-size: 0.875rem;
  }
  pre {
    margin: 0.5rem 0 0;
    padding: 0.5rem;
    background: #111;
    border-radius: 0.25rem;
    font-size: 0.75rem;
    overflow-x: auto;
  }
</style>
