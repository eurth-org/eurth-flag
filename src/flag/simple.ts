/**
 * Simple mode: a flag in four choices. Pick a division, an overlay and a symbol, and colour
 * each; `fromSimple` turns the choices into a full flag, which Advanced mode can then take
 * further. Every choice is a preset below, so adding one is adding a line.
 */
import { emblem } from './emblems';
import { newOverlay, type Division, type Flag, type Overlay } from './model';

export type Position = 'centre' | 'canton' | 'hoist' | 'fly';
export type Scale = 's' | 'm' | 'l';

export interface Simple {
  /** Division preset, and its three colours (presets use the first one, two or three). */
  division: string;
  colors: [string, string, string];
  overlay: string;
  overlayColor: string;
  symbol: string;
  symbolColor: string;
  position: Position;
  scale: Scale;
  ratio: [number, number];
}

export interface DivisionPreset {
  id: string;
  name: string;
  /** How many of the three colours it shows. */
  uses: 1 | 2 | 3;
  make: (c: [string, string, string]) => Division;
}

const bands = (dir: 'h' | 'v', colors: string[], weights?: number[]): Division => ({
  type: 'bands',
  dir,
  bands: colors.map((color, i) => ({ color, weight: weights?.[i] ?? 1 })),
});
const stripes = (n: number, a: string, b: string): string[] => Array.from({ length: n }, (_, i) => (i % 2 ? b : a));

export const divisionPresets: readonly DivisionPreset[] = [
  { id: 'solid', name: 'Plain field', uses: 1, make: ([a]) => bands('h', [a]) },
  { id: 'h2', name: 'Horizontal bicolour', uses: 2, make: ([a, b]) => bands('h', [a, b]) },
  { id: 'h3', name: 'Horizontal tricolour', uses: 3, make: ([a, b, c]) => bands('h', [a, b, c]) },
  { id: 'h-triband', name: 'Horizontal triband', uses: 2, make: ([a, b]) => bands('h', [a, b, a]) },
  { id: 'h-fess', name: 'Spanish fess (1:2:1)', uses: 3, make: ([a, b, c]) => bands('h', [a, b, c], [1, 2, 1]) },
  { id: 'h-edged', name: 'Edged band (1:1:2:1:1)', uses: 3, make: ([a, b, c]) => bands('h', [a, b, c, b, a], [1, 1, 2, 1, 1]) },
  { id: 'h5', name: 'Five stripes', uses: 2, make: ([a, b]) => bands('h', stripes(5, a, b)) },
  { id: 'h7', name: 'Seven stripes', uses: 2, make: ([a, b]) => bands('h', stripes(7, a, b)) },
  { id: 'h9', name: 'Nine stripes', uses: 2, make: ([a, b]) => bands('h', stripes(9, a, b)) },
  { id: 'h13', name: 'Thirteen stripes', uses: 2, make: ([a, b]) => bands('h', stripes(13, a, b)) },
  { id: 'v2', name: 'Vertical bicolour', uses: 2, make: ([a, b]) => bands('v', [a, b]) },
  { id: 'v3', name: 'Vertical tricolour', uses: 3, make: ([a, b, c]) => bands('v', [a, b, c]) },
  { id: 'v-triband', name: 'Vertical triband', uses: 2, make: ([a, b]) => bands('v', [a, b, a]) },
  { id: 'v-pale', name: 'Canadian pale (1:2:1)', uses: 3, make: ([a, b, c]) => bands('v', [a, b, c], [1, 2, 1]) },
  { id: 'v-hoist', name: 'Hoist band (1:3)', uses: 2, make: ([a, b]) => bands('v', [a, b], [1, 3]) },
  { id: 'quarters', name: 'Quartered', uses: 2, make: ([a, b]) => ({ type: 'grid', cols: 2, rows: 2, colors: [a, b] }) },
  { id: 'chequy', name: 'Chequered', uses: 2, make: ([a, b]) => ({ type: 'grid', cols: 6, rows: 4, colors: [a, b] }) },
  { id: 'bend-down', name: 'Per bend', uses: 2, make: ([a, b]) => ({ type: 'bend', dir: 'down', colors: [a, b] }) },
  { id: 'bend-up', name: 'Per bend sinister', uses: 2, make: ([a, b]) => ({ type: 'bend', dir: 'up', colors: [a, b] }) },
  { id: 'saltire', name: 'Per saltire', uses: 2, make: ([a, b]) => ({ type: 'saltire', colors: [a, b] }) },
  { id: 'gyronny8', name: 'Gyronny of eight', uses: 2, make: ([a, b]) => ({ type: 'gyronny', rays: 8, colors: [a, b] }) },
  { id: 'gyronny16', name: 'Rising sun rays', uses: 2, make: ([a, b]) => ({ type: 'gyronny', rays: 16, colors: [a, b] }) },
];

export interface OverlayPreset {
  id: string;
  name: string;
  make: (color: string) => Overlay[];
}

