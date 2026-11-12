/**
 * The design check: what a vexillologist would say about a flag at first glance. It follows the
 * five principles most flag people share (keep it simple, mean something, two or three colours,
 * no lettering or seals, be distinctive) and the old heraldic rule of tincture: light on dark or
 * dark on light. It can measure simplicity, colour and contrast; meaning it can only ask about.
 * A guide, not a law: plenty of loved flags break a rule on purpose.
 */
import { colorFamily, colorName, contrast } from './colors';
import { describeOverlay } from './describe';
import { colorsOf, movable, type Division, type Flag, type Overlay } from './model';
import { flagSize } from './render';

export type Level = 'good' | 'note' | 'warn';

export interface Finding {
  id: string;
  level: Level;
  /** Which principle it belongs to. */
  principle: string;
  text: string;
  /** Layers to look at, by id. */
  layers?: string[];
}

export interface Review {
  /** Out of 10. */
  score: number;
  verdict: string;
  findings: Finding[];
}

export const principles = {
  simple: 'Keep it simple',
  meaning: 'Mean something',
  colors: 'Two or three colours',
  seals: 'No lettering or seals',
  distinct: 'Be distinctive',
  contrast: 'Light on dark, dark on light',
} as const;

/** The field's colour at a point (in percent of the flag). */
export function divisionColorAt(d: Division, x: number, y: number): string {
  if (d.type === 'bands') {
    const total = d.bands.reduce((sum, b) => sum + b.weight, 0) || 1;
    const at = ((d.dir === 'h' ? y : x) / 100) * total;
    let sum = 0;
    for (const band of d.bands) {
      sum += band.weight;
      if (at < sum) return band.color;
    }
    return d.bands[d.bands.length - 1]!.color;
  }
  const [a, b] = d.colors;
  switch (d.type) {
    case 'grid': {
      const i = Math.min(d.cols - 1, Math.max(0, Math.floor((x / 100) * d.cols)));
      const j = Math.min(d.rows - 1, Math.max(0, Math.floor((y / 100) * d.rows)));
      return (i + j) % 2 === 0 ? a : b;
    }
    case 'bend':
      return (d.dir === 'down' ? y < x : y < 100 - x) ? a : b;
    case 'saltire':
      return Math.abs(y - 50) > Math.abs(x - 50) ? a : b;
    case 'gyronny': {
      const t = Math.atan2(y - 50, x - 50) + Math.PI;
      return Math.floor(t / ((2 * Math.PI) / d.rays)) % 2 === 0 ? a : b;
    }
  }
}

/** Whether a solid layer covers a point. Charges with holes (stars, emblems, rings) don't count. */
function covers(o: Overlay, x: number, y: number, W: number, H: number): boolean {
  const px = (x / 100) * W;
  const py = (y / 100) * H;
  const cx = ((o.x ?? 50) / 100) * W;
  const cy = ((o.y ?? 50) / 100) * H;
  const t = ((o.thickness ?? 0) / 100) * H;
  const w = ((o.w ?? 0) / 100) * W;
  const h = ((o.h ?? 0) / 100) * H;
  switch (o.type) {
    case 'cross':
      return Math.abs(px - cx) < t / 2 || Math.abs(py - cy) < t / 2;
    case 'hbar':
      return Math.abs(py - cy) < t / 2;
    case 'vbar':
      return Math.abs(px - cx) < (((o.thickness ?? 0) / 100) * W) / 2;
    case 'border':
      return px < t || py < t || px > W - t || py > H - t;
    case 'rect':
      return Math.abs(px - cx) < w / 2 && Math.abs(py - cy) < h / 2;
    case 'disc': {
      const r = (((o.size ?? 0) / 100) * H) / 2;
      return ((px - cx) / (r * ((o.w ?? 100) / 100) || 1)) ** 2 + ((py - cy) / (r || 1)) ** 2 < 1;
    }
    case 'lozenge':
      return Math.abs(px - cx) / (w / 2 || 1) + Math.abs(py - cy) / (h / 2 || 1) < 1;
    case 'pile':
      return px < w && Math.abs(py - cy) < (h / 2) * (1 - px / (w || 1));
    case 'bend':
      return Math.abs(H * px - W * py) / Math.hypot(W, H) < t / 2;
    case 'bendSinister':
      return Math.abs(H * px + W * py - W * H) / Math.hypot(W, H) < t / 2;
    case 'saltire':
      return Math.min(Math.abs(H * px - W * py), Math.abs(H * px + W * py - W * H)) / Math.hypot(W, H) < t / 2;
    default:
      return false;
  }
}

