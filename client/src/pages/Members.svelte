<script>
  import { onMount } from 'svelte'
  import { getJson } from '../lib/api.js'

  let members = $state([])
  let error = $state('')

  onMount(async () => {
    try {
      members = await getJson('/members')
    } catch (err) {
      error = err.message
    }
  })

  function statusClass(status) {
    if (status.startsWith('RETIRED')) return 'retired'
    if (status === 'TELAVIVLING') return 'telavivling'
    return 'telaviver'
  }
</script>

<section class="members">
  <h1>Members</h1>
  {#if error}
    <p class="error">{error}</p>
  {/if}
  <ul>
    {#each members as member (member.id)}
      <li class={statusClass(member.community_status)}>
        <span class="name">{member.name}</span>
        <span class="status">{member.community_status}</span>
        {#if member.technical_role !== 'MEMBER'}
          <span class="role">{member.technical_role}</span>
        {/if}
      </li>
    {/each}
  </ul>
</section>

<style>
  .members {
    padding: 1rem;
  }
  h1 {
    font-size: 1.5rem;
    margin-bottom: 1rem;
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
  .name {
    font-weight: 600;
  }
  .status, .role {
    font-size: 0.75rem;
    padding: 0.2rem 0.5rem;
    border-radius: 999px;
    background: #444;
  }
  .telaviver .status {
    background: #2a5;
    color: #000;
  }
  .telavivling .status {
    background: #a2f;
    color: #fff;
  }
  .retired .status {
    background: #666;
    color: #ccc;
  }
</style>
