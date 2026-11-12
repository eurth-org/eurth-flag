<script lang="ts">
  import {
    faBorderNone,
    faCircleCheck,
    faCircleInfo,
    faCopy,
    faDice,
    faDownload,
    faFileExport,
    faFloppyDisk,
    faFolderOpen,
    faImage,
    faLink,
    faMagnet,
    faRedo,
    faRotateLeft,
    faShareNodes,
    faSliders,
    faTrash,
    faTriangleExclamation,
    faUndo,
    faWandMagicSparkles,
  } from '@fortawesome/free-solid-svg-icons';
  import { onMount, untrack } from 'svelte';
  import { describeFlag } from '../flag/describe';
  import { cleanName, flagData, fromHash, toHash, type Shared } from '../flag/link';
  import type { Flag } from '../flag/model';
  import { randomSimple } from '../flag/random';
  import { flagSize, flagSvg } from '../flag/render';
  import { review, type Level } from '../flag/review';
  import { defaultSimple, fromSimple, type Simple } from '../flag/simple';
  import AdvancedControls from './AdvancedControls.svelte';
  import { copyText, downloadBlob, rasterise, slug, svgBlob } from './download';
  import { toast } from './fun';
  import Icon from './Icon.svelte';
  import { forgetFlag, saveFlag, savedFlags, type SavedFlag } from './saved';
  import SimpleControls from './SimpleControls.svelte';
  import Stage from './Stage.svelte';

  /*
   * The flag maker. Two modes share one flag model: Simple is four choices (flag/simple.ts) and
   * Advanced edits the full flag, layer by layer. Advanced starts from the simple design and then
   * keeps its own. The design lives in the link's #part, so a link is a flag; undo, redo and
   * saving on this device work on that same text.
   */
  type Mode = 'simple' | 'advanced';
  let mode = $state<Mode>('simple');
  let simple = $state<Simple>(defaultSimple());
  let advanced = $state<Flag>(fromSimple(defaultSimple()));
  /** The advanced flag as it was copied from simple mode; once it differs, it's kept. */
  let advancedBase = $state('');
  let name = $state('');
  let selected = $state<string | null>(null);
  let guides = $state(false);
  let snap = $state(true);
  let saved = $state<SavedFlag[]>([]);
  let ready = $state(false);
  let canShare = $state(false);
  let pngWidth = $state(1280);

  const flag = $derived(mode === 'simple' ? fromSimple(simple) : advanced);
  const touched = $derived(JSON.stringify(flagData(advanced)) !== advancedBase);
  const hash = $derived(toHash({ mode, simple, flag: advanced, name }));
  const cleanedName = $derived(cleanName(name).trim());
  const title = $derived(cleanedName ? (/^(the )?(flag|banner|ensign|standard)\b/i.test(cleanedName) ? cleanedName : `Flag of ${cleanedName}`) : 'A flag made with Flagwright');
  const description = $derived(describeFlag(flag));
  const check = $derived(review(flag));
  const size = $derived(flagSize(flag));
  const preview = $derived(flagSvg(flag, { fluid: true, clipId: 'clip-mini' }));

  function setMode(next: Mode) {
    if (next === mode) return;
    if (next === 'advanced') {
      if (!touched) startFromSimple();
      else toast('Advanced keeps its own design. “Start from simple” replaces it.');
    } else if (touched) {
      toast('Simple shows your simple design. Your advanced flag is kept.');
    }
    selected = null;
    mode = next;
  }

  function startFromSimple() {
    advanced = fromSimple(simple);
    advancedBase = JSON.stringify(flagData(advanced));
    selected = null;
  }

  function random() {
    const next = randomSimple();
    if (mode === 'simple') simple = { ...next, ratio: simple.ratio };
    else {
      advanced = fromSimple({ ...next, ratio: advanced.ratio });
      advancedBase = '';
      selected = null;
    }
  }

  function load(shared: Shared) {
    mode = shared.mode;
    if (shared.simple) simple = shared.simple;
    if (shared.flag) {
      advanced = shared.flag;
      advancedBase = '';
    }
    name = shared.name;
    selected = null;
  }

  // History: the whole state as text, one entry per pause in editing.
  const snapshot = $derived(JSON.stringify({ mode, simple, advanced, advancedBase, name }));
  let past = $state<string[]>([]);
  let future = $state<string[]>([]);
  let last = '';
  let timer: ReturnType<typeof setTimeout> | undefined;

  $effect(() => {
    const now = snapshot;
    if (!ready || now === last) return;
    clearTimeout(timer);
    timer = setTimeout(() => {
      if (now === last) return;
      untrack(() => {
        past = [...past.slice(-99), last];
        future = [];
      });
      last = now;
    }, 350);
  });

  function restore(text: string) {
    const s = JSON.parse(text);
    last = text;
    mode = s.mode;
    simple = s.simple;
    advanced = s.advanced;
    advancedBase = s.advancedBase;
    name = s.name;
    if (!advanced.overlays.some((o) => o.id === selected)) selected = null;
  }

  function settle() {
    // An edit still waiting for its pause counts as made.
    clearTimeout(timer);
    if (snapshot !== last) {
      past = [...past.slice(-99), last];
      future = [];
      last = snapshot;
    }
  }

  function undo() {
    settle();
    const previous = past.at(-1);
    if (previous === undefined) return;
    past = past.slice(0, -1);
    future = [...future, last];
    restore(previous);
  }

  function redo() {
    settle();
    const next = future.at(-1);
    if (next === undefined) return;
    future = future.slice(0, -1);
    past = [...past, last];
    restore(next);
  }

  // The link follows the design, once it is no longer the flag the page opened with.
  let opening = '';
  $effect(() => {
    const now = hash;
    if (!ready) return;
    const id = setTimeout(() => {
      if (now === opening && !location.hash) return;
      if (location.hash.slice(1) !== now) history.replaceState(null, '', `#${now}`);
    }, 250);
    return () => clearTimeout(id);
  });

  onMount(() => {
    const shared = fromHash(location.hash);
    if (shared) load(shared);
    else advancedBase = JSON.stringify(flagData(advanced));
    opening = untrack(() => hash);
    last = untrack(() => snapshot);
    saved = savedFlags();
    canShare = typeof navigator.share === 'function';
    ready = true;

    // A link to another flag, opened on this page (a template, or a pasted link).
    const arrived = () => {
      if (location.hash.slice(1) === untrack(() => hash)) return;
      const next = fromHash(location.hash);
      if (next) load(next);
    };
    addEventListener('hashchange', arrived);
    return () => removeEventListener('hashchange', arrived);
  });

  function keys(event: KeyboardEvent) {
    const target = event.target as HTMLElement;
    const typing = target.matches('input:not([type=radio]):not([type=checkbox]):not([type=range]), textarea, select');
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z' && !typing) {
      event.preventDefault();
      if (event.shiftKey) redo();
      else undo();
    } else if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'y' && !typing) {
      event.preventDefault();
      redo();
    }
  }

  const link = () => `${location.origin}/#${hash}`;
  const file = (extension: string) => `${slug(title)}.${extension}`;
  const standalone = (width?: number) => flagSvg(flag, { title, desc: `${description} Made with Flagwright, flag.eurth.org.`, width });

  function save() {
    const list = saveFlag(cleanedName || 'Unnamed flag', hash);
    if (!list) {
      toast('This browser would not save it. The link still holds your flag.');
      return;
    }
    saved = list;
    copyText(link()).then((ok) => toast(ok ? 'Saved on this device, and the link is copied.' : 'Saved on this device.'));
  }

  async function copyLink() {
    toast((await copyText(link())) ? 'Link copied: it holds the whole flag.' : 'Copying was blocked. The link is in the address bar.');
  }

  async function png(type: 'image/png' | 'image/webp' = 'image/png') {
    try {
      const height = Math.round((pngWidth * size.H) / size.W);
      downloadBlob(await rasterise(standalone(pngWidth), pngWidth, height, type), file(type === 'image/png' ? 'png' : 'webp'));
    } catch {
      toast('This browser could not make the picture. The SVG download always works.');
    }
  }

  async function copyImage() {
    try {
      const height = Math.round((pngWidth * size.H) / size.W);
      const blob = rasterise(standalone(pngWidth), pngWidth, height);
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      toast('Picture copied.');
    } catch {
      toast('Copying pictures is not allowed here. Download the PNG instead.');
    }
  }

  async function share() {
    try {
      await navigator.share({ title, text: description, url: link() });
    } catch {
      // Closed without sharing: nothing to say.
    }
  }

  function open(item: SavedFlag) {
    const shared = fromHash(item.hash);
    if (!shared) return;
    load(shared);
    document.getElementById('stage')?.scrollIntoView({ block: 'nearest' });
  }

  const savedSvg = (item: SavedFlag, i: number): string => {
    const shared = fromHash(item.hash);
    const f = shared?.mode === 'simple' && shared.simple ? fromSimple(shared.simple) : shared?.flag;
    return f ? flagSvg(f, { fluid: true, clipId: `clip-saved-${i}` }) : '';
  };

  const levelIcon: Record<Level, typeof faCircleCheck> = { good: faCircleCheck, note: faCircleInfo, warn: faTriangleExclamation };
  const levelName: Record<Level, string> = { good: 'Good', note: 'Worth a look', warn: 'Problem' };
