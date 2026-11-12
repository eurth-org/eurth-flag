/**
 * A flag lives in its link: everything after the # describes it, so sharing a flag is sharing a
 * link, and nothing is kept on a server. Simple flags get a short, readable form
 * (#s=h3_ce1126_ffffff_0038a8_…); advanced flags are compact JSON in base64url (#f=…).
 * Whatever arrives is checked and clamped before it is drawn: a link is someone else's input.
 */
import { cleanColor } from './colors';
import { emblem } from './emblems';
import { overlayDef, overlayTypes, uid, type Division, type Flag, type Overlay, type OverlayType } from './model';
import { defaultSimple, divisionPresets, knownSymbol, overlayPresets, type Position, type Scale, type Simple } from './simple';

export const MAX_OVERLAYS = 60;
export const MAX_BANDS = 24;

const clamp = (v: unknown, min: number, max: number, fallback: number): number => {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
};
const int = (v: unknown, min: number, max: number, fallback: number): number => Math.round(clamp(v, min, max, fallback));

export function cleanRatio(value: unknown): [number, number] {
  const [h, w] = Array.isArray(value) ? value : [2, 3];
  return [int(h, 1, 40, 2), int(w, 1, 40, 3)];
}

/** A flag's name: plain text, no markup, at most 60 characters. */
export function cleanName(value: unknown): string {
  return typeof value === 'string' ? value.replace(/[<>\u0000-\u001f]/g, '').replace(/\s+/g, ' ').slice(0, 60) : '';
}

const hex = (c: string): string => cleanColor(c).slice(1);

export function encodeSimple(s: Simple): string {
  return [
    s.division,
    ...s.colors.map(hex),
    s.overlay,
    hex(s.overlayColor),
    s.symbol,
    hex(s.symbolColor),
    s.position,
    s.scale,
    `${s.ratio[0]}x${s.ratio[1]}`,
  ].join('_');
}

export function decodeSimple(text: string): Simple | null {
  const p = text.split('_');
  if (p.length < 11) return null;
  const base = defaultSimple();
  const pick = <T extends string>(value: string | undefined, allowed: readonly T[], fallback: T): T =>
    allowed.includes(value as T) ? (value as T) : fallback;
  if (!divisionPresets.some((d) => d.id === p[0])) return null;
  const symbol = p[6] ?? 'none';
  return {
    division: p[0]!,
    colors: [cleanColor(p[1], base.colors[0]), cleanColor(p[2], base.colors[1]), cleanColor(p[3], base.colors[2])],
    overlay: overlayPresets.some((o) => o.id === p[4]) ? p[4]! : 'none',
    overlayColor: cleanColor(p[5], base.overlayColor),
    symbol: knownSymbol(symbol) ? symbol : 'none',
    symbolColor: cleanColor(p[7], base.symbolColor),
    position: pick<Position>(p[8], ['centre', 'canton', 'hoist', 'fly'], 'centre'),
    scale: pick<Scale>(p[9], ['s', 'm', 'l'], 'm'),
    ratio: cleanRatio((p[10] ?? '').split('x')),
  };
}

function cleanDivision(d: unknown): Division {
  const o = (d && typeof d === 'object' ? d : {}) as Record<string, unknown>;
  const pair = (): [string, string] => {
    const c = Array.isArray(o.colors) ? o.colors : [];
    return [cleanColor(c[0], '#2698d4'), cleanColor(c[1], '#ffffff')];
  };
  switch (o.type) {
    case 'grid':
      return { type: 'grid', cols: int(o.cols, 1, 24, 2), rows: int(o.rows, 1, 24, 2), colors: pair() };
    case 'bend':
      return { type: 'bend', dir: o.dir === 'up' ? 'up' : 'down', colors: pair() };
    case 'saltire':
      return { type: 'saltire', colors: pair() };
    case 'gyronny':
      return { type: 'gyronny', rays: int(o.rays, 4, 48, 8) & ~1, colors: pair() };
    default: {
      const list = (Array.isArray(o.bands) ? o.bands : []).slice(0, MAX_BANDS).map((b) => {
        const band = (b && typeof b === 'object' ? b : {}) as Record<string, unknown>;
        return { color: cleanColor(band.color), weight: clamp(band.weight, 0.1, 20, 1) };
      });
      return { type: 'bands', dir: o.dir === 'v' ? 'v' : 'h', bands: list.length ? list : [{ color: '#2698d4', weight: 1 }] };
    }
  }
}

