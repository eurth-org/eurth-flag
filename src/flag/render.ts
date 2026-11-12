/**
 * Draws a flag as SVG text. One renderer serves the editor's preview, the downloads, the
 * template pages (at build time) and the tests. Only numbers and cleaned colours reach the
 * markup, and emblem paths come from the library, never from a link or a file someone sent.
 */
import { cleanColor } from './colors';
import { emblem } from './emblems';
import type { Division, Flag, Overlay } from './model';

/** Every flag is drawn 600 units high; its width follows from its proportions. */
export const HEIGHT = 600;

export function flagSize(flag: Flag): { W: number; H: number } {
  const [h, w] = flag.ratio;
  return { W: Math.round((HEIGHT * w) / h), H: HEIGHT };
}

const f = (v: number): string => String(Math.round(v * 100) / 100);
const esc = (s: string): string => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const pts = (list: [number, number][]): string => list.map(([x, y]) => `${f(x)},${f(y)}`).join(' ');

function divisionSvg(d: Division, W: number, H: number): string {
  if (d.type === 'bands') {
    const total = d.bands.reduce((sum, b) => sum + Math.max(b.weight, 0), 0) || 1;
    let at = 0;
    // Each band runs on to the far edge and the next one covers it: no hairlines between them.
    return d.bands
      .map((b) => {
        const start = at;
        at += Math.max(b.weight, 0) / total;
        const c = cleanColor(b.color);
        return d.dir === 'h'
          ? `<rect y="${f(start * H)}" width="${W}" height="${f(H - start * H)}" fill="${c}"/>`
          : `<rect x="${f(start * W)}" width="${f(W - start * W)}" height="${H}" fill="${c}"/>`;
      })
      .join('');
  }
  const [a, b] = [cleanColor(d.colors[0]), cleanColor(d.colors[1])];
  const back = `<rect width="${W}" height="${H}" fill="${b}"/>`;
  if (d.type === 'grid') {
    const cw = W / d.cols;
    const ch = H / d.rows;
    let cells = '';
    for (let j = 0; j < d.rows; j++) {
      for (let i = 0; i < d.cols; i++) {
        if ((i + j) % 2 === 0) cells += `M${f(i * cw)} ${f(j * ch)}h${f(cw)}v${f(ch)}h${f(-cw)}z`;
      }
    }
    return `${back}<path d="${cells}" fill="${a}"/>`;
  }
  if (d.type === 'bend') {
    const corner: [number, number] = d.dir === 'down' ? [W, H] : [0, H];
    return `${back}<polygon points="${pts([[0, 0], [W, 0], corner])}" fill="${a}"/>`;
  }
  if (d.type === 'saltire') {
    return `${back}<path d="M0 0H${W}L${f(W / 2)} ${f(H / 2)}zM0 ${H}H${W}L${f(W / 2)} ${f(H / 2)}z" fill="${a}"/>`;
  }
  // Gyronny: wedges around the centre, drawn in a square and stretched, so the diagonals of a
  // gyronny of eight run to the corners.
  const n = d.rays;
  let wedges = '';
  for (let i = 0; i < n; i += 2) {
    const [a0, a1] = [-Math.PI + (i * 2 * Math.PI) / n, -Math.PI + ((i + 1) * 2 * Math.PI) / n];
    const p = (t: number) => `${f(W / 2 + Math.cos(t) * 3 * (W / 2))} ${f(H / 2 + Math.sin(t) * 3 * (H / 2))}`;
    wedges += `M${f(W / 2)} ${f(H / 2)}L${p(a0)}L${p(a1)}z`;
  }
  return `${back}<path d="${wedges}" fill="${a}"/>`;
}

/** The corners of a star: `points` tips at radius R, with the notches between them at r. */
export function starPoints(cx: number, cy: number, R: number, r: number, points: number, rot = 0): [number, number][] {
  const out: [number, number][] = [];
  for (let i = 0; i < points * 2; i++) {
    const t = (rot * Math.PI) / 180 - Math.PI / 2 + (i * Math.PI) / points;
    const rad = i % 2 ? r : R;
    out.push([cx + Math.cos(t) * rad, cy + Math.sin(t) * rad]);
  }
  return out;
}

