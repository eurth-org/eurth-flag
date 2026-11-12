<script lang="ts">
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

  const fill = $derived(Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100)));

  function set(raw: string) {
    const n = Number(raw);
    if (raw !== '' && Number.isFinite(n)) onchange(n);
  }
</script>

<label class="slider">
  <span class="name">{label}</span>
  <input class="range" type="range" {min} {max} {step} {value} style:--fill="{fill}%" oninput={(e) => set(e.currentTarget.value)} />
  <span class="number">
    <input type="number" {step} {value} aria-label="{label}{unit ? ` (${unit})` : ''}" onchange={(e) => set(e.currentTarget.value)} />
    <span class="unit" aria-hidden="true">{unit}</span>
  </span>
</label>

<style>
  .slider {
    display: grid;
    grid-template-columns: 96px minmax(0, 1fr) 78px;
    align-items: center;
    gap: var(--space-2);
  }

  .name {
    color: var(--ink-muted);
    font-size: 13px;
  }

  .number {
    display: flex;
    align-items: center;
    gap: 2px;
  }

  .number input {
    width: 58px;
    padding: 2px 4px;
    border: 1px solid var(--line-strong);
    border-radius: var(--radius-control);
    background: var(--surface);
    text-align: right;
    font-variant-numeric: tabular-nums;
  }

  .unit {
    width: 14px;
    color: var(--ink-muted);
    font-size: 12px;
  }

  @media (max-width: 420px) {
    .slider {
      grid-template-columns: 72px minmax(0, 1fr) 70px;
    }
  }
</style>
