<script lang="ts">
  import {
    faArrowDown,
    faArrowUp,
    faArrowsLeftRight,
    faBorderAll,
    faBullseye,
    faCheck,
    faClone,
    faEye,
    faEyeSlash,
    faLayerGroup,
    faPlus,
    faRightLeft,
    faRulerCombined,
    faTrash,
    faXmark,
  } from '@fortawesome/free-solid-svg-icons';
  import { contrast } from '../flag/colors';
  import { describeOverlay } from '../flag/describe';
  import { emblem } from '../flag/emblems';
  import { MAX_BANDS, MAX_OVERLAYS } from '../flag/link';
  import { movable, newOverlay, overlayDef, overlayDefs, ratios, uid, type Flag, type Overlay, type OverlayType, type ParamDef } from '../flag/model';
  import { colorUnder } from '../flag/review';
  import ColorButton from './ColorButton.svelte';
  import EmblemPicker from './EmblemPicker.svelte';
  import Icon from './Icon.svelte';
  import Slider from './Slider.svelte';

  // Advanced mode: proportions, the field band by band, and any number of layers, each with its
  // own numbers. The flag is edited in place; Maker.svelte keeps the history.
  let { flag = $bindable(), selected = $bindable() }: { flag: Flag; selected: string | null } = $props();

  type Kind = 'h' | 'v' | 'grid' | 'bend' | 'saltire' | 'gyronny';
  const kinds: { id: Kind; name: string }[] = [
    { id: 'h', name: 'Horizontal bands' },
    { id: 'v', name: 'Vertical bands' },
    { id: 'grid', name: 'Grid' },
    { id: 'bend', name: 'Diagonal' },
    { id: 'saltire', name: 'Per saltire' },
    { id: 'gyronny', name: 'Rays' },
  ];
  const d = $derived(flag.division);
  const kind = $derived<Kind>(d.type === 'bands' ? d.dir : d.type);

  function setKind(next: Kind) {
    const colors = d.type === 'bands' ? d.bands.map((b) => b.color) : [...d.colors];
    const first = colors[0] ?? '#2698d4';
    const second = colors.find((c) => c !== first) ?? '#ffffff';
    if (next === 'h' || next === 'v') {
      flag.division = d.type === 'bands' ? { ...d, dir: next } : { type: 'bands', dir: next, bands: [first, second].map((color) => ({ color, weight: 1 })) };
    } else if (next === 'grid') flag.division = { type: 'grid', cols: 2, rows: 2, colors: [first, second] };
    else if (next === 'bend') flag.division = { type: 'bend', dir: 'down', colors: [first, second] };
    else if (next === 'saltire') flag.division = { type: 'saltire', colors: [first, second] };
    else flag.division = { type: 'gyronny', rays: 8, colors: [first, second] };
  }

  function addBand() {
    if (d.type !== 'bands' || d.bands.length >= MAX_BANDS) return;
    // The colour two bands back continues a pattern; with one band, white starts one.
    d.bands.push({ color: d.bands[d.bands.length - 2]?.color ?? '#ffffff', weight: 1 });
  }

  function moveBand(i: number, by: number) {
    if (d.type !== 'bands') return;
    const j = i + by;
    if (j < 0 || j >= d.bands.length) return;
    [d.bands[i], d.bands[j]] = [d.bands[j]!, d.bands[i]!];
  }

  function swapColors() {
    if (d.type !== 'bands') d.colors = [d.colors[1], d.colors[0]];
  }

  // Layers.
  let adding = $state(false);
  let choosingEmblem = $state(false);
  const groups = ['Ordinaries', 'Shapes', 'Charges'] as const;
  const current = $derived(flag.overlays.find((o) => o.id === selected) ?? null);
  const full = $derived(flag.overlays.length >= MAX_OVERLAYS);

  function add(type: OverlayType, extra: Partial<Overlay> = {}) {
    if (full) return;
    flag.overlays.push(newOverlay(type, '#ffffff', extra));
    const layer = flag.overlays[flag.overlays.length - 1]!;
    // A colour that shows on whatever the new layer lies on: the field, or a layer beneath.
    const under = colorUnder(flag, flag.overlays.length - 1);
    layer.color = ['#ffffff', '#fcd116', '#0a1f5c', '#ce1126', '#000000'].sort((a, b) => contrast(b, under) - contrast(a, under))[0]!;
    selected = layer.id;
    adding = false;
    choosingEmblem = false;
  }

  function remove(id: string) {
    flag.overlays = flag.overlays.filter((o) => o.id !== id);
    if (selected === id) selected = null;
  }

  function duplicate(o: Overlay) {
    if (full) return;
    const copy: Overlay = { ...$state.snapshot(o), id: uid() };
    if (movable(o.type)) {
      copy.x = Math.min(110, (o.x ?? 50) + 6);
      copy.y = Math.min(110, (o.y ?? 50) + 6);
    }
    flag.overlays.splice(flag.overlays.indexOf(o) + 1, 0, copy);
    selected = copy.id;
  }

  /** Moves a layer towards the top (+1) or the bottom (-1) of the pile. */
  function restack(index: number, by: number) {
    const j = index + by;
    if (j < 0 || j >= flag.overlays.length) return;
    [flag.overlays[index], flag.overlays[j]] = [flag.overlays[j]!, flag.overlays[index]!];
  }

  /** Typed numbers may place a layer a little beyond the sliders' reach; nothing else may. */
  function clampParam(param: ParamDef, v: number): number {
    const free = param.key === 'x' || param.key === 'y';
    return Math.min(free ? 150 : param.max, Math.max(free ? -50 : param.min, v));
  }

  const label = (o: Overlay): string => {
    const text = describeOverlay(o).replace(/^an? /, '');
    return text.charAt(0).toUpperCase() + text.slice(1);
  };
