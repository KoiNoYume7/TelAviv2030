<script>
  import { onMount } from 'svelte'
  import { Capacitor } from '@capacitor/core'
  import Home from './pages/Home.svelte'
  import Members from './pages/Members.svelte'
  import Inflows from './pages/Inflows.svelte'
  import Plans from './pages/Plans.svelte'
  import Requests from './pages/Requests.svelte'
  import Admin from './pages/Admin.svelte'

  let page = $state('home')
  let updateInfo = $state(null)

  onMount(async () => {
    if (!Capacitor.isNativePlatform()) return
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE || '/api'}/version`, { credentials: 'include' })
      const data = await res.json()
      const current = import.meta.env.VITE_APP_VERSION || '0.1.0'
      if (data.version && data.version !== current && data.apk_url) {
        updateInfo = data
      }
    } catch {
      // offline or server not reachable
    }
  })
</script>

<main>
  {#if updateInfo}
    <div class="update-banner">
      <p>Update available: v{updateInfo.version}</p>
      <a href={updateInfo.apk_url} target="_blank" rel="noopener noreferrer">Download APK</a>
      <button onclick={() => updateInfo = null}>Later</button>
    </div>
  {/if}
  <nav>
    <button onclick={() => page = 'home'}>Home</button>
    <button onclick={() => page = 'members'}>Members</button>
    <button onclick={() => page = 'inflows'}>Money In</button>
    <button onclick={() => page = 'plans'}>Plans</button>
    <button onclick={() => page = 'requests'}>Requests</button>
    <button onclick={() => page = 'admin'}>Admin</button>
  </nav>

  {#if page === 'home'}
    <Home />
  {:else if page === 'members'}
    <Members />
  {:else if page === 'inflows'}
    <Inflows />
  {:else if page === 'plans'}
    <Plans />
  {:else if page === 'requests'}
    <Requests />
  {:else if page === 'admin'}
    <Admin />
  {/if}
</main>

<style>
  :global(body) {
    margin: 0;
    background: #111;
    color: #eee;
    font-family: system-ui, sans-serif;
  }
  .update-banner {
    background: #2a5;
    color: #000;
    padding: 0.75rem 1rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    justify-content: space-between;
  }
  .update-banner a, .update-banner button {
    background: #111;
    color: #2a5;
    padding: 0.4rem 0.75rem;
    border-radius: 0.25rem;
    text-decoration: none;
    border: none;
    cursor: pointer;
  }
  nav {
    display: flex;
    gap: 0.5rem;
    padding: 1rem;
    border-bottom: 1px solid #333;
  }
  button {
    background: transparent;
    color: #eee;
    border: 1px solid #555;
    padding: 0.5rem 1rem;
    border-radius: 0.25rem;
    cursor: pointer;
  }
  button:hover {
    background: #333;
  }
</style>
