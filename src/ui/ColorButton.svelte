<script lang="ts">
  import { colorName } from '../flag/colors';
  import Swatches from './Swatches.svelte';

  // A colour as a button; pressing it opens the palette beneath. With `named`, the button says
  // what the colour is for and what it is called; without, it is a square of the colour alone,
  // for rows where the words beside it already say which part it paints.
  let {
    value,
    label,
    name,
    named = false,
    disabled = false,
    onchange,
  }: { value: string; label: string; name: string; named?: boolean; disabled?: boolean; onchange: (color: string) => void } = $props();

  let open = $state(false);
  let root: HTMLElement;

  function outside(event: Event) {
    if (open && !root.contains(event.target as Node)) open = false;
  }

  $effect(() => {
    if (disabled) open = false;
  });
</script>

<svelte:window onpointerdown={outside} onkeydown={(e) => e.key === 'Escape' && (open = false)} />

<span class="color-button" bind:this={root}>
  <button
    type="button"
    class="eu-btn"
    class:eu-btn--icon={!named}
    aria-label="{label}: {colorName(value)}. Change colour"
    aria-expanded={open}
    title={named ? undefined : `${label}: ${colorName(value)}`}
    {disabled}
    onclick={() => (open = !open)}
  >
    <span class="chip" style:background={value}></span>
    {#if named}<span>{label}: {colorName(value)}</span>{/if}
  </button>
  {#if open}
    <div class="popover">
      <Swatches {value} {label} {name} {onchange} />
    </div>
  {/if}
</span>

<style>
  /* The palette opens under the button, or under the row of buttons it sits in: a row sets
     --color-anchor to static and is itself the place the palette hangs from. */
  .color-button {
    position: var(--color-anchor, relative);
    display: inline-flex;
  }

  .chip {
    flex: none;
    width: var(--space-6);
    height: var(--space-6);
    border: 1px solid var(--line-strong);
    border-radius: var(--radius-sm);
  }

  .popover {
    position: absolute;
    top: calc(100% + var(--space-2));
    left: 0;
    z-index: 10;
    width: calc(6 * var(--size-target) + 5 * var(--space-1) + 2 * var(--space-3) + 2px);
    max-width: calc(100vw - 2 * var(--space-4));
    padding: var(--space-3);
    border: 1px solid var(--line-strong);
    border-radius: var(--radius-md);
    background: var(--surface);
  }
</style>
