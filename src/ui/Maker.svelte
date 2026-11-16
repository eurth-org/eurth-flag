<script lang="ts">
  import { faMarkdown } from '@fortawesome/free-brands-svg-icons';
  import {
    faBorderNone,
    faCircleCheck,
    faCircleInfo,
    faCopy,
    faDownload,
    faFileExport,
    faFloppyDisk,
    faImage,
    faLink,
    faMagnet,
    faRedo,
    faRotateLeft,
    faShareNodes,
    faSliders,
    faTriangleExclamation,
    faUndo,
    faWandMagicSparkles,
  } from '@fortawesome/free-solid-svg-icons';
  import type { EurthProfile } from '@eurth/profile';
  import ProfileButtons from '@eurth/profile/ProfileButtons.svelte';
  import { PICTURE_SIZES, calm, copyPicture, copyText, download, fileSlug, pictureFilename, playTones, svgToPicture, toast } from '@eurth/style';
  import RandomButton from '@eurth/style/components/RandomButton.svelte';
  import ShareDialog from '@eurth/style/components/ShareDialog.svelte';
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
  import Icon from './Icon.svelte';
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

  function saveSvg() {
    download(`<?xml version="1.0" encoding="UTF-8"?>\n${picture.svg}\n`, `${fileName}.svg`, 'image/svg+xml');
    hoist();
  }

  // The flag in words, for the forum and wikis: its name, description, design check and link.
  const markdown = () => flagMarkdown(flag, { heading: cleanedName ? title : '', link, site: siteName });
  function saveMarkdown() {
    download(`${markdown()}\n`, `${fileSlug(title, 'flag')}.md`, 'text/markdown');
    hoist();
  }

  // Named for what the browser really made: Safari answers a request for WebP with a PNG.
  async function savePicture(type: 'image/png' | 'image/webp') {
    try {
      const blob = await drawn(type);
      const made = pictureFilename(fileName, blob, type);
      download(blob, made.filename);
      if (made.note) toast(made.note);
      hoist();
    } catch {
      toast('This browser could not make the picture. The SVG download always works.');
    }
  }

  // Save, where it always was. Nothing is stored (CLAUDE.md), so saving is copying the link:
  // the link holds the whole flag.
  async function save() {
    const ok = await copyText(link);
    toast(ok ? 'Saved in its link, and the link is copied.' : 'Copying was blocked. The link in the address bar holds your flag.');
    if (ok) hoist();
  }

  // Copies, with the words Flagwright has always said.
  async function copied(ok: boolean, yes: string, no: string) {
    toast(ok ? yes : no);
    if (ok) hoist();
  }
  const copyLink = async () => copied(await copyText(link), 'Link copied: it holds the whole flag.', 'Copying was blocked. The link is in the address bar.');
  // The picture is handed over as a promise, within the click: Safari asks for that.
  const copyImage = async () => copied(await copyPicture(drawn()), 'Picture copied.', 'Copying pictures is not allowed here. Download the PNG instead.');
  const copyDescription = async () => copied(await copyText(`${title}. ${description}`), 'Description copied.', 'Copying was blocked.');
  const copyMarkdown = async () => copied(await copyText(markdown()), 'Markdown copied: paste it into the forum or a wiki.', 'Copying was blocked.');

  /** The suite's Share window: the Eurth forum first, then the usual places and the device's own share sheet. */
  let sharing = $state(false);

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
      <!-- Random is the suite's button in Flagwright's own look. It rolls at once over a flag that
           is nobody's work yet; over one that has been changed it turns red when pointed at, says
           so in its tooltip, and asks before the first roll. The span keeps the tooltip the button
           has always had for as long as there is nothing to lose. -->
      <span class="random" data-tip={changed ? undefined : 'A random flag that tries to look good'}>
        <RandomButton onrandom={random} guard={changed} what="flag" class="btn" />
      </span>
      <span class="history">
        <button class="btn icon-only" data-click="swing-left" onclick={undo} disabled={!past.length} aria-label="Undo" data-tip="Undo (Ctrl or ⌘ Z)">
          <Icon icon={faUndo} />
        </button>
        <button class="btn icon-only" data-click="swing-right" onclick={redo} disabled={!future.length} aria-label="Redo" data-tip="Redo (Shift Ctrl or ⌘ Z)">
          <Icon icon={faRedo} />
        </button>
      </span>
      <button class="btn btn-primary" data-click="bounce" onclick={save} data-tip="Save: copy the link, which holds the whole flag">
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
      <div class="pole" class:flying>
        <Stage {flag} {title} desc={description} editable={mode === 'advanced'} bind:selected {guides} {snap} ondelete={(id) => ((advanced.overlays = advanced.overlays.filter((o) => o.id !== id)), (selected = null))} />
      </div>
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
        <!-- Saving a file and copying are two things, so they are two rows, as they always were. -->
        <div class="buttons">
          <button class="btn btn-primary" data-click="bounce" onclick={saveSvg} data-tip="Sharp at any size: for wikis and print" data-tip-align="start">
            <Icon icon={faDownload} /> SVG
          </button>
          <span class="png">
            <button class="btn" data-click="bounce" onclick={() => savePicture('image/png')}><Icon icon={faImage} /> PNG</button>
            <button class="btn" data-click="bounce" onclick={() => savePicture('image/webp')}><Icon icon={faImage} /> WebP</button>
            <label>
              <span class="visually-hidden">Picture size</span>
              <select bind:value={shape}>
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
          </span>
          <button class="btn" data-click="bounce" onclick={saveMarkdown} data-tip="The flag in words: for the forum and wikis"><Icon icon={faMarkdown} /> Markdown</button>
        </div>
        <div class="buttons">
          <button class="btn" onclick={copyLink}><Icon icon={faLink} /> Copy link</button>
          <button class="btn" onclick={copyImage}><Icon icon={faCopy} /> Copy picture</button>
          <button class="btn" onclick={copyDescription}><Icon icon={faCopy} /> Copy description</button>
          <button class="btn" onclick={copyMarkdown}><Icon icon={faMarkdown} /> Copy Markdown</button>
          <button class="btn" onclick={() => (sharing = true)}><Icon icon={faShareNodes} /> Share</button>
        </div>
        <!-- The nation's profile file: the two buttons come from @eurth/profile and wear Flagwright's own button (app.css). -->
        <div class="buttons">
          <ProfileButtons profile={saved} onload={loaded} onerror={refused} />
        </div>
        {#if profile}
          <p class="more">
            <strong>{profile.meta.nation || 'Your nation'}</strong> is loaded. “Save profile” puts this flag in its file and leaves everything else in it as it was.
          </p>
        {/if}
        {#if !linkFits(profileLink)}
          <p class="more">This flag has so many layers that its link is too long for a profile file. The file will carry its picture and description; keep the link as well if you want to change the flag later.</p>
        {/if}
        <p class="more">The flag is yours. The link holds the whole design: nothing is stored on a server or in this browser. The profile file carries your nation from one Eurth tool to the next.</p>
      </section>
    </div>
  </div>
</div>

<!-- The suite's own window, in the suite's look. -->
<ShareDialog
  bind:open={sharing}
  url={link}
  {title}
  text={`${cleanedName ? `${title}. ` : ''}${description} Made with ${siteName}.`}
  heading={cleanedName ? `Share ${title.replace(/^Flag of /, 'the flag of ')}` : 'Share your flag'}
  oncopy={hoist}
/>

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

  .actions .btn,
  .actions :global(.btn) {
    height: 36px;
  }

  .random {
    display: inline-flex;
  }

  /* The tooltip used to hang from the button itself: from inside its 1px edge, and a pixel
     higher while the button rose under the pointer. It hangs in that same place still. */
  .random[data-tip]:hover::after {
    top: calc(100% + 5px);
    right: 1px;
  }

  @media (prefers-reduced-motion: no-preference) {
    :global(html:not([data-motion='still'])) .random[data-tip]:hover::after {
      top: calc(100% + 4px);
    }
  }

  /* Clicked, the dice tumble as Flagwright's own buttons do (the keyframes are in app.css). */
  @media (prefers-reduced-motion: no-preference) {
    .random :global(.eu-btn.eu-clicked .eu-icon) {
      animation: click-tumble 0.6s cubic-bezier(0.3, 1.2, 0.5, 1);
    }
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

  /* The list now also holds the suite's sharing sizes, whose names are longer. Where the browser
     can, the box stays as wide as it always was (the width of "3840 × 2560") and grows only
     when one of the longer names is chosen. */
  @supports (field-sizing: content) {
    .png select {
      field-sizing: content;
      min-width: 125px;
    }
  }

  /* The signature touch: the flag catches the wind for a moment when it leaves (see hoist()). */
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
</style>
