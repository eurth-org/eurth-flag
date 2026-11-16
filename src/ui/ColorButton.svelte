<script lang="ts">
  import { colorName } from '../flag/colors';
  import Swatches from './Swatches.svelte';

  // A colour as a small button; pressing it opens the palette beneath. Used where rows of
  // swatches would take too much room: band lists and layers.
  let { value, label, name, onchange }: { value: string; label: string; name: string; onchange: (color: string) => void } = $props();

  let open = $state(false);
  let root: HTMLElement;

  function outside(event: Event) {
    if (open && !root.contains(event.target as Node)) open = false;
  }
</script>

<svelte:window onpointerdown={outside} onkeydown={(e) => e.key === 'Escape' && (open = false)} />

<span class="color-button" bind:this={root}>
  <button
    type="button"
    class="chip"
    style:background={value}
    aria-label="{label}: {colorName(value)}. Change colour"
    aria-expanded={open}
    title="{label}: {colorName(value)}"
    onclick={() => (open = !open)}
  ></button>
  {#if open}
    <div class="popover">
      <Swatches {value} {label} {name} {onchange} />
    </div>
  {/if}
</span>

<style>
  .color-button {
    position: relative;
    display: inline-flex;
  }

  .chip {
    width: 30px;
    height: 30px;
    padding: 0;
    border: 0;
    border-radius: var(--radius-control);
    box-shadow: inset 0 0 0 1px var(--line-strong);
    cursor: pointer;
  }

  .chip:hover {
    box-shadow:
      inset 0 0 0 1px var(--line-strong),
      0 0 0 2px var(--surface-raised),
      0 0 0 4px var(--selected);
  }

  .popover {
    position: absolute;
    top: calc(100% + 6px);
    left: 0;
    z-index: 10;
    width: min(280px, 80vw);
    padding: var(--space-3);
    border: 1px solid var(--line-strong);
    border-radius: var(--radius-panel);
    background: var(--surface);
    box-shadow: 0 6px 24px rgb(0 0 0 / 0.25);
  }
</style>