</script>

<svelte:window onkeydown={keys} />

<div class="toolbar">
  <div class="bar">
    <fieldset class="modes">
      <legend class="visually-hidden">Mode</legend>
      <label class="pill plain" data-tip="Four choices: division, overlay, symbol, colours" data-tip-align="start">
        <input type="radio" name="mode" value="simple" checked={mode === 'simple'} onchange={() => setMode('simple')} />
        <Icon icon={faWandMagicSparkles} /> <span class="steady" data-text="Simple">Simple</span>
      </label>
      <label class="pill plain" data-tip="Any number of bands and layers, placed by hand" data-tip-align="start">
        <input type="radio" name="mode" value="advanced" checked={mode === 'advanced'} onchange={() => setMode('advanced')} />
        <Icon icon={faSliders} /> <span class="steady" data-text="Advanced">Advanced</span>
      </label>
    </fieldset>
    <div class="actions">
      {#if mode === 'advanced' && touched}
        <button class="btn" data-click="spin-back" onclick={startFromSimple} data-tip="Replace this flag with your simple design">
          <Icon icon={faRotateLeft} /> <span class="wide-only">Start from simple</span>
        </button>
      {/if}
      <button class="btn" data-click="tumble" onclick={random} data-tip="A random flag that tries to look good">
        <Icon icon={faDice} /> Random
      </button>
      <span class="history">
        <button class="btn icon-only" data-click="swing-left" onclick={undo} disabled={!past.length} aria-label="Undo" data-tip="Undo (Ctrl or ⌘ Z)">
          <Icon icon={faUndo} />
        </button>
        <button class="btn icon-only" data-click="swing-right" onclick={redo} disabled={!future.length} aria-label="Redo" data-tip="Redo (Shift Ctrl or ⌘ Z)">
          <Icon icon={faRedo} />
        </button>
      </span>
      <button class="btn btn-primary" data-click="bounce" onclick={save} data-tip="Save on this device and copy the link">
        <Icon icon={faFloppyDisk} /> Save
      </button>
    </div>
  </div>
</div>

<div class="layout">
  <div class="controls">
    {#if mode === 'simple'}
      <SimpleControls bind:simple />
    {:else}
      <AdvancedControls bind:flag={advanced} bind:selected />
    {/if}
  </div>

  <div class="side">
    <section class="panel stage-panel" id="stage" aria-label="Your flag">
      <div class="name">
        <label>
          <span class="visually-hidden">Whose flag is it?</span>
          <input type="text" maxlength="60" placeholder="Whose flag is it? A country, a city, a cause…" bind:value={name} autocomplete="off" spellcheck="false" />
        </label>
        <a class="score" class:fine={check.score >= 9} class:poor={check.score < 7} href="#check-title" data-tip="Design check: {check.verdict}">
          <span class="visually-hidden">Design check:</span>
          {check.score}/10
        </a>
      </div>
      <Stage {flag} {title} desc={description} editable={mode === 'advanced'} bind:selected {guides} {snap} ondelete={(id) => ((advanced.overlays = advanced.overlays.filter((o) => o.id !== id)), (selected = null))} />
      <div class="under">
        <p class="blazon"><strong>{title}.</strong> {description}</p>
        {#if mode === 'advanced'}
          <span class="stage-tools">
            <label class="pill plain" data-tip="Centre lines and thirds">
              <input type="checkbox" bind:checked={guides} />
              <Icon icon={faBorderNone} /> Guides
            </label>
            <label class="pill plain" data-tip="Dragging moves in whole percents">
              <input type="checkbox" bind:checked={snap} />
              <Icon icon={faMagnet} /> Snap
            </label>
          </span>
        {/if}
      </div>
    </section>

    <div class="extras">
      <section class="panel" aria-labelledby="check-title">
        <h2 id="check-title">
          <Icon icon={faCircleCheck} /> Design check
          <span class="score" class:fine={check.score >= 9} class:poor={check.score < 7}>{check.score}/10 · {check.verdict}</span>
        </h2>
        <div class="sizes" aria-label="The flag at small sizes">
          <span class="mini" style:width="20px">{@html preview}</span>
          <span class="mini" style:width="40px">{@html preview}</span>
          <span class="mini" style:width="84px">{@html preview}</span>
          <span class="sizes-note">Still clear when it's tiny? Flags are seen from far away.</span>
        </div>
        <ul class="findings">
          {#each check.findings as finding (finding.id)}
            <li class={finding.level}>
              <span class="level-icon"><Icon icon={levelIcon[finding.level]} label={levelName[finding.level]} /></span>
              <div>
                <p class="principle">{finding.principle}</p>
                <p class="text">{finding.text}</p>
                {#if mode === 'advanced' && finding.layers?.length}
                  <button class="link" onclick={() => (selected = finding.layers![0]!)}>Show the layer</button>
                {/if}
              </div>
            </li>
          {/each}
        </ul>
        <p class="more">A guide, not a law. <a href="/guide/">The five principles, with examples</a></p>
      </section>

      <section class="panel" aria-labelledby="export-title">
        <h2 id="export-title"><Icon icon={faFileExport} /> Download &amp; share</h2>
        <div class="buttons">
          <button class="btn btn-primary" data-click="bounce" onclick={() => downloadBlob(svgBlob(standalone()), file('svg'))} data-tip="Sharp at any size: for wikis and print" data-tip-align="start">
            <Icon icon={faDownload} /> SVG
          </button>
          <span class="png">
            <button class="btn" data-click="bounce" onclick={() => png()}><Icon icon={faImage} /> PNG</button>
            <button class="btn" data-click="bounce" onclick={() => png('image/webp')}><Icon icon={faImage} /> WebP</button>
            <label>
              <span class="visually-hidden">Picture width</span>
              <select bind:value={pngWidth}>
                {#each [320, 640, 1280, 2560, 3840] as w (w)}
                  <option value={w}>{w} × {Math.round((w * size.H) / size.W)}</option>
                {/each}
              </select>
            </label>
          </span>
        </div>
        <div class="buttons">
          <button class="btn" onclick={copyLink}><Icon icon={faLink} /> Copy link</button>
          <button class="btn" onclick={copyImage}><Icon icon={faCopy} /> Copy picture</button>
          <button class="btn" onclick={async () => toast((await copyText(`${title}. ${description}`)) ? 'Description copied.' : 'Copying was blocked.')}>
            <Icon icon={faCopy} /> Copy description
          </button>
          {#if canShare}
            <button class="btn" onclick={share}><Icon icon={faShareNodes} /> Share</button>
          {/if}
        </div>
        <p class="more">The flag is yours. The link holds the whole design: nothing is stored on a server.</p>
      </section>

      {#if saved.length}
        <section class="panel" aria-labelledby="saved-title">
          <h2 id="saved-title"><Icon icon={faFolderOpen} /> Saved on this device <span class="count">{saved.length}</span></h2>
          <ul class="saved">
            {#each saved as item, i (item.hash)}
              <li>
                <button class="open" onclick={() => open(item)} title="Open {item.name}">
                  <span class="mini">{@html savedSvg(item, i)}</span>
                  <span class="saved-name">{item.name}</span>
                </button>
                <button class="btn tool" aria-label="Forget {item.name}" onclick={() => (saved = forgetFlag(item.hash))}><Icon icon={faTrash} /></button>
              </li>
            {/each}
          </ul>
        </section>
      {/if}
    </div>
  </div>
</div>

<style>
  /* The tool's own bar: modes on the left, actions on the right. It stays in view. */
  @media (max-width: 640px) {
    .toolbar.toolbar {
      position: static;
    }
  }

  .toolbar {
    position: sticky;
    top: 0;
    z-index: 5;
    padding: var(--space-2) var(--space-4);
    background: var(--header);
    border-bottom: 1px solid var(--line);
  }

  .bar {
    max-width: calc(1200px - 2 * var(--space-4));
    margin: 0 auto;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-2) var(--space-4);
  }

  .modes {
    display: flex;
    gap: 6px;
    margin: 0;
    padding: 0;
    border: 0;
  }

  .modes .pill {
    height: 36px;
  }

  .actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-2);
  }

  .actions .btn {
    height: 36px;
  }

  .history {
    display: inline-flex;
    gap: 2px;
  }

  .icon-only {
    justify-content: center;
    width: 36px;
    padding: 0;
  }

  .btn:disabled {
    opacity: 0.45;
    cursor: default;
    box-shadow: none;
    transform: none;
  }

  .btn:disabled:hover {
    background: var(--button);
    border-color: transparent;
  }

  @media (max-width: 640px) {
    .wide-only {
      display: none;
    }
  }

  .layout {
    max-width: 1200px;
    margin: 0 auto;
    padding: var(--space-4);
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  .controls,
  .extras {
    display: grid;
    gap: var(--space-4);
    min-width: 0;
  }

  /* On small screens the flag comes first and stays in view above the controls. */
  .side {
    display: contents;
  }

  .stage-panel {
    --stage-h: 24vh;
    order: -1;
    position: sticky;
    top: calc(var(--nav-height) + var(--space-2));
    z-index: 3;
    box-shadow: 0 0 0 var(--space-2) var(--surface);
  }

  @media (max-width: 899px) {
    .stage-panel {
      padding: var(--space-2);
    }

    .blazon {
      display: none;
    }

    .name {
      margin-bottom: var(--space-2);
    }

    .name input {
      padding: 3px 8px;
    }

    .under {
      justify-content: flex-end;
      margin-top: var(--space-2);
    }

    .under:not(:has(.stage-tools)) {
      display: none;
    }
  }

  @media (min-width: 900px) {
    .layout {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
      align-items: start;
    }

    .side {
      display: grid;
      gap: var(--space-4);
      align-self: stretch;
      align-content: start;
      min-width: 0;
    }

    .stage-panel {
      --stage-h: 46vh;
      order: 0;
      top: calc(var(--nav-height) + var(--space-3));
      box-shadow: 0 0 0 var(--space-3) var(--surface);
    }
  }

  .name {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    margin-bottom: var(--space-3);
  }

  .name label {
    flex: 1;
    min-width: 0;
  }

  .name input {
    width: 100%;
    padding: 6px 10px;
    border: 1px solid var(--line-strong);
    border-radius: var(--radius-control);
    background: var(--surface);
    font-size: 16px;
    font-weight: 600;
  }

  .name input::placeholder {
    font-weight: 400;
  }

  .under {
    display: flex;
    flex-wrap: wrap;
    align-items: start;
    justify-content: space-between;
    gap: var(--space-2) var(--space-3);
    margin-top: var(--space-3);
  }

  .under:empty {
    display: none;
  }

  .blazon {
    flex: 1 1 260px;
    margin: 0;
    color: var(--ink-muted);
    font-size: 13px;
  }

  .blazon strong {
    color: var(--ink);
  }

  .stage-tools {
    display: inline-flex;
    gap: 6px;
  }

  .stage-tools .pill {
    font-size: 13px;
  }

  h2 {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-2);
    margin: 0 0 var(--space-3);
    font-size: 16px;
  }

  a.score {
    margin-left: 0;
    text-decoration: none;
  }

  .score {
    margin-left: auto;
    padding: 1px 8px;
    border: 1px solid var(--line-strong);
    border-radius: 999px;
    color: var(--ink);
    font-size: 13px;
    font-weight: 700;
  }

  .score.fine {
    border-color: var(--good);
    color: var(--good);
  }

  .score.poor {
    border-color: var(--unusual);
    color: var(--unusual);
  }

  .count {
    padding: 0 7px;
    border-radius: 999px;
    background: var(--button);
    color: var(--ink-muted);
    font-size: 12px;
  }

  .sizes {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    margin-bottom: var(--space-4);
  }

  .mini {
    display: block;
    flex: none;
    overflow: hidden;
    border-radius: 1px;
    box-shadow: 0 0 0 1px var(--line-strong);
    line-height: 0;
  }

  .mini :global(svg) {
    display: block;
    width: 100%;
    height: auto;
  }

  .sizes-note {
    color: var(--ink-muted);
    font-size: 13px;
  }

  .findings {
    display: grid;
    gap: var(--space-3);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .findings li {
    display: grid;
    grid-template-columns: 22px 1fr;
    gap: var(--space-2);
  }

  .level-icon {
    padding-top: 2px;
    font-size: 16px;
  }

  .good .level-icon {
    color: var(--good);
  }

  .note .level-icon {
    color: var(--unusual);
  }

  .warn .level-icon {
    color: var(--danger);
  }

  .principle {
    margin: 0;
    color: var(--ink-muted);
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  .text {
    margin: 0;
  }

  .link {
    padding: 0;
    border: 0;
    background: none;
    color: var(--accent-text);
    text-decoration: underline;
    cursor: pointer;
    font-size: 13px;
  }

  .more {
    margin: var(--space-3) 0 0;
    color: var(--ink-muted);
    font-size: 13px;
  }

  .buttons {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-2);
  }

  .buttons + .buttons {
    margin-top: var(--space-2);
  }

  .png {
    display: inline-flex;
    flex-wrap: wrap;
    gap: 2px;
  }

  .png select {
    height: 100%;
    padding: 5px 8px;
    border: 1px solid var(--line-strong);
    border-radius: var(--radius-control);
    background: var(--surface);
  }

  .saved {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
    gap: var(--space-2);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .saved li {
    display: flex;
    align-items: center;
    gap: 2px;
    min-width: 0;
  }

  .open {
    flex: 1;
    display: flex;
    align-items: center;
    gap: var(--space-2);
    min-width: 0;
    padding: 5px;
    border: 1px solid var(--line);
    border-radius: var(--radius-control);
    background: var(--surface);
    text-align: left;
    cursor: pointer;
  }

  .open:hover {
    border-color: var(--selected-edge);
    background: var(--hover);
  }

  .open .mini {
    width: 42px;
  }

  .saved-name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .tool {
    justify-content: center;
    width: 30px;
    height: 30px;
    padding: 0;
  }
</style>
