/**
 * A flag lives in its link: the query string describes it, so sharing a flag is sharing a link,
 * and nothing is kept on a server or in the browser. Each form carries its version in front, so
 * a link made today still opens after the tool has grown:
 *
 *   ?s=1.h3_ce1126_ffffff_0038a8_…   a simple flag, short and readable
 *   ?f=1.eyJyYXRpbyI6WzIsM10…        an advanced flag: compact JSON in base64url
 *   &n=Orioni                        its name, if it has one
 *
 * Until November 2026 the design sat after the # instead, without a version (#s=…, #f=…). Those
 * links are all over the forum, so they are read for good: fromAddress() says when it met one,
 * and the maker then rewrites the address to today's form.
 *
 * Whatever arrives is checked and clamped before it is drawn: a link is someone else's input.
 */
import { decodeState, encodeState } from '@eurth/style';
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

/** The version written in front of both forms. Raise it when a form changes shape, and keep reading the old ones. */
export const LINK_VERSION = 1;

/** The longest link text read: room for 60 layers, and no more. */
const MAX_LENGTH = 40_000;

/** The flag without what only the editor needs (layer ids), with short numbers. */
export function flagData(flag: Flag): unknown {
  return {
    ratio: flag.ratio,
    division: flag.division,
    overlays: flag.overlays.map(({ id: _id, ...rest }) => rest),
  };
}

/** An advanced flag as the value of ?f=: "1." and compact JSON in base64url. */
export function encodeFlag(flag: Flag): string {
  return encodeState(flagData(flag), LINK_VERSION);
}

/** Reads ?f= back. An old link's #f= had no version in front: the same JSON, read as version 1. */
export function decodeFlag(text: string): Flag | null {
  const state = decodeState(/^\d{1,4}\./.test(text) ? text : `${LINK_VERSION}.${text}`, { maxLength: MAX_LENGTH });
  if (!state || state.version !== LINK_VERSION || typeof state.value !== 'object' || state.value === null) return null;
  return cleanFlag(state.value);
}

/** A simple flag as the value of ?s=: "1." and the readable form. */
export function encodeSimpleState(simple: Simple): string {
  return `${LINK_VERSION}.${encodeSimple(simple)}`;
}

/** Reads ?s= back. An old link's #s= had no version in front: the same form, read as version 1. */
export function decodeSimpleState(text: string): Simple | null {
  if (text.length > MAX_LENGTH) return null;
  const found = /^(\d{1,4})\.(.*)$/.exec(text);
  if (found && Number(found[1]) !== LINK_VERSION) return null;
  return decodeSimple(found ? found[2]! : text);
}

export interface Shared {
  mode: 'simple' | 'advanced';
  simple?: Simple;
  flag?: Flag;
  name: string;
}

/** A link's query string (without the ?), for a flag in either mode. */
export function toQuery(shared: Shared): string {
  const params = new URLSearchParams();
  if (shared.mode === 'simple' && shared.simple) params.set('s', encodeSimpleState(shared.simple));
  else params.set('f', encodeFlag(shared.flag!));
  const name = cleanName(shared.name).trim();
  if (name) params.set('n', name);
  return params.toString();
}

/** The address that opens a flag in the maker: "/?s=1.…" on this site, or a whole link with a base. */
export function flagLink(shared: Shared, base = ''): string {
  return `${base.replace(/\/$/, '')}/?${toQuery(shared)}`;
}

/** A simple design's address in the maker, for the pages that link into it. */
export const simpleLink = (simple: Simple): string => flagLink({ mode: 'simple', simple, name: '' });

/** An advanced flag's address in the maker. */
export const advancedLink = (flag: Flag): string => flagLink({ mode: 'advanced', flag, name: '' });

function fromParams(text: string): Shared | null {
  if (text.length > MAX_LENGTH) return null;
  const params = new URLSearchParams(text);
  const name = cleanName(params.get('n') ?? '');
  const s = params.get('s');
  if (s) {
    const simple = decodeSimpleState(s);
    if (simple) return { mode: 'simple', simple, name };
  }
  const f = params.get('f');
  if (f) {
    const flag = decodeFlag(f);
    if (flag) return { mode: 'advanced', flag, name };
  }
  return null;
}

/** The flag in a link's query string ("?s=1.…"), or null if there is none to read. */
export function fromQuery(search: string): Shared | null {
  return fromParams(search.replace(/^\?/, ''));
}

/** The flag in an old link's # part ("#s=…", "#f=…"), or null. */
export function fromHash(hash: string): Shared | null {
  return fromParams(hash.replace(/^#/, ''));
}

/**
 * The flag an address holds: today's query string first, then an old link's # part. `old` says
 * the flag came from the # part, so the address can be rewritten to today's form.
 */
export function fromAddress(search: string, hash: string): { shared: Shared; old: boolean } | null {
  const now = fromQuery(search);
  if (now) return { shared: now, old: false };
  const then = fromHash(hash);
  return then ? { shared: then, old: true } : null;
}

/**
 * The flag a whole link holds, if the link is one of ours: `origins` lists the addresses that
 * count as this site ("https://flag.eurth.org"). Anything else is null: a profile file's link
 * may point anywhere, and only our own is opened.
 */
export function fromLink(link: unknown, origins: readonly string[]): Shared | null {
  if (typeof link !== 'string' || link.length > MAX_LENGTH) return null;
  try {
    const url = new URL(link);
    if (!origins.some((origin) => new URL(origin).origin === url.origin)) return null;
    return fromAddress(url.search, url.hash)?.shared ?? null;
  } catch {
    return null;
  }
}
