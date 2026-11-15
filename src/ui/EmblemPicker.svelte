<script lang="ts">
  import { faCheck } from '@fortawesome/free-solid-svg-icons';
  import Icon from '@eurth/style/components/Icon.svelte';
  import { emblemGroups, emblems } from '../flag/emblems';

  // The emblem library as a searchable grid of buttons.
  let { current = '', onpick }: { current?: string; onpick: (id: string) => void } = $props();

  const id = $props.id();
  let query = $state('');
  const found = $derived.by(() => {
    const q = query.trim().toLowerCase();
    return q ? emblems.filter((e) => e.name.toLowerCase().includes(q) || e.group.toLowerCase().includes(q)) : emblems;
  });
</script>

<div class="eu-field">
  <label class="eu-visually-hidden" for="{id}-search">Search the emblems</label>
  <input id="{id}-search" class="eu-input" type="search" placeholder="Search {emblems.length} emblems: dragon, wheat, tower…" bind:value={query} />
</div>
<div class="fw-library">
  {#each emblemGroups as group (group)}
    {@const list = found.filter((e) => e.group === group)}
    {#if list.length}
      <p class="eu-kicker">{group}</p>
      <div class="fw-tiles fw-tiles--small">
        {#each list as e (e.id)}
          <button type="button" class="fw-tile" title={e.name} aria-label={e.name} aria-pressed={current === e.id} onclick={() => onpick(e.id)}>
            <svg viewBox="0 0 {e.width} {e.height}" aria-hidden="true" focusable="false"><path fill="currentColor" d={e.path} /></svg>
            <span class="fw-tick"><Icon icon={faCheck} /></span>
          </button>
        {/each}
      </div>
    {/if}
  {/each}
  {#if !found.length}
    <p class="eu-help">No emblem by that name.</p>
  {/if}
</div>