</script>

<section class="panel" aria-labelledby="adv-ratio-title">
  <h2 id="adv-ratio-title"><Icon icon={faRulerCombined} /> Proportions</h2>
  <div class="ratio">
    <label>
      <span class="visually-hidden">Common proportions</span>
      <select
        value={ratios.some((r) => r.ratio[0] === flag.ratio[0] && r.ratio[1] === flag.ratio[1]) ? flag.ratio.join(':') : ''}
        onchange={(e) => {
          const r = ratios.find((x) => x.ratio.join(':') === e.currentTarget.value);
          if (r) flag.ratio = [...r.ratio];
        }}
      >
        <option value="">Custom</option>
        {#each ratios as r (r.ratio.join(':'))}
          <option value={r.ratio.join(':')}>{r.ratio.join(':')}, {r.note}</option>
        {/each}
      </select>
    </label>
    <span class="hw">
      <label><span class="visually-hidden">Height</span><input type="number" min="1" max="40" value={flag.ratio[0]} onchange={(e) => (flag.ratio[0] = Math.min(40, Math.max(1, Math.round(Number(e.currentTarget.value)) || 1)))} /></label>
      <span aria-hidden="true">:</span>
      <label><span class="visually-hidden">Width</span><input type="number" min="1" max="40" value={flag.ratio[1]} onchange={(e) => (flag.ratio[1] = Math.min(40, Math.max(1, Math.round(Number(e.currentTarget.value)) || 1)))} /></label>
      <span class="hint">height : width</span>
    </span>
  </div>
</section>

<section class="panel" aria-labelledby="adv-field-title">
  <h2 id="adv-field-title"><Icon icon={faBorderAll} /> Field</h2>
  <fieldset class="pills">
    <legend class="visually-hidden">How the field is divided</legend>
    {#each kinds as k (k.id)}
      <label class="pill">
        <input type="radio" name="field-kind" value={k.id} checked={kind === k.id} onchange={() => setKind(k.id)} />
        <span class="check"><Icon icon={faCheck} /></span>
        <span class="steady" data-text={k.name}>{k.name}</span>
      </label>
    {/each}
  </fieldset>

  {#if d.type === 'bands'}
    <ol class="bands">
      {#each d.bands as band, i (i)}
        <li>
          <ColorButton value={band.color} label="Band {i + 1}" name="band-{i}" onchange={(c) => (band.color = c)} />
          <div class="grow">
            <Slider value={band.weight} label="Width" min={0.5} max={10} step={0.5} onchange={(v) => (band.weight = Math.min(20, Math.max(0.1, v)))} />
          </div>
          <span class="row-tools">
            <button class="btn tool" aria-label="Move band {i + 1} {d.dir === 'h' ? 'up' : 'towards the hoist'}" disabled={i === 0} onclick={() => moveBand(i, -1)}><Icon icon={faArrowUp} /></button>
            <button class="btn tool" aria-label="Move band {i + 1} {d.dir === 'h' ? 'down' : 'towards the fly'}" disabled={i === d.bands.length - 1} onclick={() => moveBand(i, 1)}><Icon icon={faArrowDown} /></button>
            <button class="btn tool" aria-label="Remove band {i + 1}" disabled={d.bands.length === 1} onclick={() => d.type === 'bands' && d.bands.splice(i, 1)}><Icon icon={faXmark} /></button>
          </span>
        </li>
      {/each}
    </ol>
    <div class="buttons">
      <button class="btn" onclick={addBand} disabled={d.bands.length >= MAX_BANDS}><Icon icon={faPlus} /> Add a band</button>
      <button class="btn" onclick={() => d.type === 'bands' && d.bands.forEach((b) => (b.weight = 1))}><Icon icon={faArrowsLeftRight} /> Equal widths</button>
    </div>
    <p class="hint">Bands run from {d.dir === 'h' ? 'the top down' : 'the hoist to the fly'}. Widths are shares: 1, 2, 1 makes the middle band twice as wide.</p>
  {:else}
    <div class="pair">
      <ColorButton value={d.colors[0]} label="First colour" name="field-a" onchange={(c) => d.type !== 'bands' && (d.colors[0] = c)} />
      <button class="btn tool" aria-label="Swap the two colours" data-tip="Swap colours" data-tip-align="start" onclick={swapColors}><Icon icon={faRightLeft} /></button>
      <ColorButton value={d.colors[1]} label="Second colour" name="field-b" onchange={(c) => d.type !== 'bands' && (d.colors[1] = c)} />
    </div>
    {#if d.type === 'grid'}
      <Slider value={d.cols} label="Across" min={1} max={16} onchange={(v) => d.type === 'grid' && (d.cols = Math.min(24, Math.max(1, Math.round(v))))} />
      <Slider value={d.rows} label="Down" min={1} max={16} onchange={(v) => d.type === 'grid' && (d.rows = Math.min(24, Math.max(1, Math.round(v))))} />
    {:else if d.type === 'bend'}
      <fieldset class="pills">
        <legend class="visually-hidden">Which diagonal</legend>
        {#each [{ id: 'down', name: 'Upper hoist to lower fly' }, { id: 'up', name: 'Lower hoist to upper fly' }] as const as way (way.id)}
          <label class="pill">
            <input type="radio" name="bend-dir" value={way.id} checked={d.dir === way.id} onchange={() => d.type === 'bend' && (d.dir = way.id)} />
            <span class="check"><Icon icon={faCheck} /></span>
            <span class="steady" data-text={way.name}>{way.name}</span>
          </label>
        {/each}
      </fieldset>
    {:else if d.type === 'gyronny'}
      <Slider value={d.rays} label="Rays" min={4} max={48} step={2} onchange={(v) => d.type === 'gyronny' && (d.rays = Math.min(48, Math.max(4, Math.round(v / 2) * 2)))} />
    {/if}
  {/if}
</section>

<section class="panel" aria-labelledby="adv-layers-title">
  <h2 id="adv-layers-title"><Icon icon={faLayerGroup} /> Layers <span class="count">{flag.overlays.length}</span></h2>
  <p class="intro">Everything laid over the field, topmost first. Click a layer here or on the flag to change it; drag it on the flag to move it.</p>

  <div class="buttons">
    <button class="btn btn-primary" aria-expanded={adding} disabled={full} onclick={() => ((adding = !adding), (choosingEmblem = false))}>
      <Icon icon={adding ? faXmark : faPlus} />
      {adding ? 'Close' : 'Add a layer'}
    </button>
  </div>

  {#if adding}
    <div class="adder">
      {#each groups as group (group)}
        <p class="group">{group}</p>
        <div class="types">
          {#each overlayDefs.filter((def) => def.group === group) as def (def.type)}
            <button class="btn" title={def.hint} onclick={() => (def.type === 'emblem' ? (choosingEmblem = !choosingEmblem) : add(def.type))} aria-expanded={def.type === 'emblem' ? choosingEmblem : undefined}>
              {def.name}{def.type === 'emblem' ? '…' : ''}
            </button>
          {/each}
        </div>
      {/each}
      {#if choosingEmblem}
        <div class="emblem-choice">
          <EmblemPicker onpick={(id) => add('emblem', { icon: id })} />
        </div>
      {/if}
    </div>
  {/if}

  {#if flag.overlays.length}
    <ol class="layers" reversed>
      {#each flag.overlays.map((o, index) => ({ o, index })).reverse() as { o, index } (o.id)}
        {@const def = overlayDef(o.type)}
        {@const icon = o.type === 'emblem' ? emblem(o.icon) : undefined}
        <li class:selected={selected === o.id} class:hidden={o.hidden}>
          <div class="layer-row">
            <ColorButton value={o.color} label={label(o)} name="layer-{o.id}" onchange={(c) => (o.color = c)} />
            <button class="layer-name" aria-expanded={selected === o.id} onclick={() => (selected = selected === o.id ? null : o.id)}>
              {#if icon}
                <svg class="mini" viewBox="0 0 {icon.width} {icon.height}" aria-hidden="true"><path fill="currentColor" d={icon.path} /></svg>
              {/if}
              <span>{label(o)}</span>
            </button>
            <span class="row-tools">
              <button class="btn tool" aria-label="{o.hidden ? 'Show' : 'Hide'}: {label(o)}" aria-pressed={!!o.hidden} onclick={() => (o.hidden = !o.hidden)}><Icon icon={o.hidden ? faEyeSlash : faEye} /></button>
              <button class="btn tool" aria-label="Bring forward: {label(o)}" disabled={index === flag.overlays.length - 1} onclick={() => restack(index, 1)}><Icon icon={faArrowUp} /></button>
              <button class="btn tool" aria-label="Send back: {label(o)}" disabled={index === 0} onclick={() => restack(index, -1)}><Icon icon={faArrowDown} /></button>
              <button class="btn tool" aria-label="Duplicate: {label(o)}" disabled={full} onclick={() => duplicate(o)}><Icon icon={faClone} /></button>
              <button class="btn tool" aria-label="Delete: {label(o)}" onclick={() => remove(o.id)}><Icon icon={faTrash} /></button>
            </span>
          </div>
          {#if selected === o.id}
            <div class="params">
              {#each def.params as param (param.key)}
                <Slider
                  value={o[param.key] ?? def.defaults[param.key] ?? param.min}
                  label={param.label}
                  min={param.min}
                  max={param.max}
                  step={param.step ?? 1}
                  unit={param.unit ?? ''}
                  onchange={(v) => (o[param.key] = clampParam(param, v))}
                />
              {/each}
              <div class="buttons">
                {#if movable(o.type) && def.params.some((p) => p.key === 'x') && def.params.some((p) => p.key === 'y')}
                  <button class="btn" onclick={() => ((o.x = 50), (o.y = 50))}><Icon icon={faBullseye} /> Centre</button>
                {/if}
                {#if o.type === 'emblem'}
                  <label class="pill plain">
                    <input type="checkbox" checked={!!o.mirror} onchange={(e) => (o.mirror = e.currentTarget.checked)} />
                    <Icon icon={faRightLeft} /> Mirrored
                  </label>
                {/if}
              </div>
              {#if o.type === 'emblem'}
                <details class="swap">
                  <summary>Change the emblem</summary>
                  <EmblemPicker current={o.icon} onpick={(id) => (o.icon = id)} />
                </details>
              {/if}
              <p class="hint">{def.hint}</p>
            </div>
          {/if}
        </li>
      {/each}
    </ol>
  {:else}
    <p class="empty">No layers yet: a plain field. Add a cross, a star or an emblem.</p>
  {/if}
</section>

<style>
  h2 {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    margin: 0 0 var(--space-3);
    font-size: 16px;
  }

  .count {
    padding: 0 7px;
    border-radius: 999px;
    background: var(--button);
    color: var(--ink-muted);
    font-size: 12px;
  }

  .intro {
    margin: calc(-1 * var(--space-2)) 0 var(--space-3);
    color: var(--ink-muted);
    font-size: 13px;
  }

  .hint,
  .empty {
    margin: var(--space-2) 0 0;
    color: var(--ink-muted);
    font-size: 13px;
  }

  .ratio {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-3);
  }

  select,
  .hw input {
    padding: 5px 8px;
    border: 1px solid var(--line-strong);
    border-radius: var(--radius-control);
    background: var(--surface);
  }

  select {
    max-width: 100%;
  }

  .hw {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }

  .hw input {
    width: 56px;
    text-align: center;
  }

  .hw .hint {
    margin: 0;
  }

  fieldset.pills {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    min-width: 0;
    margin: 0 0 var(--space-3);
    padding: 0;
    border: 0;
  }

  .bands,
  .layers {
    display: grid;
    gap: var(--space-2);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .bands li {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  .grow {
    flex: 1;
    min-width: 0;
  }

  .row-tools {
    display: inline-flex;
    gap: 2px;
    flex: none;
  }

  .tool {
    justify-content: center;
    width: 30px;
    height: 30px;
    padding: 0;
  }

  .tool:disabled {
    opacity: 0.35;
    cursor: default;
    box-shadow: none;
    transform: none;
  }

  .buttons {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-2);
    margin-top: var(--space-3);
  }

  .pair {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    margin-bottom: var(--space-3);
  }

  .adder {
    margin-top: var(--space-3);
    padding: var(--space-3);
    border: 1px solid var(--line-strong);
    border-radius: var(--radius-panel);
    background: var(--surface);
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

  .types {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .emblem-choice {
    margin-top: var(--space-3);
  }

  .layers {
    margin-top: var(--space-3);
  }

  .layers li {
    border: 1px solid var(--line);
    border-radius: var(--radius-control);
    background: var(--surface);
  }

  .layers li.selected {
    border-color: var(--selected);
    box-shadow: 0 0 0 1px var(--selected);
  }

  .layers li.hidden .layer-name {
    color: var(--ink-muted);
    text-decoration: line-through;
  }

  .layer-row {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: 6px;
  }

  .layer-name {
    flex: 1;
    display: flex;
    align-items: center;
    gap: var(--space-2);
    min-width: 0;
    padding: 4px;
    border: 0;
    border-radius: var(--radius-control);
    background: none;
    text-align: left;
    cursor: pointer;
  }

  .layer-name span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .layer-name:hover {
    background: var(--hover);
  }

  .mini {
    flex: none;
    width: 16px;
    height: 16px;
  }

  .params {
    display: grid;
    gap: 6px;
    padding: var(--space-2) var(--space-3) var(--space-3);
    border-top: 1px solid var(--line);
  }

  .params .buttons {
    margin-top: var(--space-1);
  }

  .swap summary {
    margin: var(--space-1) 0 var(--space-2);
    color: var(--accent-text);
    cursor: pointer;
  }

  @media (max-width: 520px) {
    .layer-row {
      flex-wrap: wrap;
    }

    .row-tools {
      margin-left: auto;
    }
  }
</style>
