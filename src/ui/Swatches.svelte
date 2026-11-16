<script lang="ts">
  import { faCheck, faEyeDropper } from '@fortawesome/free-solid-svg-icons';
  import { cleanColor, colorName, inkOn, palette } from '../flag/colors';
  import Icon from './Icon.svelte';

  // The flag palette as a row of swatches, plus any other colour through the device's own
  // picker. A radio group, so arrow keys move through it and screen readers hear the names.
  let {
    value,
    label,
    name,
    disabled = false,
    onchange,
  }: { value: string; label: string; name: string; disabled?: boolean; onchange: (color: string) => void } = $props();

  const inPalette = $derived(palette.some((p) => p.hex === value));
</script>

<fieldset class="swatches" class:disabled {disabled}>
  <legend>{label}: <span class="current">{colorName(value)}{inPalette ? '' : ` (${value})`}</span></legend>
  <div class="row">
    {#each palette as color (color.hex)}
      <label class="swatch" style:background={color.hex} style:color={inkOn(color.hex)} title={color.name}>
        <input type="radio" {name} value={color.hex} checked={value === color.hex} onchange={() => onchange(color.hex)} />
        <span class="visually-hidden">{color.name}</span>
        {#if value === color.hex}<Icon icon={faCheck} />{/if}
      </label>
    {/each}
    <label class="swatch custom" class:chosen={!inPalette} style:background={inPalette ? undefined : value} style:color={inPalette ? undefined : inkOn(value)} title="Another colour">
      <input type="color" value={value} oninput={(e) => onchange(cleanColor(e.currentTarget.value))} aria-label="{label}: another colour" />
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

  .swatches.disabled {
    opacity: 0.4;
  }

  legend {
    padding: 0;
    margin-bottom: var(--space-1);
    color: var(--ink-muted);
    font-size: 13px;
  }

  .current {
    color: var(--ink);
    font-weight: 600;
  }

  .row {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }

  .swatch {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 26px;
    height: 26px;
    border-radius: var(--radius-control);
    box-shadow: inset 0 0 0 1px var(--line-strong);
    font-size: 12px;
    cursor: pointer;
    transition: transform 0.12s;
  }

  .swatch:hover {
    transform: scale(1.15);
    z-index: 1;
  }

  .swatch input {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    margin: 0;
    padding: 0;
    border: 0;
    opacity: 0;
    cursor: pointer;
  }

  .swatch:has(input:checked),
  .swatch.chosen {
    box-shadow:
      inset 0 0 0 1px var(--line-strong),
      0 0 0 2px var(--surface-raised),
      0 0 0 4px var(--selected);
  }

  .swatch:has(input:focus-visible) {
    outline: 2px solid var(--focus-ring);
    outline-offset: 3px;
  }

  .custom {
    background: var(--button);
    color: var(--ink);
  }

  .disabled .swatch {
    cursor: default;
  }

  @media (prefers-reduced-motion: reduce) {
    .swatch {
      transition: none;
    }

    .swatch:hover {
      transform: none;
    }
  }
</style>
