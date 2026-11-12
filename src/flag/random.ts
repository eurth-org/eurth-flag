/**
 * Random flags that try to look like flags: colours come from schemes real flags use, symbols
 * are picked to stand out from what they lie on, and most flags stay simple. Works in simple
 * mode's terms, so a random flag can be adjusted with the same few choices.
 */
import { contrast } from './colors';
import { emblems } from './emblems';
import { divisionColorAt } from './review';
import { divisionPresets, fromSimple, overlayPresets, type Position, type Scale, type Simple } from './simple';

const W = '#ffffff';
const K = '#000000';
/** Colour schemes, each a set that sits well together. */
const schemes: readonly string[][] = [
  ['#ce1126', W, '#0038a8'],
  ['#0a1f5c', W, '#ce1126'],
  ['#009739', '#fcd116', '#ce1126'],
  [K, '#ce1126', '#fcd116'],
  ['#009739', W, '#ff7900'],
  ['#0038a8', '#fcd116', W],
  ['#0a1f5c', '#ffb81c', W],
  ['#2698d4', W, '#fcd116'],
  ['#6cace4', W, '#0a1f5c'],
  ['#005c2e', W, '#ce1126'],
  ['#7b1e2b', '#ffb81c', W],
  ['#5c2d91', W, '#ffb81c'],
  ['#ce1126', '#fcd116', K],
  ['#00847e', W, K],
  ['#ff7900', W, '#0038a8'],
  [K, W, '#ce1126'],
  ['#009739', K, '#fcd116'],
  ['#0038a8', W, '#009739'],
  ['#ce1126', W, '#005c2e'],
  ['#0a1f5c', '#6cace4', W],
];

export type Rng = () => number;

const pick = <T>(rng: Rng, list: readonly T[]): T => list[Math.floor(rng() * list.length)]!;

/** Picks by weight: [value, weight] pairs. */
function weighted<T>(rng: Rng, list: readonly (readonly [T, number])[]): T {
  const total = list.reduce((sum, [, w]) => sum + w, 0);
  let at = rng() * total;
  for (const [value, w] of list) {
    at -= w;
    if (at <= 0) return value;
  }
  return list[0]![0];
}

function shuffled<T>(rng: Rng, list: readonly T[]): T[] {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

const symbols: readonly (readonly [string, number])[] = [
  ['star5', 9],
  ['star6', 2],
  ['star8', 2],
  ['crescent', 3],
  ['sun', 5],
  ['star-ring', 3],
  ['ring', 1],
  ['disc', 3],
  ['lozenge', 1],
];

export function randomSimple(rng: Rng = Math.random): Simple {
  const colors = shuffled(rng, pick(rng, schemes)) as [string, string, string];
  const division = weighted(rng, divisionPresets.map((p) => [p.id, p.id === 'solid' ? 5 : /^h1?[3579]$|chequy|gyronny/.test(p.id) ? 1 : 3] as const));
  const plainField = division === 'solid';
  // A plain field wants an overlay; a busy one is better left alone.
  const overlay = rng() < (plainField ? 0.75 : 0.3) ? pick(rng, overlayPresets.filter((p) => p.id !== 'none')).id : 'none';
  const symbol = rng() < (overlay === 'none' ? 0.7 : 0.5) ? (rng() < 0.3 ? `e-${pick(rng, emblems).id}` : weighted(rng, symbols)) : 'none';
  const position: Position =
    overlay === 'canton' ? 'canton' : overlay === 'pile' || overlay === 'hoist-band' ? 'hoist' : weighted(rng, [['centre', 7], ['canton', 2], ['hoist', 1]] as const);
  const scale: Scale = weighted(rng, [['s', 1], ['m', 3], ['l', 2]] as const);

  const draft: Simple = {
    division,
    colors,
    overlay,
    overlayColor: colors[0],
    symbol,
    symbolColor: colors[0],
    position,
    scale,
    ratio: weighted(rng, [[[2, 3], 6], [[1, 2], 2], [[3, 5], 2]] as const) as [number, number],
  };

  // The overlay takes the colour that stands out most from the field; the symbol, from whatever
  // ends up underneath it.
  const candidates = [...colors, W, K, '#fcd116'];
  const field = fromSimple({ ...draft, overlay: 'none', symbol: 'none' }).division;
  const fieldColors = field.type === 'bands' ? field.bands.map((b) => b.color) : field.colors;
  const best = (against: string[], avoid: string[] = []): string =>
    [...candidates]
      .filter((c) => !avoid.includes(c))
      .sort((a, b) => Math.min(...against.map((c) => contrast(b, c))) - Math.min(...against.map((c) => contrast(a, c))))[0]!;
  draft.overlayColor = best(fieldColors);

  const flag = fromSimple({ ...draft, symbol: 'none' });
  const spot = fromSimple(draft).overlays.at(-1);
  const [x, y] = [spot?.x ?? 50, spot?.y ?? 50];
  const coversCentre = ['cross', 'nordic', 'cross-saltire', 'canton', 'pile', 'pile-long', 'hoist-band', 'fess', 'pale', 'disc', 'lozenge', 'bend', 'bend-sinister', 'saltire'];
  const under = overlay !== 'none' && coversCentre.includes(overlay) ? [draft.overlayColor] : [divisionColorAt(flag.division, x, y)];
  draft.symbolColor = best(under, overlay !== 'none' && !coversCentre.includes(overlay) ? [draft.overlayColor] : []);
  return draft;
}