function overlayShape(o: Overlay, W: number, H: number): string {
  const c = cleanColor(o.color, '#000000');
  const num = (key: keyof Overlay, fallback: number): number => {
    const v = o[key];
    return typeof v === 'number' && Number.isFinite(v) ? v : fallback;
  };
  const cx = (num('x', 50) / 100) * W;
  const cy = (num('y', 50) / 100) * H;
  const t = (num('thickness', 15) / 100) * H;
  const R = ((num('size', 40) / 100) * H) / 2;
  const w = (num('w', 50) / 100) * W;
  const h = (num('h', 50) / 100) * H;
  const rot = num('rot', 0);
  const turn = rot ? ` transform="rotate(${f(rot)} ${f(cx)} ${f(cy)})"` : '';
  // Diagonals start beyond the corners, so their square ends never show inside the flag.
  const diag = (x1: number, y1: number, x2: number, y2: number): string => {
    const len = Math.hypot(x2 - x1, y2 - y1) || 1;
    const [ux, uy] = [((x2 - x1) / len) * t, ((y2 - y1) / len) * t];
    return `M${f(x1 - ux)} ${f(y1 - uy)}L${f(x2 + ux)} ${f(y2 + uy)}`;
  };

  switch (o.type) {
    case 'cross':
      return `<path d="M${f(cx - t / 2)} 0h${f(t)}v${H}h${f(-t)}zM0 ${f(cy - t / 2)}h${W}v${f(t)}h${-W}z" fill="${c}"/>`;
    case 'saltire':
      return `<path d="${diag(0, 0, W, H)}${diag(0, H, W, 0)}" stroke="${c}" stroke-width="${f(t)}" fill="none"/>`;
    case 'border':
      return `<rect x="${f(t / 2)}" y="${f(t / 2)}" width="${f(W - t)}" height="${f(H - t)}" fill="none" stroke="${c}" stroke-width="${f(t)}"/>`;
    case 'hbar':
      return `<rect y="${f(cy - t / 2)}" width="${W}" height="${f(t)}" fill="${c}"/>`;
    case 'vbar': {
      // A pale's thickness is measured across the flag, so it is a share of the width.
      const tw = (num('thickness', 15) / 100) * W;
      return `<rect x="${f(cx - tw / 2)}" width="${f(tw)}" height="${H}" fill="${c}"/>`;
    }
    case 'bend':
      return `<path d="${diag(0, 0, W, H)}" stroke="${c}" stroke-width="${f(t)}" fill="none"/>`;
    case 'bendSinister':
      return `<path d="${diag(0, H, W, 0)}" stroke="${c}" stroke-width="${f(t)}" fill="none"/>`;
    case 'pall': {
      const m = `${f(cx)} ${f(H / 2)}`;
      const arm = (x: number, y: number) => {
        const len = Math.hypot(cx - x, H / 2 - y) || 1;
        return `M${f(x - ((cx - x) / len) * t)} ${f(y - ((H / 2 - y) / len) * t)}L${m}`;
      };
      return `<path d="${arm(0, 0)}${arm(0, H)}M${m}H${W}" stroke="${c}" stroke-width="${f(t)}" stroke-linejoin="miter" fill="none"/><circle cx="${f(cx)}" cy="${f(H / 2)}" r="${f(t / 2)}" fill="${c}"/>`;
    }
    case 'pile':
      return `<polygon points="${pts([[0, cy - h / 2], [w, cy], [0, cy + h / 2]])}" fill="${c}"/>`;
    case 'rect':
      return `<rect x="${f(cx - w / 2)}" y="${f(cy - h / 2)}" width="${f(w)}" height="${f(h)}" fill="${c}"${turn}/>`;
    case 'disc': {
      const stretch = num('w', 100) / 100;
      return stretch === 1
        ? `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(R)}" fill="${c}"/>`
        : `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(R * stretch)}" ry="${f(R)}" fill="${c}"/>`;
    }
    case 'ring': {
      const tt = Math.min(t, R);
      return `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(R - tt / 2)}" fill="none" stroke="${c}" stroke-width="${f(tt)}"/>`;
    }
    case 'lozenge':
      return `<polygon points="${pts([[cx, cy - h / 2], [cx + w / 2, cy], [cx, cy + h / 2], [cx - w / 2, cy]])}" fill="${c}"${turn}/>`;
    case 'triangle':
      return `<polygon points="${pts([[cx, cy - h / 2], [cx + w / 2, cy + h / 2], [cx - w / 2, cy + h / 2]])}" fill="${c}"${turn}/>`;
    case 'star': {
      const n = Math.round(num('points', 5));
      return `<polygon points="${pts(starPoints(cx, cy, R, (R * num('inner', 38)) / 100, n, rot))}" fill="${c}"/>`;
    }
    case 'starRing': {
      const count = Math.round(num('count', 12));
      const n = Math.round(num('points', 5));
      const sr = ((num('starSize', 9) / 100) * H) / 2;
      // The usual five-pointed star's notches; other stars get the same look.
      const inner = n === 5 ? 0.382 : 0.45;
      let d = '';
      for (let i = 0; i < count; i++) {
        const a = ((rot - 90) * Math.PI) / 180 + (i * 2 * Math.PI) / count;
        const star = starPoints(cx + Math.cos(a) * R, cy + Math.sin(a) * R, sr, sr * inner, n);
        d += `M${star.map(([x, y]) => `${f(x)} ${f(y)}`).join('L')}z`;
      }
      return `<path d="${d}" fill="${c}"/>`;
    }
    case 'crescent': {
      // Two circles: the moon, and a smaller one set towards the fly that bites into it.
      const k = num('inner', 80) / 100;
      const r = R * k;
      const off = R * (1.2 - k);
      const ix = (R * R - r * r + off * off) / (2 * off);
      const iy = Math.sqrt(Math.max(R * R - ix * ix, 0));
      // Drawn around its own middle rather than the moon's, so it sits where it is put.
      const shift = (ix - R) / 2;
      const x = cx + ix - shift;
      const d = `M${f(x)} ${f(cy - iy)}A${f(R)} ${f(R)} 0 ${ix > 0 ? 1 : 0} 0 ${f(x)} ${f(cy + iy)}A${f(r)} ${f(r)} 0 ${ix - off > 0 ? 1 : 0} 1 ${f(x)} ${f(cy - iy)}z`;
      return `<path d="${d}" fill="${c}"${turn}/>`;
    }
    case 'sun': {
      const n = Math.round(num('points', 16));
      const half = (Math.PI / n) * 0.62;
      let d = '';
      for (let i = 0; i < n; i++) {
        const a = (rot * Math.PI) / 180 - Math.PI / 2 + (i * 2 * Math.PI) / n;
        const p = (ang: number, rad: number) => `${f(cx + Math.cos(ang) * rad)} ${f(cy + Math.sin(ang) * rad)}`;
        d += `M${p(a - half, R * 0.6)}L${p(a, R)}L${p(a + half, R * 0.6)}z`;
      }
      return `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(R * 0.52)}" fill="${c}"/><path d="${d}" fill="${c}"/>`;
    }
    case 'emblem': {
      const e = emblem(o.icon);
      if (!e) return '';
      const s = (R * 2) / Math.max(e.width, e.height);
      const flip = o.mirror ? ` scale(-1 1)` : '';
      const spin = rot ? ` rotate(${f(rot)})` : '';
      return `<path d="${e.path}" fill="${c}" transform="translate(${f(cx)} ${f(cy)})${spin}${flip} scale(${Math.round(s * 10000) / 10000}) translate(${f(-e.width / 2)} ${f(-e.height / 2)})"/>`;
    }
  }
}

