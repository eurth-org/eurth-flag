<script lang="ts">
  /*
   * Light, dark and auto, after Deluminator (github.com/stijn/deluminator) as used in
   * eurth-news: going dark, the lit page shrinks into the switch; going light, it grows back out.
   * Auto, as on Eurth's forum, follows the device. Each click moves on: from auto it first flips
   * the page, then keeps the device's look even if the device changes, then returns to auto.
   * The choice is remembered; auto is remembered by forgetting it. The head script in
   * layouts/Base.astro sets the theme before the page paints.
   */
  import { faCircleHalfStroke, faMoon, faSun } from '@fortawesome/free-solid-svg-icons';
  import { onMount } from 'svelte';
  import { toast } from './fun';
  import Icon from './Icon.svelte';

  const key = 'flagwright:theme';
  const chrome = { light: '#ffffff', dark: '#002b36' };

  // Sun and moon from Deluminator (line-md by Vjacheslav Trushkin, MIT): they draw themselves
  // on each switch, then the sun's rays turn slowly and the stars twinkle. Visitors who prefer
  // reduced motion get still icons.
  const sun =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="2"><path stroke-dasharray="34" stroke-dashoffset="34" d="M12 7C14.76 7 17 9.24 17 12C17 14.76 14.76 17 12 17C9.24 17 7 14.76 7 12C7 9.24 9.24 7 12 7"><animate fill="freeze" attributeName="stroke-dashoffset" dur="0.4s" values="34;0"/></path><g stroke-dasharray="2" stroke-dashoffset="2"><path d="M0 0"><animate fill="freeze" attributeName="d" begin="0.5s" dur="0.2s" values="M12 19v1M19 12h1M12 5v-1M5 12h-1;M12 21v1M21 12h1M12 3v-1M3 12h-1"/><animate fill="freeze" attributeName="stroke-dashoffset" begin="0.5s" dur="0.2s" values="2;0"/></path><path d="M0 0"><animate fill="freeze" attributeName="d" begin="0.7s" dur="0.2s" values="M17 17l0.5 0.5M17 7l0.5 -0.5M7 7l-0.5 -0.5M7 17l-0.5 0.5;M18.5 18.5l0.5 0.5M18.5 5.5l0.5 -0.5M5.5 5.5l-0.5 -0.5M5.5 18.5l-0.5 0.5"/><animate fill="freeze" attributeName="stroke-dashoffset" begin="0.7s" dur="0.2s" values="2;0"/></path><animateTransform attributeName="transform" dur="30s" repeatCount="indefinite" type="rotate" values="0 12 12;360 12 12"/></g></g></svg>';
  const moon =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><g stroke-dasharray="2"><path d="M12 21v1M21 12h1M12 3v-1M3 12h-1"><animate fill="freeze" attributeName="stroke-dashoffset" dur="0.2s" values="4;2"/></path><path d="M18.5 18.5l0.5 0.5M18.5 5.5l0.5 -0.5M5.5 5.5l-0.5 -0.5M5.5 18.5l-0.5 0.5"><animate fill="freeze" attributeName="stroke-dashoffset" begin="0.2s" dur="0.2s" values="4;2"/></path></g><path d="M7 6 C7 12.08 11.92 17 18 17 C18.53 17 19.05 16.96 19.56 16.89 C17.95 19.36 15.17 21 12 21 C7.03 21 3 16.97 3 12 C3 8.83 4.64 6.05 7.11 4.44 C7.04 4.95 7 5.47 7 6 Z" opacity="0"><set attributeName="opacity" begin="0.5s" to="1"/></path></g><g fill="currentColor" fill-opacity="0"><path d="m15.22 6.03l2.53-1.94L14.56 4L13.5 1l-1.06 3l-3.19.09l2.53 1.94l-.91 3.06l2.63-1.81l2.63 1.81z"><animate id="deluminatorStars0" fill="freeze" attributeName="fill-opacity" begin="0.6s;deluminatorStars0.begin+6s" dur="0.4s" values="0;1"/><animate fill="freeze" attributeName="fill-opacity" begin="deluminatorStars0.begin+2.2s" dur="0.4s" values="1;0"/></path><path d="M13.61 5.25L15.25 4l-2.06-.05L12.5 2l-.69 1.95L9.75 4l1.64 1.25l-.59 1.98l1.7-1.17l1.7 1.17z"><animate fill="freeze" attributeName="fill-opacity" begin="deluminatorStars0.begin+3s" dur="0.4s" values="0;1"/><animate fill="freeze" attributeName="fill-opacity" begin="deluminatorStars0.begin+5.2s" dur="0.4s" values="1;0"/></path><path d="M19.61 12.25L21.25 11l-2.06-.05L18.5 9l-.69 1.95l-2.06.05l1.64 1.25l-.59 1.98l1.7-1.17l1.7 1.17z"><animate fill="freeze" attributeName="fill-opacity" begin="deluminatorStars0.begin+0.4s" dur="0.4s" values="0;1"/><animate fill="freeze" attributeName="fill-opacity" begin="deluminatorStars0.begin+2.8s" dur="0.4s" values="1;0"/></path><path d="m20.828 9.731l1.876-1.439l-2.366-.067L19.552 6l-.786 2.225l-2.366.067l1.876 1.439L17.601 12l1.951-1.342L21.503 12z"><animate fill="freeze" attributeName="fill-opacity" begin="deluminatorStars0.begin+3.4s" dur="0.4s" values="0;1"/><animate fill="freeze" attributeName="fill-opacity" begin="deluminatorStars0.begin+5.6s" dur="0.4s" values="1;0"/></path></g><mask id="deluminatorMoonMask"><circle cx="12" cy="12" r="12" fill="#fff"/><circle cx="12" cy="12" r="4"><animate fill="freeze" attributeName="r" begin="0.1s" dur="0.4s" values="4;8"/></circle><circle cx="22" cy="2" r="3" fill="#fff"><animate fill="freeze" attributeName="cx" begin="0.1s" dur="0.4s" values="22;18"/><animate fill="freeze" attributeName="cy" begin="0.1s" dur="0.4s" values="2;6"/><animate fill="freeze" attributeName="r" begin="0.1s" dur="0.4s" values="3;12"/></circle><circle cx="22" cy="2" r="1"><animate fill="freeze" attributeName="cx" begin="0.1s" dur="0.4s" values="22;18"/><animate fill="freeze" attributeName="cy" begin="0.1s" dur="0.4s" values="2;6"/><animate fill="freeze" attributeName="r" begin="0.1s" dur="0.4s" values="1;10"/></circle></mask><circle cx="12" cy="12" r="6" fill="currentColor" mask="url(#deluminatorMoonMask)"><set attributeName="opacity" begin="0.5s" to="0"/><animate fill="freeze" attributeName="r" begin="0.1s" dur="0.4s" values="6;10"/></circle></svg>';

  // Auto: a circle, half filled, drawn in the same hand.
  const auto =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="57" stroke-dashoffset="57"><animate fill="freeze" attributeName="stroke-dashoffset" dur="0.4s" values="57;0"/></circle><path d="M12 3a9 9 0 0 0 0 18z" fill="currentColor" opacity="0"><animate fill="freeze" attributeName="opacity" begin="0.4s" dur="0.25s" values="0;1"/></path></svg>';

  type Mode = 'auto' | 'light' | 'dark';
  const root = document.documentElement;
  const system = matchMedia('(prefers-color-scheme: dark)');
  let dark = $state(root.dataset.theme === 'dark');
  let mode = $state<Mode>(saved());
  // Pointing at the switch draws its icon again.
  let drawn = $state(0);
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let button: HTMLButtonElement;

  function saved(): Mode {
    try {
      const value = localStorage.getItem(key);
      return value === 'light' || value === 'dark' ? value : 'auto';
    } catch {
      return 'auto';
    }
  }

  function remember(next: Mode) {
    try {
      if (next === 'auto') localStorage.removeItem(key);
      else localStorage.setItem(key, next);
    } catch {
      // Private mode: the switch still works for this visit.
    }
  }

  /** What the next click does: from auto, flip; then keep the device's look; then auto again. */
  function after(current: Mode): Mode {
    const device: Mode = system.matches ? 'dark' : 'light';
    if (current === 'auto') return device === 'dark' ? 'light' : 'dark';
    return current === device ? 'auto' : device;
  }

  const names: Record<Mode, string> = {
    auto: 'Auto: light or dark, as your device is set',
    light: 'Light, always',
    dark: 'Dark, always',
  };
  const next = $derived(after(mode));
  const label = $derived(`${names[mode]}. Click for ${next}.`);

  function paint(next: boolean) {
    dark = next;
    root.dataset.theme = next ? 'dark' : 'light';
    document.getElementById('theme-color')?.setAttribute('content', next ? chrome.dark : chrome.light);
  }

  function stillMotion(): boolean {
    return matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function toggle(event: MouseEvent) {
    mode = next;
    remember(mode);
    // Going back to auto usually changes nothing on screen, so say what happened.
    if (mode === 'auto') toast(`${names.auto}.`);
    const goal = mode === 'auto' ? system.matches : mode === 'dark';
    if (goal === dark) return;
    if (!document.startViewTransition || stillMotion()) {
      paint(goal);
      return;
    }
    // Keyboard activation reports 0,0: start from the middle of the switch instead.
    const r = button.getBoundingClientRect();
    const x = event.clientX || r.left + r.width / 2;
    const y = event.clientY || r.top + r.height / 2;
    const far = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    // The circle itself is drawn by app.css, from these: where it starts, and how far it reaches.
    // Its last frame holds (fill-mode forwards), so the old page never shows again for a moment.
    root.style.setProperty('--vt-x', `${x}px`);
    root.style.setProperty('--vt-y', `${y}px`);
    root.style.setProperty('--vt-r', `${far}px`);
    root.classList.add(goal ? 'vt-shrink' : 'vt-grow');
    const transition = document.startViewTransition(() => paint(goal));
    transition.finished.finally(() => root.classList.remove('vt-grow', 'vt-shrink'));
  }

  onMount(() => {
    const follow = (e: MediaQueryListEvent) => {
      if (mode === 'auto') paint(e.matches);
    };
    // Another tab changed it: follow along.
    const sync = (e: StorageEvent) => {
      if (e.key !== key) return;
      mode = saved();
      paint(mode === 'auto' ? system.matches : mode === 'dark');
    };
    system.addEventListener('change', follow);
    addEventListener('storage', sync);
    return () => {
      system.removeEventListener('change', follow);
      removeEventListener('storage', sync);
    };
  });
</script>

<button
  bind:this={button}
  class="btn switch"
  aria-label="Theme: {label}"
  data-tip={label}
  onclick={toggle}
  onpointerenter={() => (drawn += 1)}
>
  {#if still}
    <Icon icon={mode === 'auto' ? faCircleHalfStroke : dark ? faMoon : faSun} />
  {:else}
    {#key `${mode}-${dark}-${drawn}`}
      <!-- A fresh copy replays the drawing animation. -->
      {@html mode === 'auto' ? auto : dark ? moon : sun}
    {/key}
  {/if}
</button>

<style>
  .switch {
    justify-content: center;
    width: 38px;
    height: 34px;
    padding: 0;
  }

  .switch :global(svg) {
    width: 20px;
    height: 20px;
  }
</style>
