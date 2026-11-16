<script lang="ts">
  import type { IconDefinition } from '@fortawesome/free-solid-svg-icons';

  // Font Awesome Free icons (CC BY 4.0), the set eurth.org uses. Decorative unless given a label.
  // `draw` measures the outline as 1, so CSS can draw it stroke by stroke, the way line-md does.
  let { icon, label = '', draw = false }: { icon: IconDefinition; label?: string; draw?: boolean } = $props();
  const width = $derived(icon.icon[0]);
  const height = $derived(icon.icon[1]);
  const path = $derived(icon.icon[4]);
</script>

<svg
  class="icon"
  viewBox="0 0 {width} {height}"
  role={label ? 'img' : undefined}
  aria-label={label || undefined}
  aria-hidden={label ? undefined : 'true'}
  focusable="false"
>
  <path fill="currentColor" d={Array.isArray(path) ? path.join(' ') : path} pathLength={draw ? 1 : undefined} />
</svg>

<style>
  .icon {
    height: 1em;
    width: auto;
    flex: none;
    vertical-align: -0.125em;
  }
</style>