export interface RenderOptions {
  /** The flag's name, for the picture's title (what screen readers and hover show). */
  title?: string;
  /** A written description, kept inside the file. */
  desc?: string;
  /** Mark each layer with its id, so the editor can tell what was clicked. */
  ids?: boolean;
  /** Needed when several flags share a page: each needs its own. */
  clipId?: string;
  /** Leave out width and height, so CSS sizes the picture. */
  fluid?: boolean;
  /** Width in pixels of a standalone file; the height follows. */
  width?: number;
  /** Leave the field out and draw only the layers (for small pictures of a single charge). */
  bare?: boolean;
}

export function flagSvg(flag: Flag, options: RenderOptions = {}): string {
  const { W, H } = flagSize(flag);
  const clip = (options.clipId ?? 'flag-clip').replace(/[^\w-]/g, '');
  const layers = flag.overlays
    .filter((o) => !o.hidden)
    .map((o) => {
      const shape = overlayShape(o, W, H);
      return options.ids ? `<g data-id="${esc(o.id)}">${shape}</g>` : shape;
    })
    .join('');
  const width = options.width ?? W;
  const dims = options.fluid ? '' : ` width="${f(width)}" height="${f((width * H) / W)}"`;
  const title = options.title ? `<title>${esc(options.title)}</title>` : '';
  const desc = options.desc ? `<desc>${esc(options.desc)}</desc>` : '';
  const label = options.title ? ` role="img" aria-label="${esc(options.title)}"` : ' aria-hidden="true"';
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}"${dims}${label}>${title}${desc}` +
    `<defs><clipPath id="${clip}"><rect width="${W}" height="${H}"/></clipPath></defs>` +
    `<g clip-path="url(#${clip})">${options.bare ? '' : `<g shape-rendering="crispEdges">${divisionSvg(flag.division, W, H)}</g>`}${layers}</g></svg>`
  );
}