/** The colour a layer sits on: the topmost solid thing beneath its centre. */
export function colorUnder(flag: Flag, index: number): string {
  const o = flag.overlays[index]!;
  const { W, H } = flagSize(flag);
  const [x, y] = [o.x ?? 50, o.y ?? 50];
  for (let i = index - 1; i >= 0; i--) {
    const below = flag.overlays[i]!;
    if (!below.hidden && covers(below, x, y, W, H)) return below.color;
  }
  return divisionColorAt(flag.division, Math.min(99.9, Math.max(0, x)), Math.min(99.9, Math.max(0, y)));
}

/** Simple flags that already fly somewhere: bands of equal width, by colour family. */
const lookalikes: Record<string, string> = {
  'h:red-white-blue': 'the Netherlands (and, a shade lighter, Luxembourg)',
  'h:white-blue-red': 'Russia',
  'h:black-red-yellow': 'Germany',
  'h:red-white-red': 'Austria',
  'h:red-white': 'Indonesia and Monaco',
  'h:white-red': 'Poland',
  'h:blue-yellow': 'Ukraine',
  'h:yellow-green-red': 'Lithuania',
  'h:white-green-red': 'Bulgaria',
  'h:red-white-green': 'Hungary',
  'h:blue-black-white': 'Estonia',
  'h:green-white-blue': 'Sierra Leone',
  'h:red-blue-orange': 'Armenia',
  'h:yellow-blue-red': 'Colombia (which gives the yellow half the flag)',
  'h:green-yellow-red': 'Ethiopia and Bolivia, more or less',
  'v:blue-white-red': 'France',
  'v:green-white-red': 'Italy',
  'v:black-yellow-red': 'Belgium',
  'v:green-white-orange': 'Ireland',
  'v:orange-white-green': 'Côte d’Ivoire',
  'v:red-yellow-green': 'Guinea',
  'v:green-yellow-red': 'Mali',
  'v:blue-yellow-red': 'Romania and Chad',
  'v:green-white-green': 'Nigeria',
  'v:red-white-red': 'Peru',
  'h:green': 'Libya from 1977 to 2011',
};

export function lookalike(flag: Flag): string | null {
  const d = flag.division;
  const visible = flag.overlays.filter((o) => !o.hidden);
  if (d.type !== 'bands') return null;
  const families = d.bands.map((b) => colorFamily(b.color));
  const plain = new Set(families).size === 1;
  if (visible.length === 1 && plain) {
    const o = visible[0]!;
    const charge = colorFamily(o.color);
    if (o.type === 'disc' && families[0] === 'white' && charge === 'red') return 'Japan';
    if (o.type === 'disc' && families[0] === 'green' && charge === 'red') return 'Bangladesh';
    if (o.type === 'cross' && families[0] === 'red' && charge === 'white') return (o.x ?? 50) < 45 ? 'Denmark' : 'Switzerland, or England inside out';
    if (o.type === 'cross' && families[0] === 'white' && charge === 'red' && (o.x ?? 50) >= 45) return 'England';
    if (o.type === 'saltire' && families[0] === 'blue' && charge === 'white') return 'Scotland';
    return null;
  }
  if (visible.length) return null;
  if (plain) return lookalikes[`h:${families[0]}`] ?? null;
  if (!d.bands.every((b) => b.weight === d.bands[0]!.weight)) return null;
  return lookalikes[`${d.dir}:${families.join('-')}`] ?? null;
}

const fullField = new Set(['cross', 'saltire', 'border', 'hbar', 'vbar', 'bend', 'bendSinister', 'pall']);

