<script lang="ts">
  import { faBorderAll, faCheck, faLayerGroup, faMagnifyingGlass, faRulerCombined, faStar } from '@fortawesome/free-solid-svg-icons';
  import { onMount } from 'svelte';
  import { emblemGroups, emblems } from '../flag/emblems';
  import { ratios } from '../flag/model';
  import { flagSvg } from '../flag/render';
  import { divisionPresets, fromSimple, overlayPresets, symbolPresets, type Position, type Scale, type Simple } from '../flag/simple';
  import Icon from './Icon.svelte';
  import Swatches from './Swatches.svelte';

  // Simple mode: four choices, each a grid of small pictures showing this flag with that option.
  let { simple = $bindable() }: { simple: Simple } = $props();

  const thumb = (changes: Partial<Simple>) => flagSvg(fromSimple({ ...simple, ratio: [2, 3], ...changes }), { clipId: 'clip-thumb', fluid: true });
  const uses = $derived(divisionPresets.find((p) => p.id === simple.division)?.uses ?? 3);
  const colorLabels = ['First colour', 'Second colour', 'Third colour'];

  // Drawn symbols, as small pictures on a plain ground.
  const glyph = (id: string) =>
    flagSvg(
      {
        ratio: [1, 1],
        division: { type: 'bands', dir: 'h', bands: [{ color: '#ffffff', weight: 1 }] },
        overlays: fromSimple({ ...simple, ratio: [1, 1], division: 'solid', overlay: 'none', symbol: id, symbolColor: '#000000', position: 'centre', scale: 'l' }).overlays.map((o) => ({
          ...o,
          x: 50,
          y: 50,
          size: (o.size ?? 60) * 1.35,
          w: o.type === 'lozenge' ? 70 : o.w,
          h: o.type === 'lozenge' ? 86 : o.h,
        })),
      },
      { clipId: 'clip-glyph', fluid: true, bare: true },
    );

  // The emblem grid is drawn in the browser only: 137 pictures would triple the page's size.
  let mounted = $state(false);
  onMount(() => (mounted = true));

  let query = $state('');
  const found = $derived.by(() => {
    const q = query.trim().toLowerCase();
    return q ? emblems.filter((e) => e.name.toLowerCase().includes(q) || e.group.toLowerCase().includes(q)) : emblems;
  });

  const positions: { id: Position; name: string }[] = [
    { id: 'centre', name: 'Centre' },
    { id: 'canton', name: 'Canton' },
    { id: 'hoist', name: 'Hoist' },
    { id: 'fly', name: 'Fly' },
  ];
  const scales: { id: Scale; name: string }[] = [
    { id: 's', name: 'Small' },
    { id: 'm', name: 'Medium' },
    { id: 'l', name: 'Large' },
  ];
</script>

