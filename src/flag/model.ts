/**
 * A flag, as data: its proportions, how the field is divided, and the layers laid over it, from
 * the bottom up. Positions and sizes are percentages, so a flag keeps its design when its
 * proportions change: x and w of the flag's width, y, h, size and thickness of its height.
 */
export type Division =
  | { type: 'bands'; dir: 'h' | 'v'; bands: Band[] }
  | { type: 'grid'; cols: number; rows: number; colors: [string, string] }
  | { type: 'bend'; dir: 'down' | 'up'; colors: [string, string] }
  | { type: 'saltire'; colors: [string, string] }
  | { type: 'gyronny'; rays: number; colors: [string, string] };

export interface Band {
  color: string;
  weight: number;
}

export type DivisionType = Division['type'];

export const overlayTypes = [
  'cross',
  'saltire',
  'border',
  'hbar',
  'vbar',
  'bend',
  'bendSinister',
  'pall',
  'pile',
  'rect',
  'disc',
  'ring',
  'lozenge',
  'triangle',
  'star',
  'starRing',
  'crescent',
  'sun',
  'emblem',
] as const;

export type OverlayType = (typeof overlayTypes)[number];

/** The numbers a layer can carry. Each type uses a few of them (see overlayDefs). */
export const numKeys = ['x', 'y', 'size', 'w', 'h', 'thickness', 'rot', 'points', 'inner', 'count', 'starSize'] as const;
export type NumKey = (typeof numKeys)[number];

export interface Overlay extends Partial<Record<NumKey, number>> {
  /** Unique within the flag; only for the editor. */
  id: string;
  type: OverlayType;
  color: string;
  /** For emblems: which one (see emblems.ts). */
  icon?: string;
  /** For emblems: facing the other way. */
  mirror?: boolean;
  hidden?: boolean;
}

export interface Flag {
  /** Height to width, as vexillologists write it: 2:3 is two high, three wide. */
  ratio: [number, number];
  division: Division;
  overlays: Overlay[];
}

export interface ParamDef {
  key: NumKey;
  label: string;
  min: number;
  max: number;
  step?: number;
  unit?: string;
}

export interface OverlayDef {
  type: OverlayType;
  name: string;
  group: 'Ordinaries' | 'Shapes' | 'Charges';
  /** One line for the picker: what it is, and a flag that has one. */
  hint: string;
  params: ParamDef[];
  defaults: Partial<Record<NumKey, number>>;
}

const X: ParamDef = { key: 'x', label: 'Across', min: -20, max: 120, unit: '%' };
const Y: ParamDef = { key: 'y', label: 'Down', min: -20, max: 120, unit: '%' };
const SIZE: ParamDef = { key: 'size', label: 'Size', min: 2, max: 150, unit: '%' };
const THICK: ParamDef = { key: 'thickness', label: 'Thickness', min: 1, max: 80, unit: '%' };
const ROT: ParamDef = { key: 'rot', label: 'Rotation', min: -180, max: 180, unit: '°' };
const W: ParamDef = { key: 'w', label: 'Width', min: 1, max: 150, unit: '%' };
const H: ParamDef = { key: 'h', label: 'Height', min: 1, max: 150, unit: '%' };