export const overlayPresets: readonly OverlayPreset[] = [
  { id: 'none', name: 'No overlay', make: () => [] },
  { id: 'cross', name: 'Cross', make: (c) => [newOverlay('cross', c)] },
  { id: 'nordic', name: 'Nordic cross', make: (c) => [newOverlay('cross', c, { x: 36, thickness: 16 })] },
  { id: 'saltire', name: 'Saltire', make: (c) => [newOverlay('saltire', c)] },
  { id: 'cross-saltire', name: 'Cross and saltire', make: (c) => [newOverlay('saltire', c, { thickness: 10 }), newOverlay('cross', c, { thickness: 16 })] },
  { id: 'border', name: 'Border', make: (c) => [newOverlay('border', c)] },
  { id: 'canton', name: 'Canton', make: (c) => [newOverlay('rect', c)] },
  { id: 'pile', name: 'Hoist triangle', make: (c) => [newOverlay('pile', c)] },
  { id: 'pile-long', name: 'Long hoist triangle', make: (c) => [newOverlay('pile', c, { w: 100 })] },
  { id: 'hoist-band', name: 'Hoist band', make: (c) => [newOverlay('vbar', c, { x: 14, thickness: 28 })] },
  { id: 'fess', name: 'Fess', make: (c) => [newOverlay('hbar', c)] },
  { id: 'pale', name: 'Pale', make: (c) => [newOverlay('vbar', c)] },
  { id: 'bend', name: 'Bend', make: (c) => [newOverlay('bend', c)] },
  { id: 'bend-sinister', name: 'Bend sinister', make: (c) => [newOverlay('bendSinister', c)] },
  { id: 'pall', name: 'Pall', make: (c) => [newOverlay('pall', c)] },
  { id: 'disc', name: 'Disc', make: (c) => [newOverlay('disc', c)] },
  { id: 'lozenge', name: 'Lozenge', make: (c) => [newOverlay('lozenge', c)] },
];

export interface SymbolPreset {
  id: string;
  name: string;
}

/** Drawn symbols first; every emblem in the library follows, as `e-<id>`. */
export const symbolPresets: readonly SymbolPreset[] = [
  { id: 'none', name: 'No symbol' },
  { id: 'star5', name: 'Five-pointed star' },
  { id: 'star6', name: 'Six-pointed star' },
  { id: 'star8', name: 'Eight-pointed star' },
  { id: 'star12', name: 'Twelve-pointed star' },
  { id: 'crescent', name: 'Crescent' },
  { id: 'sun', name: 'Sun' },
  { id: 'ring', name: 'Ring' },
  { id: 'star-ring', name: 'Ring of stars' },
  { id: 'disc', name: 'Disc' },
  { id: 'lozenge', name: 'Lozenge' },
];

const sizes: Record<Scale, number> = { s: 26, m: 42, l: 62 };

/** Where a symbol goes, and how much room it has there (as a share of its size elsewhere). */
function place(position: Position, overlay: string): { x: number; y: number; room: number } {
  if (position === 'canton') return { x: 25, y: 25, room: 0.62 };
  if (position === 'hoist') {
    if (overlay === 'pile') return { x: 14, y: 50, room: 0.6 };
    if (overlay === 'hoist-band') return { x: 14, y: 50, room: 0.55 };
    return { x: 22, y: 50, room: 0.8 };
  }
  if (position === 'fly') return { x: 75, y: 50, room: 0.8 };
  return { x: overlay === 'nordic' ? 36 : 50, y: 50, room: 1 };
}

function symbolOverlays(s: Simple): Overlay[] {
  if (s.symbol === 'none') return [];
  const { x, y, room } = place(s.position, s.overlay);
  const size = Math.round(sizes[s.scale] * room);
  const at = { x, y, size };
  const c = s.symbolColor;
  const star = s.symbol.match(/^star(\d+)$/);
  if (star) {
    const points = Number(star[1]);
    return [newOverlay('star', c, { ...at, points, inner: points === 5 ? 38 : points === 6 ? 58 : 50 })];
  }
  switch (s.symbol) {
    case 'crescent':
      return [newOverlay('crescent', c, at)];
    case 'sun':
      return [newOverlay('sun', c, at)];
    case 'ring':
      return [newOverlay('ring', c, { ...at, thickness: Math.max(3, Math.round(size / 7)) })];
    case 'star-ring':
      return [newOverlay('starRing', c, { ...at, starSize: Math.max(4, Math.round(size / 6.5)) })];
    case 'disc':
      return [newOverlay('disc', c, at)];
    case 'lozenge':
      return [newOverlay('lozenge', c, { x, y, w: Math.round(size * 0.8), h: size })];
  }
  const id = s.symbol.replace(/^e-/, '');
  return emblem(id) ? [newOverlay('emblem', c, { ...at, icon: id })] : [];
}

export function fromSimple(s: Simple): Flag {
  const division = (divisionPresets.find((p) => p.id === s.division) ?? divisionPresets[0]!).make(s.colors);
  const overlay = (overlayPresets.find((p) => p.id === s.overlay) ?? overlayPresets[0]!).make(s.overlayColor);
  return { ratio: [...s.ratio], division, overlays: [...overlay, ...symbolOverlays(s)] };
}

export const defaultSimple = (): Simple => ({
  division: 'h-triband',
  colors: ['#2698d4', '#ffffff', '#fcd116'],
  overlay: 'none',
  overlayColor: '#fcd116',
  symbol: 'star5',
  symbolColor: '#0a1f5c',
  position: 'centre',
  scale: 'm',
  ratio: [2, 3],
});

/** Whether a symbol id is one simple mode knows. */
export function knownSymbol(id: string): boolean {
  return symbolPresets.some((p) => p.id === id) || (id.startsWith('e-') && !!emblem(id.slice(2)));
}
