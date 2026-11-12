/**
 * The flag palette: the colours flags are actually made in, each with a plain name (used in the
 * written description) and a family (used to spot lookalikes of real flags). Any other colour can
 * be picked too; it is then named after its nearest neighbour here.
 */
export interface PaletteColor {
  name: string;
  hex: string;
  family: string;
}

export const palette: readonly PaletteColor[] = [
  { name: 'white', hex: '#ffffff', family: 'white' },
  { name: 'cream', hex: '#f5e6c8', family: 'white' },
  { name: 'silver', hex: '#c4c8cc', family: 'grey' },
  { name: 'grey', hex: '#7c8388', family: 'grey' },
  { name: 'black', hex: '#000000', family: 'black' },
  { name: 'brown', hex: '#6b3f1d', family: 'brown' },
  { name: 'maroon', hex: '#7b1e2b', family: 'red' },
  { name: 'red', hex: '#ce1126', family: 'red' },
  { name: 'orange', hex: '#ff7900', family: 'orange' },
  { name: 'saffron', hex: '#ff9933', family: 'orange' },
  { name: 'gold', hex: '#ffb81c', family: 'yellow' },
  { name: 'yellow', hex: '#fcd116', family: 'yellow' },
  { name: 'light green', hex: '#78be20', family: 'green' },
  { name: 'green', hex: '#009739', family: 'green' },
  { name: 'dark green', hex: '#005c2e', family: 'green' },
  { name: 'teal', hex: '#00847e', family: 'teal' },
  { name: 'sky blue', hex: '#6cace4', family: 'blue' },
  { name: 'Eurth blue', hex: '#2698d4', family: 'blue' },
  { name: 'blue', hex: '#0038a8', family: 'blue' },
  { name: 'navy', hex: '#0a1f5c', family: 'blue' },
  { name: 'purple', hex: '#5c2d91', family: 'purple' },
  { name: 'magenta', hex: '#c2185b', family: 'pink' },
  { name: 'pink', hex: '#f4a6c0', family: 'pink' },
  { name: 'tan', hex: '#c8a26b', family: 'brown' },
];

const HEX = /^#[0-9a-f]{6}$/;

/** A safe, lower-case #rrggbb colour, or the fallback. Everything drawn goes through this. */
export function cleanColor(value: unknown, fallback = '#ffffff'): string {
  if (typeof value !== 'string') return fallback;
  let v = value.trim().toLowerCase();
  if (!v.startsWith('#')) v = `#${v}`;
  if (/^#[0-9a-f]{3}$/.test(v)) v = `#${v[1]}${v[1]}${v[2]}${v[2]}${v[3]}${v[3]}`;
  return HEX.test(v) ? v : fallback;
}

export function rgb(hex: string): [number, number, number] {
  return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as [number, number, number];
}

/** Relative luminance, as WCAG defines it. */
export function luminance(hex: string): number {
  const [r, g, b] = rgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Contrast ratio between two colours, from 1 (the same) to 21 (black on white). */
export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

/** The palette colour nearest to any colour ("redmean" distance: cheap, and close to the eye). */
export function nearest(hex: string): PaletteColor {
  const [r, g, b] = rgb(hex);
  let best = palette[0]!;
  let bestD = Infinity;
  for (const p of palette) {
    const [pr, pg, pb] = rgb(p.hex);
    const rm = (r + pr) / 2;
    const d = (2 + rm / 256) * (r - pr) ** 2 + 4 * (g - pg) ** 2 + (2 + (255 - rm) / 256) * (b - pb) ** 2;
    if (d < bestD) {
      bestD = d;
      best = p;
    }
  }
  return best;
}

export const colorName = (hex: string): string => nearest(hex).name;
export const colorFamily = (hex: string): string => nearest(hex).family;

/** Black or white, whichever reads better on this colour (for check marks on swatches). */
export const inkOn = (hex: string): string => (luminance(hex) > 0.4 ? '#000000' : '#ffffff');