export const overlayDefs: readonly OverlayDef[] = [
  { type: 'cross', name: 'Cross', group: 'Ordinaries', hint: 'Edge to edge. Move it towards the hoist for a Nordic cross.', params: [X, Y, THICK], defaults: { x: 50, y: 50, thickness: 18 } },
  { type: 'saltire', name: 'Saltire', group: 'Ordinaries', hint: 'A diagonal cross, corner to corner, as on Scotland’s flag.', params: [THICK], defaults: { thickness: 16 } },
  { type: 'border', name: 'Border', group: 'Ordinaries', hint: 'A frame around the field, as on the Maldives’ flag.', params: [THICK], defaults: { thickness: 10 } },
  { type: 'hbar', name: 'Fess (horizontal bar)', group: 'Ordinaries', hint: 'A bar across the field, hoist to fly.', params: [Y, THICK], defaults: { y: 50, thickness: 20 } },
  { type: 'vbar', name: 'Pale (vertical bar)', group: 'Ordinaries', hint: 'A bar from top to bottom. At the hoist it makes a hoist band.', params: [X, THICK], defaults: { x: 50, thickness: 30 } },
  { type: 'bend', name: 'Bend', group: 'Ordinaries', hint: 'A diagonal band from the upper hoist to the lower fly.', params: [THICK], defaults: { thickness: 22 } },
  { type: 'bendSinister', name: 'Bend sinister', group: 'Ordinaries', hint: 'A diagonal band from the lower hoist to the upper fly.', params: [THICK], defaults: { thickness: 22 } },
  { type: 'pall', name: 'Pall', group: 'Ordinaries', hint: 'A Y on its side, as on South Africa’s flag.', params: [{ ...X, label: 'Meeting point', min: 5, max: 95 }, THICK], defaults: { x: 40, thickness: 20 } },
  { type: 'pile', name: 'Hoist triangle', group: 'Ordinaries', hint: 'A triangle based on the hoist, as on Czechia’s flag.', params: [{ ...W, label: 'Depth' }, { ...H, label: 'Base' }, { ...Y, min: 0, max: 100 }], defaults: { w: 40, h: 100, y: 50 } },
  { type: 'rect', name: 'Rectangle / canton', group: 'Shapes', hint: 'In the upper hoist corner it makes a canton.', params: [X, Y, W, H, ROT], defaults: { x: 25, y: 25, w: 50, h: 50, rot: 0 } },
  { type: 'disc', name: 'Disc', group: 'Shapes', hint: 'A filled circle, as on Japan’s flag. Stretch it into an ellipse.', params: [X, Y, SIZE, { key: 'w', label: 'Stretch', min: 25, max: 400, unit: '%' }], defaults: { x: 50, y: 50, size: 60, w: 100 } },
  { type: 'ring', name: 'Ring', group: 'Shapes', hint: 'An open circle.', params: [X, Y, SIZE, { ...THICK, max: 40 }], defaults: { x: 50, y: 50, size: 60, thickness: 6 } },
  { type: 'lozenge', name: 'Lozenge', group: 'Shapes', hint: 'A diamond, as on Brazil’s flag.', params: [X, Y, W, H, ROT], defaults: { x: 50, y: 50, w: 80, h: 80, rot: 0 } },
  { type: 'triangle', name: 'Triangle', group: 'Shapes', hint: 'A free triangle: move, size and turn it.', params: [X, Y, W, H, ROT], defaults: { x: 50, y: 50, w: 40, h: 50, rot: 0 } },
  { type: 'star', name: 'Star', group: 'Charges', hint: 'Any number of points, sharp or blunt.', params: [X, Y, SIZE, { key: 'points', label: 'Points', min: 3, max: 24 }, { key: 'inner', label: 'Sharpness', min: 10, max: 95, unit: '%' }, ROT], defaults: { x: 50, y: 50, size: 40, points: 5, inner: 38, rot: 0 } },
  { type: 'starRing', name: 'Ring of stars', group: 'Charges', hint: 'Stars in a circle, as on the flag of Europe.', params: [X, Y, SIZE, { key: 'count', label: 'Stars', min: 2, max: 50 }, { key: 'starSize', label: 'Star size', min: 2, max: 40, unit: '%' }, { key: 'points', label: 'Points', min: 3, max: 12 }, ROT], defaults: { x: 50, y: 50, size: 60, count: 12, starSize: 9, points: 5, rot: 0 } },
  { type: 'crescent', name: 'Crescent', group: 'Charges', hint: 'A moon. Turn it to open towards the fly, the hoist or the sky.', params: [X, Y, SIZE, { key: 'inner', label: 'Fullness', min: 55, max: 92, unit: '%' }, ROT], defaults: { x: 50, y: 50, size: 50, inner: 80, rot: 0 } },
  { type: 'sun', name: 'Sun', group: 'Charges', hint: 'A disc with rays, as on Argentina’s or North Macedonia’s flag.', params: [X, Y, SIZE, { key: 'points', label: 'Rays', min: 4, max: 48 }, ROT], defaults: { x: 50, y: 50, size: 50, points: 16, rot: 0 } },
  { type: 'emblem', name: 'Emblem', group: 'Charges', hint: 'A symbol from the library: beasts, tools, crowns and more.', params: [X, Y, SIZE, ROT], defaults: { x: 50, y: 50, size: 45, rot: 0 } },
];

export const overlayDef = (type: OverlayType): OverlayDef => overlayDefs.find((d) => d.type === type)!;

/** Whether a layer can be dragged around the flag. */
export const movable = (type: OverlayType): boolean => overlayDef(type).params.some((p) => p.key === 'x' || p.key === 'y');

let counter = 0;
/** An id for a new layer: unique within this visit, which is all the editor needs. */
export const uid = (): string => `l${Date.now().toString(36)}${(counter++).toString(36)}`;

export function newOverlay(type: OverlayType, color: string, extra: Partial<Overlay> = {}): Overlay {
  return { id: uid(), type, color, ...overlayDef(type).defaults, ...(type === 'emblem' ? { icon: 'crown' } : {}), ...extra };
}

export const defaultFlag = (): Flag => ({
  ratio: [2, 3],
  division: {
    type: 'bands',
    dir: 'h',
    bands: [
      { color: '#2698d4', weight: 1 },
      { color: '#ffffff', weight: 1 },
      { color: '#2698d4', weight: 1 },
    ],
  },
  overlays: [],
});

/** Common proportions, with a flag that flies each. */
export const ratios: readonly { ratio: [number, number]; note: string }[] = [
  { ratio: [2, 3], note: 'the most common: France, Japan, Italy' },
  { ratio: [1, 2], note: 'long: the United Kingdom, Canada, Australia' },
  { ratio: [3, 5], note: 'Germany, the Netherlands (2:3 on paper)' },
  { ratio: [10, 19], note: 'the United States' },
  { ratio: [5, 8], note: 'Sweden, Poland, Argentina' },
  { ratio: [8, 11], note: 'Norway, Israel' },
  { ratio: [4, 5], note: 'nearly square: Eurth forum avatars' },
  { ratio: [1, 1], note: 'square: Switzerland, Vatican City' },
  { ratio: [3, 2], note: 'upright: banners and gonfalons' },
];

/** All the colours a flag shows, most used first (hidden layers left out). */
export function colorsOf(flag: Flag): string[] {
  const d = flag.division;
  const field = d.type === 'bands' ? d.bands.map((b) => b.color) : [...d.colors];
  const all = [...field, ...flag.overlays.filter((o) => !o.hidden).map((o) => o.color)];
  return [...new Set(all)];
}
