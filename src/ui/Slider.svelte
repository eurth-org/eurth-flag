<script lang="ts">
  import { niceWatcher } from '@eurth/style';

  // A number as a slider with its value beside it, editable either way.
  let {
    value,
    label,
    min,
    max,
    step = 1,
    unit = '',
    onchange,
  }: { value: number; label: string; min: number; max: number; step?: number; unit?: string; onchange: (value: number) => void } = $props();

  const id = $props.id();
  const fill = $derived(Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100)));
  let range: HTMLInputElement | undefined = $state();

  function set(raw: string) {
    const n = Number(raw);
    if (raw !== '' && Number.isFinite(n)) onchange(n);
  }

  // The suite's wink: "Nice." when a number settles on 69.
  const watch = niceWatcher();
  $effect(() => watch(value, () => range));
</script>

<div class="room">
<div class="slider">
  <label class="eu-label" for="{id}-range">{label}</label>
  <input bind:this={range} id="{id}-range" class="eu-range" type="range" {min} {max} {step} {value} style:--fill="{fill}%" oninput={(e) => set(e.currentTarget.value)} />
  <span class="number">
    <input class="eu-input eu-input--data" type="number" {step} {value} aria-label="{label}{unit ? ` (${unit})` : ''}, as a number" onchange={(e) => set(e.currentTarget.value)} />
    <span class="unit eu-help" aria-hidden="true">{unit}</span>
  </span>
</div>
</div>

<style>
  .room {
    container-type: inline-size;
  }

  .slider {
    display: grid;
    grid-template-columns: calc(2 * var(--size-target)) minmax(0, 1fr) auto;
    align-items: center;
    gap: var(--space-1) var(--space-3);
  }

  .eu-label {
    color: var(--ink-muted);
  }

  .number {
    display: flex;
    align-items: center;
    gap: var(--space-1);
  }

  .number input {
    width: calc(2 * var(--size-target));
    text-align: right;
  }

  .unit {
    width: var(--space-4);
  }

  /* Where there's little room, the name gets a line of its own. */
  @container (max-width: 400px) {
    .slider {
      grid-template-columns: minmax(0, 1fr) auto;
    }

    .eu-label {
      grid-column: 1 / -1;
    }
  }
</style>