function cleanOverlay(value: unknown): Overlay | null {
  const o = (value && typeof value === 'object' ? value : {}) as Record<string, unknown>;
  if (!overlayTypes.includes(o.type as OverlayType)) return null;
  const type = o.type as OverlayType;
  const def = overlayDef(type);
  const out: Overlay = { id: uid(), type, color: cleanColor(o.color, '#000000') };
  for (const param of def.params) {
    const fallback = def.defaults[param.key] ?? param.min;
    // Positions may leave the flag a little further than the sliders go; nothing else may.
    const free = param.key === 'x' || param.key === 'y';
    const value = clamp(o[param.key], free ? -50 : param.min, free ? 150 : param.max, fallback);
    out[param.key] = param.key === 'points' || param.key === 'count' ? Math.round(value) : Math.round(value * 100) / 100;
  }
  if (type === 'emblem') {
    out.icon = typeof o.icon === 'string' && emblem(o.icon) ? o.icon : 'crown';
    if (o.mirror === true) out.mirror = true;
  }
  if (o.hidden === true) out.hidden = true;
  return out;
}

/** Any value, made into a flag that is safe to draw. */
export function cleanFlag(value: unknown): Flag {
  const o = (value && typeof value === 'object' ? value : {}) as Record<string, unknown>;
  const overlays = (Array.isArray(o.overlays) ? o.overlays : [])
    .slice(0, MAX_OVERLAYS)
    .map(cleanOverlay)
    .filter((x): x is Overlay => x !== null);
  return { ratio: cleanRatio(o.ratio), division: cleanDivision(o.division), overlays };
}

const toBase64Url = (text: string): string => {
  const bytes = new TextEncoder().encode(text);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

const fromBase64Url = (text: string): string => {
  const bin = atob(text.replace(/-/g, '+').replace(/_/g, '/'));
  return new TextDecoder().decode(Uint8Array.from(bin, (ch) => ch.charCodeAt(0)));
};

/** The flag without what only the editor needs (layer ids), with short numbers. */
export function flagData(flag: Flag): unknown {
  return {
    ratio: flag.ratio,
    division: flag.division,
    overlays: flag.overlays.map(({ id: _id, ...rest }) => rest),
  };
}

export function encodeFlag(flag: Flag): string {
  return toBase64Url(JSON.stringify(flagData(flag)));
}

export function decodeFlag(text: string): Flag | null {
  try {
    return cleanFlag(JSON.parse(fromBase64Url(text)));
  } catch {
    return null;
  }
}

export interface Shared {
  mode: 'simple' | 'advanced';
  simple?: Simple;
  flag?: Flag;
  name: string;
}

/** The part of a link after the #, for a flag in either mode. */
export function toHash(shared: Shared): string {
  const design = shared.mode === 'simple' && shared.simple ? `s=${encodeSimple(shared.simple)}` : `f=${encodeFlag(shared.flag!)}`;
  const name = cleanName(shared.name).trim();
  return name ? `${design}&n=${encodeURIComponent(name)}` : design;
}

export function fromHash(hash: string): Shared | null {
  const params = new URLSearchParams(hash.replace(/^#/, ''));
  const name = cleanName(params.get('n') ?? '');
  const s = params.get('s');
  if (s) {
    const simple = decodeSimple(s);
    if (simple) return { mode: 'simple', simple, name };
  }
  const f = params.get('f');
  if (f) {
    const flag = decodeFlag(f);
    if (flag) return { mode: 'advanced', flag, name };
  }
  return null;
}
