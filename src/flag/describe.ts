/**
 * A flag in words: plain English first, with the vexillologist's terms where they are the
 * clearest way to say it. Used as the picture's description (for screen readers and inside the
 * downloaded file), and ready to paste into a wiki's flag section.
 */
import { colorName } from './colors';
import { emblem } from './emblems';
import type { Division, Flag, Overlay } from './model';

const list = (items: string[]): string =>
  items.length <= 1 ? (items[0] ?? '') : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;

const article = (phrase: string): string => (/^[aeiou]/i.test(phrase) && !/^eu/i.test(phrase) ? `an ${phrase}` : `a ${phrase}`);

const numerals = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen'];
const count = (n: number): string => numerals[n] ?? String(n);

function ratioText(weights: number[]): string {
  if (weights.every((w) => w === weights[0])) return '';
  const min = Math.min(...weights);
  const parts = weights.map((w) => Math.round((w / min) * 100) / 100);
  return ` (${parts.join(':')})`;
}

export function describeDivision(d: Division): string {
  if (d.type === 'bands') {
    const names = d.bands.map((b) => colorName(b.color));
    const way = d.dir === 'h' ? 'horizontal' : 'vertical';
    const weights = ratioText(d.bands.map((b) => b.weight));
    const distinct = new Set(names).size;
    if (distinct === 1) return `${article(names[0]!)} field`;
    if (names.length === 2) return `a ${way} bicolour of ${list(names)}${weights}`;
    if (names.length === 3 && distinct === 3) return `a ${way} tricolour of ${list(names)}${weights}`;
    if (names.length === 3) return `a ${way} triband of ${list(names)}${weights}`;
    const alternating = distinct === 2 && names.every((n, i) => n === names[i % 2]);
    if (alternating && !weights) return `${count(names.length)} ${way} stripes, ${names[0]} and ${names[1]} by turns`;
    return `${count(names.length)} ${way} bands of ${list(names)}${weights}`;
  }
  const [a, b] = [colorName(d.colors[0]), colorName(d.colors[1])];
  switch (d.type) {
    case 'grid':
      if (d.cols === 1 && d.rows === 1) return `${article(a)} field`;
      return d.cols === 2 && d.rows === 2
        ? `a field quartered ${a} and ${b}`
        : `a field chequered ${a} and ${b}, ${count(d.cols)} by ${count(d.rows)}`;
    case 'bend':
      return d.dir === 'down'
        ? `a field divided diagonally from the upper hoist to the lower fly, ${a} above ${b}`
        : `a field divided diagonally from the lower hoist to the upper fly, ${a} above ${b}`;
    case 'saltire':
      return `a field divided per saltire, ${a} at the top and bottom, ${b} at the hoist and fly`;
    case 'gyronny':
      return `a field of ${count(d.rays)} rays from the centre, ${a} and ${b} by turns`;
  }
}

/** Where on the flag a point is, in the words flags use. */
export function where(x: number, y: number): string {
  const col = x < 38 ? 'hoist' : x > 62 ? 'fly' : 'centre';
  const row = y < 38 ? 'upper' : y > 62 ? 'lower' : 'middle';
  if (col === 'centre' && row === 'middle') return 'in the centre';
  if (col === 'hoist' && row === 'upper') return 'in the canton';
  if (row === 'middle') return `towards the ${col}`;
  if (col === 'centre') return `in the ${row} half`;
  return `in the ${row} ${col}`;
}

export function describeOverlay(o: Overlay): string {
  const c = colorName(o.color);
  const at = where(o.x ?? 50, o.y ?? 50);
  switch (o.type) {
    case 'cross':
      return (o.x ?? 50) < 45 ? `${article(c)} Nordic cross` : `${article(c)} cross`;
    case 'saltire':
      return `${article(c)} saltire`;
    case 'border':
      return `${article(c)} border`;
    case 'hbar':
      return `${article(c)} horizontal bar`;
    case 'vbar':
      return (o.x ?? 50) < 30 ? `${article(c)} band at the hoist` : `${article(c)} vertical bar`;
    case 'bend':
      return `${article(c)} bend from the upper hoist to the lower fly`;
    case 'bendSinister':
      return `${article(c)} bend from the lower hoist to the upper fly`;
    case 'pall':
      return `${article(c)} pall`;
    case 'pile':
      return `${article(c)} triangle based on the hoist`;
    case 'rect':
      return at === 'in the canton' ? `${article(c)} canton` : `${article(c)} rectangle ${at}`;
    case 'disc':
      return `${article(c)} ${(o.w ?? 100) === 100 ? 'disc' : 'ellipse'} ${at}`;
    case 'ring':
      return `${article(c)} ring ${at}`;
    case 'lozenge':
      return `${article(c)} lozenge ${at}`;
    case 'triangle':
      return `${article(c)} triangle ${at}`;
    case 'star':
      return `${article(c)} ${count(o.points ?? 5)}-pointed star ${at}`;
    case 'starRing':
      return `a ring of ${count(o.count ?? 12)} ${c} stars ${at}`;
    case 'crescent':
      return `${article(c)} crescent ${at}`;
    case 'sun':
      return `${article(c)} sun of ${count(o.points ?? 16)} rays ${at}`;
    case 'emblem':
      return `${article(c)} ${(emblem(o.icon)?.name ?? 'emblem').toLowerCase()} ${at}`;
  }
}

/** The whole flag in a sentence or two. */
export function describeFlag(flag: Flag): string {
  const field = describeDivision(flag.division);
  const layers = flag.overlays.filter((o) => !o.hidden).map(describeOverlay);
  const first = field.charAt(0).toUpperCase() + field.slice(1);
  const shape = `Proportions ${flag.ratio[0]}:${flag.ratio[1]}.`;
  if (!layers.length) return `${first}. ${shape}`;
  return `${first}, with ${list(layers)}. ${shape}`;
}
