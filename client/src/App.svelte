<script>
  import Home from './pages/Home.svelte'
  import Members from './pages/Members.svelte'
  import Inflows from './pages/Inflows.svelte'
  import Plans from './pages/Plans.svelte'
  import Requests from './pages/Requests.svelte'
  import Admin from './pages/Admin.svelte'

  let page = $state('home')
</script>

<main>
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
  .home {
    padding: 1rem;
  }
</style>
