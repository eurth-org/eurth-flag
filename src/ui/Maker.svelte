<script lang="ts">
  import { faMarkdown } from '@fortawesome/free-brands-svg-icons';
  import {
    faBorderNone,
    faCheck,
    faCircleCheck,
    faCircleInfo,
    faCopy,
    faFileExport,
    faMagnet,
    faRedo,
    faRotateLeft,
    faSliders,
    faTriangleExclamation,
    faUndo,
    faWandMagicSparkles,
  } from '@fortawesome/free-solid-svg-icons';
  import type { EurthProfile } from '@eurth/profile';
  import ProfileButtons from '@eurth/profile/ProfileButtons.svelte';
  import { PICTURE_SIZES, calm, download, fileSlug, pictureFilename, playTones, svgToPicture, toast } from '@eurth/style';
  import Icon from '@eurth/style/components/Icon.svelte';
  import Line from '@eurth/style/components/Line.svelte';
  import RandomButton from '@eurth/style/components/RandomButton.svelte';
  import ShareButtons from '@eurth/style/components/ShareButtons.svelte';
  import { lineAlert, lineAlertCircle, lineConfirm, lineConfirmCircle, lineDownloadOutline, type LineIcon } from '@eurth/style/line';
  import { onMount, untrack } from 'svelte';
  import { describeFlag } from '../flag/describe';
  import { cleanName, flagData, fromAddress, fromHash, toQuery, type Shared } from '../flag/link';
  import { flagMarkdown } from '../flag/markdown';
  import { colorsOf, type Flag } from '../flag/model';
  import { pictureSvg } from '../flag/picture';
  import { flagFromProfile, linkFits, withFlag } from '../flag/profile';
  import { randomSimple } from '../flag/random';
  import { flagSize, flagSvg } from '../flag/render';
  import { review, type Level } from '../flag/review';
  import { defaultSimple, fromSimple, type Simple } from '../flag/simple';
  import AdvancedControls from './AdvancedControls.svelte';
  import SimpleControls from './SimpleControls.svelte';
  import Stage from './Stage.svelte';

  /*
   * The flag maker. Two modes share one flag model: Simple is four choices (flag/simple.ts) and
   * Advanced edits the full flag, layer by layer. Advanced starts from the simple design and then
   * keeps its own.
   *
   * Nothing is stored. The design lives in the link's query string (flag/link.ts), so a link is
   * a flag, and undo and redo work on that same state held in memory. "Save" is the link, a
   * picture, or the nation's profile file, in which Flagwright owns the flag section.
   */
  // Passed in by the page: browser code never imports eurth.config.mjs (see the note there).
  let { siteName, siteUrl }: { siteName: string; siteUrl: string } = $props();

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
  let ready = $state(false);
  let profile = $state.raw<EurthProfile | null>(null);
  /** Which picture the downloads make: the flag alone at a width ("w1280"), or one of the suite's sharing sizes ("square"). */
  let shape = $state('w1280');
  let flying = $state(false);

  const flag = $derived(mode === 'simple' ? fromSimple(simple) : advanced);
  const touched = $derived(JSON.stringify(flagData(advanced)) !== advancedBase);
  const query = $derived(toQuery({ mode, simple, flag: advanced, name }));
  const cleanedName = $derived(cleanName(name).trim());
  const title = $derived(cleanedName ? (/^(the )?(flag|banner|ensign|standard)\b/i.test(cleanedName) ? cleanedName : `Flag of ${cleanedName}`) : `A flag made with ${siteName}`);
  const description = $derived(describeFlag(flag));
  const check = $derived(review(flag));
  const size = $derived(flagSize(flag));
  const preview = $derived(flagSvg(flag, { fluid: true, clipId: 'clip-mini' }));
  // Before the page has loaded there is no address to read: the site's own, then.
  const link = $derived(`${ready ? location.origin : siteUrl}/?${query}`);

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

  /*
   * Random asks before it rolls over real work, and only then: the flag the page opened with
   * and a flag Random rolled itself are nobody's work yet, so those roll at once. `settled` is
   * that flag, as drawn; once the visitor changes it, there is something to lose.
   */
  const drawing = $derived(JSON.stringify(flagData(flag)));
  let settled = $state('');
  const changed = $derived(ready && drawing !== settled);

  function random() {
    const next = randomSimple();
    if (mode === 'simple') simple = { ...next, ratio: simple.ratio };
    else {
      advanced = fromSimple({ ...next, ratio: advanced.ratio });
      advancedBase = '';
      selected = null;
    }
    settled = drawing;
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

  // History: the whole state as text, one entry per pause in editing. Held in memory only.
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

  /** Puts the design in the address bar, without adding to the Back button's history. */
  const address = (text: string) => history.replaceState(history.state, '', `${location.pathname}?${text}`);

  // The address follows the design, once it is no longer the flag the page opened with. A visit
  // that arrived without a flag in its address keeps that address until something changes.
  let opening = '';
  let showing = false;
  $effect(() => {
    const now = query;
    if (!ready) return;
    const id = setTimeout(() => {
      if (!showing && now === opening) return;
      showing = true;
      if (location.search.slice(1) !== now || location.hash) address(now);
    }, 250);
    return () => clearTimeout(id);
  });

  onMount(() => {
    // A link is someone else's input: flag/link.ts checks and clamps every value it reads.
    const arrived = fromAddress(location.search, location.hash);
    if (arrived) load(arrived.shared);
    else advancedBase = JSON.stringify(flagData(advanced));
    opening = untrack(() => query);
    // A link from before November 2026 keeps its flag after the #. It opens the same flag, and
    // the address is rewritten to today's form straight away.
    if (arrived?.old) address(opening);
    showing = !!arrived;
    last = untrack(() => snapshot);
    settled = untrack(() => drawing);
    ready = true;

    // An old link opened on this page (pasted over the address, or followed from a forum post).
    const pasted = () => {
      const next = fromHash(location.hash);
      if (!next) return;
      load(next);
      showing = true;
      address(toQuery(next));
    };
    addEventListener('hashchange', pasted);
    return () => removeEventListener('hashchange', pasted);
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

  // Pictures. The flag alone at a chosen width, or whole on a Night ground in a sharing size.
  const widths = [320, 640, 1280, 2560, 3840];
  const credit = $derived(`${description} Made with ${siteName}, ${new URL(siteUrl).host}.`);
  const standalone = (width?: number) => flagSvg(flag, { title, desc: credit, width });
  const picture = $derived.by(() => {
    const sharing = PICTURE_SIZES.find((s) => s.id === shape);
    if (sharing) return { svg: pictureSvg(flag, sharing, { title, desc: credit }), width: sharing.width, height: sharing.height, suffix: `-${sharing.id}` };
    const width = widths.find((w) => `w${w}` === shape) ?? 1280;
    return { svg: standalone(width), width, height: Math.round((width * size.H) / size.W), suffix: '' };
  });
  const fileName = $derived(`${fileSlug(title, 'flag')}${picture.suffix}`);
  const drawn = (type: 'image/png' | 'image/webp' = 'image/png') => svgToPicture(picture.svg, { width: picture.width, height: picture.height, type, quality: 0.92 });

  /*
   * The signature touch: the flag is hoisted. Whenever a flag leaves (copied or downloaded) it
   * catches the wind for a moment, and with sound switched on a halyard taps the pole. Under
   * half a second, and nothing moves for visitors who asked for calm.
   */
  function hoist() {
    playTones([[1568, 0, 0.03], [2093, 0.09, 0.022], [1568, 0.21, 0.014]], { length: 0.16 });
    if (calm()) return;
    flying = false;
    requestAnimationFrame(() => (flying = true));
    setTimeout(() => (flying = false), 500);
  }

  // The button just used shows a tick for a moment, as the share row's do. A download is known
  // by the kind of file that was asked for.
  type Kind = 'image/svg+xml' | 'image/png' | 'image/webp' | 'text/markdown';
  let downloaded = $state<Kind | null>(null);
  let ticking: ReturnType<typeof setTimeout> | undefined;
  function left(kind: Kind) {
    downloaded = kind;
    clearTimeout(ticking);
    ticking = setTimeout(() => (downloaded = null), 2000);
    hoist();
  }

  function saveSvg() {
    download(`<?xml version="1.0" encoding="UTF-8"?>\n${picture.svg}\n`, `${fileName}.svg`, 'image/svg+xml');
    left('image/svg+xml');
  }

  // The flag in words, for the forum and wikis: its name, description, design check and link.
  const markdown = () => flagMarkdown(flag, { heading: cleanedName ? title : '', link, site: siteName });
  function saveMarkdown() {
    download(`${markdown()}\n`, `${fileSlug(title, 'flag')}.md`, 'text/markdown');
    left('text/markdown');
  }

  // Named for what the browser really made: Safari answers a request for WebP with a PNG.
  async function savePicture(type: 'image/png' | 'image/webp') {
    try {
      const blob = await drawn(type);
      const made = pictureFilename(fileName, blob, type);
      download(blob, made.filename);
      if (made.note) toast(made.note);
      left(type);
    } catch {
      toast('This browser could not make the picture. The SVG download always works.');
    }
  }

  // The nation's profile file. Flagwright owns its flag section and leaves every other section
  // exactly as it was. The link in it is always the site's own: a profile takes https links only.
  const profileLink = $derived(`${siteUrl}/?${query}`);
  const saved = $derived(
    withFlag(profile, cleanedName, { link: profileLink, summary: description, svg: standalone(), ratio: flag.ratio, colours: colorsOf(flag) }),
  );

  function loaded(next: EurthProfile) {
    profile = next;
    // Only a Flagwright link is opened; it is read and cleaned like any other link.
    const shared = flagFromProfile(next, [siteUrl, location.origin]);
    if (shared) load(shared);
    const nation = cleanName(next.meta.nation).trim();
    if (!shared?.name && nation) name = nation;
    const whose = nation || 'Your nation';
    toast(shared ? `${whose} is loaded, flag and all.` : `${whose} is loaded. Its profile has no flag from ${siteName} yet.`);
  }

  // What went wrong, said so it can be put right. A file with no "meta" at all isn't a profile.
  function refused(errors: { path: string; message: string }[]) {
    const first = errors[0];
    toast(!first || first.path === 'meta' ? "That file isn't a nation profile. Pick one that ends in .eurth.json." : first.message);
  }

  // Flagwright's own easter egg: a plain white flag is taken as it is meant.
  const surrendered = $derived(ready && colorsOf(flag).join() === '#ffffff');
  $effect(() => {
    if (surrendered) toast('A plain white flag. Surrender accepted.');
  });

  const levelIcon: Record<Level, typeof faCircleCheck> = { good: faCircleCheck, note: faCircleInfo, warn: faTriangleExclamation };
  // The score's own icon draws itself again whenever the verdict changes.
  const levelLine: Record<Level, LineIcon> = { good: lineConfirmCircle, note: lineAlertCircle, warn: lineAlert };
  const levelName: Record<Level, string> = { good: 'Good', note: 'Worth a look', warn: 'Problem' };
  const scoreLevel = $derived<Level>(check.score >= 9 ? 'good' : check.score >= 7 ? 'note' : 'warn');
</script>

<svelte:window onkeydown={keys} />

<div class="fw-maker">
  <div class="toolbar">
    <fieldset class="fw-options">
      <legend class="eu-visually-hidden">Mode</legend>
      <label class="eu-pill" data-tip="Four choices: division, overlay, symbol, colours" data-tip-align="start">
        <input type="radio" name="mode" value="simple" checked={mode === 'simple'} onchange={() => setMode('simple')} />
        <span class="eu-check">{#if mode === 'simple'}<Line icon={lineConfirm} />{/if}</span>
        <Icon icon={faWandMagicSparkles} /> Simple
      </label>
      <label class="eu-pill" data-tip="Any number of bands and layers, placed by hand" data-tip-align="start">
        <input type="radio" name="mode" value="advanced" checked={mode === 'advanced'} onchange={() => setMode('advanced')} />
        <span class="eu-check">{#if mode === 'advanced'}<Line icon={lineConfirm} />{/if}</span>
        <Icon icon={faSliders} /> Advanced
      </label>
    </fieldset>
    <div class="eu-row actions">
      {#if mode === 'advanced' && touched}
        <button type="button" class="eu-btn eu-btn--risky" data-click="spin" onclick={startFromSimple} data-tip="Replace this flag with your simple design">
          <Icon icon={faRotateLeft} /> Start from simple
        </button>
      {/if}
      <RandomButton onrandom={random} guard={changed} what="flag" />
      <button type="button" class="eu-btn eu-btn--icon" data-click="swing-left" onclick={undo} disabled={!past.length} aria-label="Undo" data-tip="Undo (Ctrl or ⌘ Z)">
        <Icon icon={faUndo} />
      </button>
      <button type="button" class="eu-btn eu-btn--icon" data-click="swing-right" onclick={redo} disabled={!future.length} aria-label="Redo" data-tip="Redo (Shift Ctrl or ⌘ Z)">
        <Icon icon={faRedo} />
      </button>
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
      <section class="eu-card stage-panel" id="stage" aria-label="Your flag">
        <div class="name">
          <label class="whose">
            <span class="eu-visually-hidden">Whose flag is it?</span>
            <input class="eu-input" type="text" maxlength="60" placeholder="Whose flag is it? A country, a city, a cause…" bind:value={name} autocomplete="off" spellcheck="false" />
          </label>
          <a class="eu-btn score {scoreLevel}" href="#check-title" data-tip="Design check: {check.verdict}">
            <Line icon={levelLine[scoreLevel]} />
            <span class="eu-visually-hidden">Design check:</span>
            <span class="eu-data">{check.score}/10</span>
          </a>
        </div>
        <div class="pole" class:flying>
          <Stage {flag} {title} desc={description} editable={mode === 'advanced'} bind:selected {guides} {snap} ondelete={(id) => ((advanced.overlays = advanced.overlays.filter((o) => o.id !== id)), (selected = null))} />
        </div>
        <div class="under">
          <p class="blazon eu-help"><strong>{title}.</strong> {description}</p>
          {#if mode === 'advanced'}
            <span class="eu-row stage-tools">
              <label class="eu-pill" data-tip="Centre lines and thirds">
                <input type="checkbox" bind:checked={guides} />
                <span class="eu-check"><Icon icon={faCheck} /></span>
                <Icon icon={faBorderNone} /> Guides
              </label>
              <label class="eu-pill" data-tip="Dragging moves in whole percents">
                <input type="checkbox" bind:checked={snap} />
                <span class="eu-check"><Icon icon={faCheck} /></span>
                <Icon icon={faMagnet} /> Snap
              </label>
            </span>
          {/if}
        </div>
      </section>

      <div class="extras">
        <section class="eu-card" aria-labelledby="check-title">
          <h2 id="check-title" class="eu-card-title">
            <Icon icon={faCircleCheck} /> Design check
            <span class="verdict {scoreLevel}"><Line icon={levelLine[scoreLevel]} /> {check.score}/10 · {check.verdict}</span>
          </h2>
          <div class="sizes" role="group" aria-label="The flag at small sizes">
            <span class="fw-flag mini" style:width="20px">{@html preview}</span>
            <span class="fw-flag mini" style:width="40px">{@html preview}</span>
            <span class="fw-flag mini" style:width="84px">{@html preview}</span>
            <span class="eu-help">Still clear when it's tiny? Flags are seen from far away.</span>
          </div>
          <ul class="fw-rows findings">
            {#each check.findings as finding (finding.id)}
              <li class={finding.level}>
                <span class="level-icon"><Icon icon={levelIcon[finding.level]} label={levelName[finding.level]} /></span>
                <div>
                  <p class="eu-kicker">{finding.principle}</p>
                  <p>{finding.text}</p>
                  {#if mode === 'advanced' && finding.layers?.length}
                    <button type="button" class="eu-btn" onclick={() => (selected = finding.layers![0]!)}>Show the layer</button>
                  {/if}
                </div>
              </li>
            {/each}
          </ul>
          <p class="eu-help">A guide, not a law. <a href="/guide/">The five principles, with examples</a></p>
        </section>

        <section class="eu-card" aria-labelledby="export-title">
          <h2 id="export-title" class="eu-card-title"><Icon icon={faCopy} /> Copy and share</h2>
          <ShareButtons
            url={link}
            {title}
            text={`${cleanedName ? `${title}. ` : ''}${description} Made with ${siteName}.`}
            description={() => `${title}. ${description}`}
            {markdown}
            picture={() => drawn()}
            heading={cleanedName ? `Share ${title.replace(/^Flag of /, 'the flag of ')}` : 'Share your flag'}
            said={{ link: 'Link copied: it holds the whole flag.', picture: 'Picture copied.', description: 'Description copied.' }}
            oncopy={hoist}
          />
          <p class="eu-help">The link holds the whole design: copying it is saving it.</p>
        </section>

        <!-- Copying and saving are two things, so they are two groups, each under its own heading. -->
        <section class="eu-card" aria-labelledby="save-title">
          <h2 id="save-title" class="eu-card-title"><Icon icon={faFileExport} /> Save as a file</h2>
          <div class="eu-row">
            <button type="button" class="eu-btn" data-click="bounce" onclick={saveSvg} data-tip="Sharp at any size: for wikis and print" data-tip-align="start">
              <Line icon={downloaded === 'image/svg+xml' ? lineConfirm : lineDownloadOutline} /> SVG
            </button>
            <button type="button" class="eu-btn" data-click="bounce" onclick={() => savePicture('image/png')}>
              <Line icon={downloaded === 'image/png' ? lineConfirm : lineDownloadOutline} /> PNG
            </button>
            <button type="button" class="eu-btn" data-click="bounce" onclick={() => savePicture('image/webp')}>
              <Line icon={downloaded === 'image/webp' ? lineConfirm : lineDownloadOutline} /> WebP
            </button>
            <button type="button" class="eu-btn" data-click="bounce" onclick={saveMarkdown} data-tip="The flag in words: for the forum and wikis">
              {#if downloaded === 'text/markdown'}<Line icon={lineConfirm} />{:else}<Icon icon={faMarkdown} />{/if} Markdown
            </button>
            <label class="shape">
              <span class="eu-visually-hidden">Picture size</span>
              <select class="eu-select" bind:value={shape}>
                <optgroup label="The flag alone">
                  {#each widths as w (w)}
                    <option value="w{w}">{w} × {Math.round((w * size.H) / size.W)}</option>
                  {/each}
                </optgroup>
                <optgroup label="On a Night ground, for sharing">
                  {#each PICTURE_SIZES as s (s.id)}
                    <option value={s.id}>{s.name}: {s.width} × {s.height}</option>
                  {/each}
                </optgroup>
              </select>
            </label>
          </div>
          <h3 class="eu-label">Your nation's profile</h3>
          <div class="eu-row">
            <ProfileButtons profile={saved} onload={loaded} onerror={refused} />
          </div>
          {#if profile}
            <p class="eu-help">
              <strong>{profile.meta.nation || 'Your nation'}</strong> is loaded. “Save profile” puts this flag in its file and leaves everything else in it as it was.
            </p>
          {/if}
          {#if !linkFits(profileLink)}
            <p class="eu-help">This flag has so many layers that its link is too long for a profile file. The file will carry its picture and description; keep the link as well if you want to change the flag later.</p>
          {/if}
          <p class="eu-help">
            The flag is yours. The profile file carries your nation from one Eurth tool to the next. Nothing is kept in this browser or on a server.
          </p>
        </section>
      </div>
    </div>
  </div>
</div>

<style>
  .fw-maker {
    /* The tool's own bar: as tall as its buttons and the room around them. */
    --bar: calc(var(--size-target) + 2 * var(--space-2));
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  /* Modes on the left, actions on the right. */
  .toolbar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-2) var(--space-4);
    padding: var(--space-2) 0;
    background: var(--surface);
  }

  .actions {
    gap: var(--space-2);
  }

  .layout {
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
    position: sticky;
    top: var(--space-2);
    z-index: 3;
    order: -1;
    /* A band of the page's own colour around the panel, so what scrolls under it doesn't show at its corners. */
    outline: var(--space-2) solid var(--surface);
  }

  @media (max-width: 899px) {
    .fw-maker :global(.eu-card) {
      padding: var(--space-4);
    }

    .fw-maker .stage-panel {
      gap: var(--space-2);
      padding: var(--space-2);
    }

    .blazon {
      display: none;
    }

    .under:not(:has(.stage-tools)) {
      display: none;
    }
  }

  @media (min-width: 900px) {
    /* The bar stays in view, and the flag under it. */
    .toolbar {
      position: sticky;
      top: 0;
      z-index: 5;
    }

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
      --stage-h: 40vh;
      top: var(--bar);
      order: 0;
      outline-width: var(--space-4);
    }
  }

  .name {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  .whose {
    flex: 1;
    min-width: 0;
  }

  .whose input {
    font-weight: 700;
  }

  .whose input::placeholder {
    font-weight: 400;
  }

  /* The score, said three ways: a number, an icon and a colour. */
  .score.good,
  .verdict.good,
  .good .level-icon {
    color: var(--success-text);
  }

  .score.note,
  .verdict.note,
  .note .level-icon {
    color: var(--caution-text);
  }

  .score.warn,
  .verdict.warn,
  .warn .level-icon {
    color: var(--danger-text);
  }

  .score:hover {
    color: var(--ink);
  }

  .verdict {
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
    margin-left: auto;
    font: var(--type-label);
  }

  /* The signature touch: the flag catches the wind for a moment (see hoist()). */
  .pole {
    transform-origin: 0 50%;
  }

  .pole.flying {
    animation: fly 0.45s ease-in-out;
  }

  @keyframes fly {
    30% {
      transform: skewY(-2deg) scaleX(0.98);
    }

    65% {
      transform: skewY(1.5deg) scaleX(0.99);
    }
  }

  .under {
    display: flex;
    flex-wrap: wrap;
    align-items: start;
    justify-content: space-between;
    gap: var(--space-2) var(--space-3);
  }

  .blazon {
    flex: 1 1 calc(6 * var(--size-target));
  }

  .blazon strong {
    color: var(--ink);
  }

  .stage-tools {
    gap: var(--space-2);
  }

  .sizes {
    display: flex;
    align-items: center;
    gap: var(--space-3);
  }

  .mini {
    flex: none;
  }

  .mini :global(svg) {
    height: auto;
  }

  .findings {
    gap: var(--space-3);
  }

  .findings li {
    display: grid;
    grid-template-columns: var(--space-5) minmax(0, 1fr);
    gap: var(--space-2);
  }

  .findings .eu-btn {
    margin-top: var(--space-2);
  }

  .shape {
    flex: 1 1 calc(4 * var(--size-target));
    min-width: 0;
  }
</style>
