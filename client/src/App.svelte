<script>
  import Members from './pages/Members.svelte'
  import Inflows from './pages/Inflows.svelte'

  let page = $state('home')
</script>

<main>
  <nav>
    <button onclick={() => page = 'home'}>Home</button>
    <button onclick={() => page = 'members'}>Members</button>
    <button onclick={() => page = 'inflows'}>Money In</button>
  </nav>

  {#if page === 'home'}
    <section class="home">
      <h1>TelAviv2030</h1>
      <p>Trust is the foundation. Software is the accountability layer.</p>
    </section>
  {:else if page === 'members'}
    <Members />
  {:else if page === 'inflows'}
    <Inflows />
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