<section class="panel" aria-labelledby="division-title">
  <h2 id="division-title"><span class="step">1</span><Icon icon={faBorderAll} /> Division</h2>
  <p class="intro">How the field is divided. Pick a layout, then its colours.</p>
  <div class="grid" role="radiogroup" aria-label="Division">
    {#each divisionPresets as preset (preset.id)}
      <label class="option" title={preset.name}>
        <input type="radio" name="division" value={preset.id} checked={simple.division === preset.id} onchange={() => (simple.division = preset.id)} />
        <span class="thumb">{@html thumb({ division: preset.id, overlay: 'none', symbol: 'none' })}</span>
        <span class="visually-hidden">{preset.name}</span>
      </label>
    {/each}
  </div>
  <div class="colors">
    {#each colorLabels as label, i (label)}
      <Swatches value={simple.colors[i]!} {label} name="division-color-{i}" disabled={i >= uses} onchange={(c) => (simple.colors[i] = c)} />
    {/each}
  </div>
</section>

<section class="panel" aria-labelledby="overlay-title">
  <h2 id="overlay-title"><span class="step">2</span><Icon icon={faLayerGroup} /> Overlay</h2>
  <p class="intro">One bold shape over the field: a cross, a canton, a triangle. Or none.</p>
  <div class="grid" role="radiogroup" aria-label="Overlay">
    {#each overlayPresets as preset (preset.id)}
      <label class="option" title={preset.name}>
        <input type="radio" name="overlay" value={preset.id} checked={simple.overlay === preset.id} onchange={() => (simple.overlay = preset.id)} />
        <span class="thumb">{@html thumb({ overlay: preset.id, symbol: 'none' })}</span>
        <span class="visually-hidden">{preset.name}</span>
      </label>
    {/each}
  </div>
  <div class="colors">
    <Swatches value={simple.overlayColor} label="Overlay colour" name="overlay-color" disabled={simple.overlay === 'none'} onchange={(c) => (simple.overlayColor = c)} />
  </div>
</section>

<section class="panel" aria-labelledby="symbol-title">
  <h2 id="symbol-title"><span class="step">3</span><Icon icon={faStar} /> Symbol</h2>
  <p class="intro">One charge that says who flies it. {emblems.length + symbolPresets.length - 1} to choose from.</p>
  <div class="grid symbols" role="radiogroup" aria-label="Drawn symbols">
    {#each symbolPresets as preset (preset.id)}
      <label class="option glyph" title={preset.name}>
        <input type="radio" name="symbol" value={preset.id} checked={simple.symbol === preset.id} onchange={() => (simple.symbol = preset.id)} />
        {#if preset.id === 'none'}
          <span class="none">None</span>
        {:else}
          <span class="thumb square">{@html glyph(preset.id)}</span>
          <span class="visually-hidden">{preset.name}</span>
        {/if}
      </label>
    {/each}
  </div>

  <label class="search">
    <Icon icon={faMagnifyingGlass} />
    <span class="visually-hidden">Search the emblems</span>
    <input type="search" placeholder="Search {emblems.length} emblems: dragon, wheat, tower…" bind:value={query} />
  </label>
  <div class="emblems" class:waiting={!mounted} role="radiogroup" aria-label="Emblems">
    {#each mounted ? emblemGroups : [] as group (group)}
      {@const list = found.filter((e) => e.group === group)}
      {#if list.length}
        <p class="group">{group}</p>
        <div class="grid symbols">
          {#each list as e (e.id)}
            <label class="option glyph" title={e.name}>
              <input type="radio" name="symbol" value="e-{e.id}" checked={simple.symbol === `e-${e.id}`} onchange={() => (simple.symbol = `e-${e.id}`)} />
              <svg viewBox="0 0 {e.width} {e.height}" aria-hidden="true" focusable="false"><path fill="currentColor" d={e.path} /></svg>
              <span class="visually-hidden">{e.name}</span>
            </label>
          {/each}
        </div>
      {/if}
    {/each}
    {#if mounted && !found.length}
      <p class="group">No emblem by that name. The star, sun and crescent are above.</p>
    {/if}
  </div>

  <div class="colors">
    <Swatches value={simple.symbolColor} label="Symbol colour" name="symbol-color" disabled={simple.symbol === 'none'} onchange={(c) => (simple.symbolColor = c)} />
  </div>
  <div class="choices" class:off={simple.symbol === 'none'}>
    <fieldset>
      <legend>Where</legend>
      {#each positions as p (p.id)}
        <label class="pill">
          <input type="radio" name="position" value={p.id} checked={simple.position === p.id} onchange={() => (simple.position = p.id)} />
          <span class="check"><Icon icon={faCheck} /></span>
          <span class="steady" data-text={p.name}>{p.name}</span>
        </label>
      {/each}
    </fieldset>
    <fieldset>
      <legend>Size</legend>
      {#each scales as s (s.id)}
        <label class="pill">
          <input type="radio" name="scale" value={s.id} checked={simple.scale === s.id} onchange={() => (simple.scale = s.id)} />
          <span class="check"><Icon icon={faCheck} /></span>
          <span class="steady" data-text={s.name}>{s.name}</span>
        </label>
      {/each}
    </fieldset>
  </div>
</section>

<section class="panel" aria-labelledby="ratio-title">
  <h2 id="ratio-title"><span class="step">4</span><Icon icon={faRulerCombined} /> Proportions</h2>
  <p class="intro">Height to width. 2:3 is the most common; 1:2 is long, in the British manner.</p>
  <fieldset class="ratio-pills">
    <legend class="visually-hidden">Proportions</legend>
    {#each ratios as r (r.ratio.join(':'))}
      {@const text = r.ratio.join(':')}
      <label class="pill" title="{text}: {r.note}">
        <input
          type="radio"
          name="ratio"
          value={text}
          checked={simple.ratio[0] === r.ratio[0] && simple.ratio[1] === r.ratio[1]}
          onchange={() => (simple.ratio = [...r.ratio])}
        />
        <span class="check"><Icon icon={faCheck} /></span>
        <span class="steady" data-text={text}>{text}</span>
      </label>
    {/each}
  </fieldset>
</section>

<style>
  h2 {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    margin: 0 0 var(--space-3);
    font-size: 16px;
  }

  .step {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: var(--selected);
    color: var(--on-selected);
    font-size: 13px;
  }

  .intro {
    margin: calc(-1 * var(--space-2)) 0 var(--space-3);
    color: var(--ink-muted);
    font-size: 13px;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(62px, 1fr));
    gap: var(--space-2);
  }

  .grid.symbols {
    grid-template-columns: repeat(auto-fill, minmax(42px, 1fr));
    gap: 6px;
  }

  .option {
    position: relative;
    display: block;
    padding: 4px;
    border: 1px solid var(--line);
    border-radius: var(--radius-control);
    background: var(--surface);
    cursor: pointer;
    transition:
      border-color 0.15s,
      box-shadow 0.15s,
      transform 0.15s;
  }

  .option:hover {
    border-color: var(--selected-edge);
    box-shadow: 0 2px 6px rgb(0 0 0 / 0.15);
    transform: translateY(-1px);
  }

  .option input {
    position: absolute;
    inset: 0;
    margin: 0;
    opacity: 0;
    cursor: pointer;
  }

  .option:has(input:checked) {
    border-color: var(--selected);
    box-shadow: 0 0 0 2px var(--selected);
  }

  .option:has(input:focus-visible) {
    outline: 2px solid var(--focus-ring);
    outline-offset: 3px;
  }

  .thumb {
    display: block;
    aspect-ratio: 3 / 2;
    overflow: hidden;
    border-radius: 1px;
    box-shadow: 0 0 0 1px rgb(0 0 0 / 0.25);
    line-height: 0;
  }

  .thumb.square {
    aspect-ratio: 1;
    box-shadow: none;
  }

  .thumb :global(svg) {
    display: block;
    width: 100%;
    height: 100%;
  }

  .glyph {
    display: flex;
    align-items: center;
    justify-content: center;
    aspect-ratio: 1;
    padding: 7px;
    color: var(--ink);
  }

  .glyph > svg {
    width: 100%;
    height: 100%;
  }

  .glyph .thumb {
    width: 100%;
  }

  /* Drawn symbols take the text colour, like the emblems beside them. */
  .glyph .thumb :global([fill='#000000']) {
    fill: currentColor;
  }

  .glyph .thumb :global([stroke='#000000']) {
    stroke: currentColor;
  }

  .none {
    color: var(--ink-muted);
    font-size: 11px;
  }

  .colors {
    display: grid;
    gap: var(--space-3);
    margin-top: var(--space-4);
  }

  .search {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    margin: var(--space-4) 0 var(--space-2);
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
    max-height: 300px;
    overflow-y: auto;
    padding: 3px;
    margin: 0 -3px;
    overscroll-behavior: contain;
  }

  /* Room kept for the grid until it is drawn, so nothing below jumps. */
  .emblems.waiting {
    height: 300px;
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

  .choices {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-3) var(--space-6);
    margin-top: var(--space-4);
  }

  .choices.off {
    opacity: 0.4;
  }

  fieldset {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    min-width: 0;
    margin: 0;
    padding: 0;
    border: 0;
  }

  .choices legend {
    padding: 0;
    margin-bottom: var(--space-1);
    color: var(--ink-muted);
    font-size: 13px;
  }

  @media (prefers-reduced-motion: reduce) {
    .option {
      transition: none;
    }

    .option:hover {
      transform: none;
    }
  }
</style>