export function review(flag: Flag): Review {
  const findings: Finding[] = [];
  const visible = flag.overlays.filter((o) => !o.hidden);
  const colors = colorsOf(flag);
  const d = flag.division;

  // Colours.
  if (colors.length >= 5) {
    findings.push({ id: 'colors-many', level: 'warn', principle: principles.colors, text: `${colors.length} colours. Most flags that last use two or three; every extra one costs money to sew and attention to read.` });
  } else if (colors.length === 4) {
    findings.push({ id: 'colors-four', level: 'note', principle: principles.colors, text: 'Four colours: one more than most flags need. It can work (South Africa flies six), but check that each earns its place.' });
  } else if (colors.length === 1) {
    findings.push({ id: 'colors-one', level: 'note', principle: principles.distinct, text: 'One colour and nothing on it. Bold, but someone else has flown it already.' });
  } else {
    findings.push({ id: 'colors-good', level: 'good', principle: principles.colors, text: `${colors.length === 2 ? 'Two' : 'Three'} colours: ${colors.map(colorName).join(', ')}. Easy to remember, cheap to make.` });
  }

  // Simplicity.
  const emblems = visible.filter((o) => o.type === 'emblem');
  const fieldParts = d.type === 'bands' ? d.bands.length : d.type === 'grid' ? d.cols * d.rows : d.type === 'gyronny' ? d.rays : 2;
  if (visible.length >= 6) {
    findings.push({ id: 'simple-layers', level: 'warn', principle: principles.simple, text: `${visible.length} layers on the field. Could a child draw this from memory? Try taking one away, then another.` });
  } else if (visible.length >= 4) {
    findings.push({ id: 'simple-layers', level: 'note', principle: principles.simple, text: `${visible.length} layers on the field. It still reads, but a flag is seen from far off, moving, on one side of the cloth.` });
  } else if (fieldParts > 13) {
    findings.push({ id: 'simple-field', level: 'note', principle: principles.simple, text: 'A busy field. From a distance, many small parts blur into one colour.' });
  } else {
    findings.push({ id: 'simple-good', level: 'good', principle: principles.simple, text: 'Simple enough to draw from memory.' });
  }
  if (emblems.length >= 2) {
    findings.push({ id: 'seals', level: 'note', principle: principles.seals, text: `${emblems.length} emblems. One strong charge beats a collection: together they start to look like a seal.`, layers: emblems.map((o) => o.id) });
  }

  // Contrast within the field.
  const fieldColors = d.type === 'bands' ? d.bands.map((b) => b.color) : [...d.colors];
  const pairs = d.type === 'bands' ? fieldColors.slice(1).map((c, i) => [fieldColors[i]!, c] as const) : [[fieldColors[0]!, fieldColors[1]!] as const];
  const blurred = pairs.find(([a, b]) => a !== b && contrast(a, b) < 1.6);
  if (blurred) {
    findings.push({ id: 'contrast-field', level: 'warn', principle: principles.contrast, text: `${colorName(blurred[0])} next to ${colorName(blurred[1])} will blur together at a distance. Put a light colour between two dark ones, or the other way round.` });
  }

  // Each layer against what it lies on.
  flag.overlays.forEach((o, index) => {
    if (o.hidden) return;
    const what = describeOverlay(o).replace(/^an? /, '');
    if (movable(o.type) && !fullField.has(o.type)) {
      const [x, y] = [o.x ?? 50, o.y ?? 50];
      if (x < 0 || x > 100 || y < 0 || y > 100) {
        findings.push({ id: `off-${o.id}`, level: 'note', principle: principles.simple, text: `The ${what} is centred outside the flag: only part of it shows.`, layers: [o.id] });
        return;
      }
      const under = colorUnder(flag, index);
      const ratio = contrast(o.color, under);
      if (ratio < 1.15) {
        findings.push({ id: `lost-${o.id}`, level: 'warn', principle: principles.contrast, text: `The ${what} is the same colour as what lies under it, so it can't be seen.`, layers: [o.id] });
      } else if (ratio < 2.2) {
        findings.push({ id: `faint-${o.id}`, level: 'warn', principle: principles.contrast, text: `The ${what} lies on ${colorName(under)}: too alike to tell apart from across a square. An edge in a third colour would lift it.`, layers: [o.id] });
      }
      const small = o.type === 'rect' || o.type === 'lozenge' || o.type === 'triangle' ? Math.min(o.w ?? 50, o.h ?? 50) : (o.size ?? 50);
      if (small < 12) {
        findings.push({ id: `small-${o.id}`, level: 'note', principle: principles.simple, text: `The ${what} is small. On a flag a hundred metres away it will be a dot.`, layers: [o.id] });
      }
    } else {
      const same = fieldColors.find((c) => contrast(o.color, c) < 1.15);
      if (same && index === flag.overlays.findIndex((v) => !v.hidden)) {
        findings.push({ id: `merge-${o.id}`, level: 'note', principle: principles.contrast, text: `The ${what} is the same ${colorName(same)} as part of the field, and disappears where they meet.`, layers: [o.id] });
      }
    }
  });

  // Distinctiveness.
  const twin = lookalike(flag);
  if (twin) {
    findings.push({ id: 'twin', level: 'note', principle: principles.distinct, text: `This is, give or take a shade, the flag of ${twin}. Fine for a relative; confusing for a rival.` });
  }

  // Meaning can't be measured, so it's asked.
  findings.push({ id: 'meaning', level: 'good', principle: principles.meaning, text: 'What does each colour and shape stand for? Write it down: a flag with a story is a flag people keep.' });

  const warn = findings.filter((f) => f.level === 'warn').length;
  const note = findings.filter((f) => f.level === 'note').length;
  const score = Math.max(1, Math.min(10, 10 - warn * 2 - note));
  const verdict = score >= 9 ? 'Fit to fly' : score >= 7 ? 'Nearly there' : score >= 5 ? 'Needs a second look' : 'Designed by committee';
  const order: Record<Level, number> = { warn: 0, note: 1, good: 2 };
  findings.sort((a, b) => order[a.level] - order[b.level]);
  return { score, verdict, findings };
}
