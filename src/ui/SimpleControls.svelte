<script lang="ts">
  import { faBorderAll, faCheck, faLayerGroup, faRulerCombined, faStar } from '@fortawesome/free-solid-svg-icons';
  import Icon from '@eurth/style/components/Icon.svelte';
  import { onMount } from 'svelte';
  import { emblemGroups, emblems } from '../flag/emblems';
  import { ratios } from '../flag/model';
  import { flagSvg } from '../flag/render';
  import { divisionPresets, fromSimple, overlayPresets, symbolPresets, type Position, type Scale, type Simple } from '../flag/simple';
  import ColorButton from './ColorButton.svelte';

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

<section class="eu-card" aria-labelledby="division-title">
  <h2 id="division-title" class="eu-card-title"><span class="eu-step">1</span><Icon icon={faBorderAll} /> Division</h2>
  <p class="eu-help">How the field is divided. Pick a layout, then its colours.</p>
  <div class="fw-tiles" role="radiogroup" aria-label="Division">
    {#each divisionPresets as preset (preset.id)}
      <label class="fw-tile" title={preset.name}>
        <input type="radio" name="division" value={preset.id} checked={simple.division === preset.id} onchange={() => (simple.division = preset.id)} />
        <span class="fw-thumb">{@html thumb({ division: preset.id, overlay: 'none', symbol: 'none' })}</span>
        <span class="eu-visually-hidden">{preset.name}</span>
        <span class="fw-tick"><Icon icon={faCheck} /></span>
      </label>
    {/each}
  </div>
  <div class="colors">
    {#each colorLabels as label, i (label)}
      <ColorButton named value={simple.colors[i]!} {label} name="division-color-{i}" disabled={i >= uses} onchange={(c) => (simple.colors[i] = c)} />
    {/each}
  </div>
</section>

<section class="eu-card" aria-labelledby="overlay-title">
  <h2 id="overlay-title" class="eu-card-title"><span class="eu-step">2</span><Icon icon={faLayerGroup} /> Overlay</h2>
  <p class="eu-help">One bold shape over the field: a cross, a canton, a triangle. Or none.</p>
  <div class="fw-tiles" role="radiogroup" aria-label="Overlay">
    {#each overlayPresets as preset (preset.id)}
      <label class="fw-tile" title={preset.name}>
        <input type="radio" name="overlay" value={preset.id} checked={simple.overlay === preset.id} onchange={() => (simple.overlay = preset.id)} />
        <span class="fw-thumb">{@html thumb({ overlay: preset.id, symbol: 'none' })}</span>
        <span class="eu-visually-hidden">{preset.name}</span>
        <span class="fw-tick"><Icon icon={faCheck} /></span>
      </label>
    {/each}
  </div>
  <div class="colors">
    <ColorButton named value={simple.overlayColor} label="Overlay colour" name="overlay-color" disabled={simple.overlay === 'none'} onchange={(c) => (simple.overlayColor = c)} />
  </div>
</section>

<section class="eu-card" aria-labelledby="symbol-title">
  <h2 id="symbol-title" class="eu-card-title"><span class="eu-step">3</span><Icon icon={faStar} /> Symbol</h2>
  <p class="eu-help">One charge that says who flies it. {emblems.length + symbolPresets.length - 1} to choose from.</p>
  <div class="fw-tiles fw-tiles--small" role="radiogroup" aria-label="Drawn symbols">
    {#each symbolPresets as preset (preset.id)}
      <label class="fw-tile glyph" title={preset.name}>
        <input type="radio" name="symbol" value={preset.id} checked={simple.symbol === preset.id} onchange={() => (simple.symbol = preset.id)} />
        {#if preset.id === 'none'}
          <span>None</span>
        {:else}
          <span class="fw-thumb fw-thumb--bare">{@html glyph(preset.id)}</span>
          <span class="eu-visually-hidden">{preset.name}</span>
        {/if}
        <span class="fw-tick"><Icon icon={faCheck} /></span>
      </label>
    {/each}
  </div>

  <div class="eu-field">
    <label class="eu-visually-hidden" for="emblem-search">Search the emblems</label>
    <input id="emblem-search" class="eu-input" type="search" placeholder="Search {emblems.length} emblems: dragon, wheat, tower…" bind:value={query} />
  </div>
  <div class="fw-library" class:waiting={!mounted} role="radiogroup" aria-label="Emblems">
    {#each mounted ? emblemGroups : [] as group (group)}
      {@const list = found.filter((e) => e.group === group)}
      {#if list.length}
        <p class="eu-kicker">{group}</p>
        <div class="fw-tiles fw-tiles--small">
          {#each list as e (e.id)}
            <label class="fw-tile" title={e.name}>
              <input type="radio" name="symbol" value="e-{e.id}" checked={simple.symbol === `e-${e.id}`} onchange={() => (simple.symbol = `e-${e.id}`)} />
              <svg viewBox="0 0 {e.width} {e.height}" aria-hidden="true" focusable="false"><path fill="currentColor" d={e.path} /></svg>
              <span class="eu-visually-hidden">{e.name}</span>
              <span class="fw-tick"><Icon icon={faCheck} /></span>
            </label>
          {/each}
        </div>
      {/if}
    {/each}
    {#if mounted && !found.length}
      <p class="eu-help">No emblem by that name. The star, sun and crescent are above.</p>
    {/if}
  </div>

  <div class="colors">
    <ColorButton named value={simple.symbolColor} label="Symbol colour" name="symbol-color" disabled={simple.symbol === 'none'} onchange={(c) => (simple.symbolColor = c)} />
  </div>
  <div class="choices">
    <fieldset class="fw-options" disabled={simple.symbol === 'none'}>
      <legend>Where</legend>
      {#each positions as p (p.id)}
        <label class="eu-pill">
          <input type="radio" name="position" value={p.id} checked={simple.position === p.id} onchange={() => (simple.position = p.id)} />
          <span class="eu-check"><Icon icon={faCheck} /></span>
          {p.name}
        </label>
      {/each}
    </fieldset>
    <fieldset class="fw-options" disabled={simple.symbol === 'none'}>
      <legend>Size</legend>
      {#each scales as s (s.id)}
        <label class="eu-pill">
          <input type="radio" name="scale" value={s.id} checked={simple.scale === s.id} onchange={() => (simple.scale = s.id)} />
          <span class="eu-check"><Icon icon={faCheck} /></span>
          {s.name}
        </label>
      {/each}
    </fieldset>
  </div>
</section>

<section class="eu-card" aria-labelledby="ratio-title">
  <h2 id="ratio-title" class="eu-card-title"><span class="eu-step">4</span><Icon icon={faRulerCombined} /> Proportions</h2>
  <p class="eu-help">Height to width. 2:3 is the most common; 1:2 is long, in the British manner.</p>
  <fieldset class="fw-options">
    <legend class="eu-visually-hidden">Proportions</legend>
    {#each ratios as r (r.ratio.join(':'))}
      {@const text = r.ratio.join(':')}
      <label class="eu-pill" title="{text}: {r.note}">
        <input
          type="radio"
          name="ratio"
          value={text}
          checked={simple.ratio[0] === r.ratio[0] && simple.ratio[1] === r.ratio[1]}
          onchange={() => (simple.ratio = [...r.ratio])}
        />
        <span class="eu-check"><Icon icon={faCheck} /></span>
        <span class="eu-data">{text}</span>
      </label>
    {/each}
  </fieldset>
</section>

<style>
  /* The colour buttons sit in a row, and the palette opens under the row (see ColorButton). */
  .colors {
    position: relative;
    --color-anchor: static;
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
  }

  /* Drawn symbols take the text colour, like the emblems beside them. */
  .glyph :global([fill='#000000']) {
    fill: currentColor;
  }

  .glyph :global([stroke='#000000']) {
    stroke: currentColor;
  }

  /* Room kept for the grid until it is drawn, so nothing below jumps. */
  .waiting {
    height: calc(7 * var(--size-target));
  }

  .choices {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-3) var(--space-6);
  }
</style>
