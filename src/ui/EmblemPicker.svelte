<script lang="ts">
  import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';
  import { emblemGroups, emblems } from '../flag/emblems';
  import Icon from './Icon.svelte';

  // The emblem library as a searchable grid of buttons.
  let { current = '', onpick }: { current?: string; onpick: (id: string) => void } = $props();

  let query = $state('');
  const found = $derived.by(() => {
    const q = query.trim().toLowerCase();
    return q ? emblems.filter((e) => e.name.toLowerCase().includes(q) || e.group.toLowerCase().includes(q)) : emblems;
  });
</script>

<label class="search">
  <Icon icon={faMagnifyingGlass} />
  <span class="visually-hidden">Search the emblems</span>
  <input type="search" placeholder="Search {emblems.length} emblems: dragon, wheat, tower…" bind:value={query} />
</label>
<div class="emblems">
  {#each emblemGroups as group (group)}
    {@const list = found.filter((e) => e.group === group)}
    {#if list.length}
      <p class="group">{group}</p>
      <div class="grid">
        {#each list as e (e.id)}
          <button type="button" class="glyph" class:current={current === e.id} title={e.name} aria-label={e.name} aria-pressed={current === e.id} onclick={() => onpick(e.id)}>
            <svg viewBox="0 0 {e.width} {e.height}" aria-hidden="true" focusable="false"><path fill="currentColor" d={e.path} /></svg>
          </button>
        {/each}
      </div>
    {/if}
  {/each}
  {#if !found.length}
    <p class="group">No emblem by that name.</p>
  {/if}
</div>

<style>
  .search {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    margin: 0 0 var(--space-2);
    padding: 0 var(--space-2);
    border: 1px solid var(--line-strong);
    border-radius: var(--radius-control);
    background: var(--surface);
    color: var(--ink-muted);
  }

  .search:focus-within {
    outline: 2px solid var(--focus-ring);
    outline-offset: 1px;
  }

  .search input {
    flex: 1;
    min-width: 0;
    padding: 6px 0;
    border: 0;
    outline: 0;
    background: none;
  }

  .emblems {
    max-height: 260px;
    overflow-y: auto;
    padding: 3px;
    margin: 0 -3px;
    overscroll-behavior: contain;
  }

  .group {
    margin: var(--space-3) 0 var(--space-1);
    color: var(--ink-muted);
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  .group:first-child {
    margin-top: 0;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(42px, 1fr));
    gap: 6px;
  }

  .glyph {
    display: flex;
    align-items: center;
    justify-content: center;
    aspect-ratio: 1;
    padding: 7px;
    border: 1px solid var(--line);
    border-radius: var(--radius-control);
    background: var(--surface);
    color: var(--ink);
    cursor: pointer;
  }

  .glyph:hover {
    border-color: var(--selected-edge);
    background: var(--hover);
  }

  .glyph.current {
    border-color: var(--selected);
    box-shadow: 0 0 0 2px var(--selected);
  }

  .glyph svg {
    width: 100%;
    height: 100%;
  }
</style>
