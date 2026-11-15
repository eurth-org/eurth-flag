<script lang="ts">
  import { faCheck, faEyeDropper } from '@fortawesome/free-solid-svg-icons';
  import Icon from '@eurth/style/components/Icon.svelte';
  import { cleanColor, colorName, inkOn, palette } from '../flag/colors';

  // The flag palette as a grid of swatches, plus any other colour through the device's own
  // picker. A radio group, so arrow keys move through it and screen readers hear the names.
  // The colours are the tool's data: each swatch is filled with the colour it stands for.
  let { value, label, name, onchange }: { value: string; label: string; name: string; onchange: (color: string) => void } = $props();

  const inPalette = $derived(palette.some((p) => p.hex === value));
</script>

<fieldset class="swatches">
  <legend class="eu-label">{label}: {colorName(value)}{inPalette ? '' : ` (${value})`}</legend>
  <div class="grid">
    {#each palette as color (color.hex)}
      <label class="swatch" style:background={color.hex} style:color={inkOn(color.hex)} title={color.name}>
        <input type="radio" {name} value={color.hex} checked={value === color.hex} onchange={() => onchange(color.hex)} />
        <span class="eu-visually-hidden">{color.name}</span>
        {#if value === color.hex}<Icon icon={faCheck} />{/if}
      </label>
    {/each}
    <label class="swatch custom" class:chosen={!inPalette} style:background={inPalette ? undefined : value} style:color={inPalette ? undefined : inkOn(value)} title="Another colour">
      <input type="color" {value} oninput={(e) => onchange(cleanColor(e.currentTarget.value))} aria-label="{label}: another colour" />
      <Icon icon={faEyeDropper} />
    </label>
  </div>
</fieldset>

<style>
  .swatches {
    min-width: 0;
    margin: 0;
    padding: 0;
    border: 0;
  }

  legend {
    margin-bottom: var(--space-2);
    padding: 0;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, var(--size-target));
    gap: var(--space-1);
  }

  .swatch {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: var(--size-target);
    height: var(--size-target);
    border: 1px solid var(--line-strong);
    border-radius: var(--radius-sm);
    cursor: pointer;
  }

  .swatch:hover {
    border-color: var(--ink);
  }

  /* The input covers its swatch, edge included: the whole square is what is pressed. */
  .swatch input {
    position: absolute;
    inset: -1px;
    width: calc(100% + 2px);
    height: calc(100% + 2px);
    margin: 0;
    padding: 0;
    border: 0;
    opacity: 0;
    cursor: pointer;
  }

  /* The chosen colour: a tick on it, and a ring around it. */
  .swatch:has(input:checked),
  .swatch.chosen {
    box-shadow:
      0 0 0 var(--size-ring) var(--surface),
      0 0 0 calc(2 * var(--size-ring)) var(--selected);
  }

  .swatch:has(input:focus-visible) {
    outline: var(--size-ring) solid var(--focus-ring);
    outline-offset: calc(2 * var(--size-ring));
  }

  .custom {
    background: var(--surface-raised);
    color: var(--ink);
  }
</style>
