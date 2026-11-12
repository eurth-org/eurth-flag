<script lang="ts">
  import { tick } from 'svelte';
  import { movable, type Flag } from '../flag/model';
  import { flagSize, flagSvg } from '../flag/render';

  // The flag itself. In advanced mode it is also where layers are picked and moved: click one to
  // select it, drag it, or nudge it with the arrow keys (Shift for bigger steps).
  let {
    flag,
    title,
    desc,
    editable = false,
    selected = $bindable(null),
    guides = false,
    snap = true,
    ondelete,
  }: {
    flag: Flag;
    title: string;
    desc: string;
    editable?: boolean;
    selected?: string | null;
    guides?: boolean;
    snap?: boolean;
    ondelete?: (id: string) => void;
  } = $props();

  const size = $derived(flagSize(flag));
  const svg = $derived(flagSvg(flag, { ids: true, fluid: true, clipId: 'clip-main', title, desc }));

  let stage: HTMLDivElement;
  let box = $state<{ x: number; y: number; width: number; height: number } | null>(null);
  let drag: { id: string; px: number; py: number; x: number; y: number; moved: boolean } | null = null;
  let dragging = $state(false);

  // The dashed box around the selected layer, measured from what was actually drawn.
  $effect(() => {
    void svg;
    const id = editable ? selected : null;
    if (!id) {
      box = null;
      return;
    }
    tick().then(() => {
      const el = stage?.querySelector<SVGGraphicsElement>(`[data-id="${CSS.escape(id)}"]`);
      if (!el) {
        box = null;
        return;
      }
      const b = el.getBBox();
      box = { x: b.x, y: b.y, width: b.width, height: b.height };
    });
  });

  const layer = (id: string | null) => flag.overlays.find((o) => o.id === id);
  const step = (value: number) => (snap ? Math.round(value) : Math.round(value * 10) / 10);

  function down(event: PointerEvent) {
    if (!editable) return;
    const id = (event.target as Element).closest('[data-id]')?.getAttribute('data-id') ?? null;
    selected = id;
    const o = layer(id);
    if (!o || !movable(o.type)) return;
    drag = { id: o.id, px: event.clientX, py: event.clientY, x: o.x ?? 50, y: o.y ?? 50, moved: false };
    stage.setPointerCapture(event.pointerId);
  }

  function move(event: PointerEvent) {
    if (!drag) return;
    const o = layer(drag.id);
    if (!o) return;
    const rect = stage.getBoundingClientRect();
    const dx = ((event.clientX - drag.px) / rect.width) * 100;
    const dy = ((event.clientY - drag.py) / rect.height) * 100;
    if (!drag.moved && Math.hypot(event.clientX - drag.px, event.clientY - drag.py) < 3) return;
    drag.moved = true;
    dragging = true;
    // Bars move one way only: the other number isn't theirs.
    if (o.x !== undefined) o.x = Math.min(150, Math.max(-50, step(drag.x + dx)));
    if (o.y !== undefined) o.y = Math.min(150, Math.max(-50, step(drag.y + dy)));
  }

  function up(event: PointerEvent) {
    if (drag) stage.releasePointerCapture(event.pointerId);
    drag = null;
    dragging = false;
  }

  function keys(event: KeyboardEvent) {
    if (!editable || !selected) return;
    const o = layer(selected);
    if (!o) return;
    if (event.key === 'Escape') {
      selected = null;
      return;
    }
    if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault();
      ondelete?.(o.id);
      return;
    }
    const by = event.shiftKey ? 5 : 1;
    const moves: Record<string, [number, number]> = { ArrowLeft: [-by, 0], ArrowRight: [by, 0], ArrowUp: [0, -by], ArrowDown: [0, by] };
    const m = moves[event.key];
    if (!m || !movable(o.type)) return;
    event.preventDefault();
    if (o.x !== undefined) o.x = Math.min(150, Math.max(-50, o.x + m[0]));
    if (o.y !== undefined) o.y = Math.min(150, Math.max(-50, o.y + m[1]));
  }
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div
  class="stage"
  class:editable
  class:dragging
  bind:this={stage}
  style:aspect-ratio="{size.W} / {size.H}"
  style:--ratio={size.W / size.H}
  role={editable ? 'application' : undefined}
  aria-label={editable ? 'The flag. Click a layer to select it, drag to move it, or use the arrow keys.' : undefined}
  tabindex={editable ? 0 : undefined}
  onpointerdown={down}
  onpointermove={move}
  onpointerup={up}
  onpointercancel={up}
  onkeydown={keys}
>
  {@html svg}
  {#if editable && (guides || box)}
    <svg class="marks" viewBox="0 0 {size.W} {size.H}" aria-hidden="true">
      {#if guides}
        <g class="guides">
          <path d="M{size.W / 2} 0V{size.H}M0 {size.H / 2}H{size.W}" />
          <path class="thirds" d="M{size.W / 3} 0V{size.H}M{(size.W * 2) / 3} 0V{size.H}M0 {size.H / 3}H{size.W}M0 {(size.H * 2) / 3}H{size.W}" />
        </g>
      {/if}
      {#if box}
        <rect class="halo" x={box.x - 4} y={box.y - 4} width={box.width + 8} height={box.height + 8} />
        <rect class="box" x={box.x - 4} y={box.y - 4} width={box.width + 8} height={box.height + 8} />
      {/if}
    </svg>
  {/if}
</div>

<style>
  .stage {
    position: relative;
    width: 100%;
    /* Never taller than the room it's given (--stage-h), whatever the proportions. */
    max-width: calc(var(--stage-h, 62vh) * var(--ratio));
    margin: 0 auto;
    overflow: hidden;
    border-radius: var(--radius-sm);
    /* A thin edge, so a white flag shows on a white page. */
    box-shadow:
      0 0 0 1px var(--line-strong),
      0 6px 20px rgb(0 0 0 / 0.18);
    line-height: 0;
    touch-action: pan-y;
  }

  .stage :global(svg) {
    display: block;
    width: 100%;
    height: 100%;
  }

  .editable {
    cursor: default;
    touch-action: none;
  }

  .editable :global([data-id]) {
    cursor: grab;
  }

  .dragging,
  .dragging :global([data-id]) {
    cursor: grabbing;
  }

  .marks {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }

  .box,
  .halo {
    fill: none;
    vector-effect: non-scaling-stroke;
  }

  /* Dark dashes over a white line: seen on any colour. */
  .halo {
    stroke: #ffffff;
    stroke-width: 3;
  }

  .box {
    stroke: #002b36;
    stroke-width: 1.5;
    stroke-dasharray: 6 4;
  }

  .guides path {
    fill: none;
    stroke: #ffffff;
    stroke-width: 1;
    vector-effect: non-scaling-stroke;
    mix-blend-mode: difference;
  }

  .guides .thirds {
    stroke-dasharray: 3 5;
    opacity: 0.7;
  }
</style>
