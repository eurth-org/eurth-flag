/**
 * A flag as a picture in one of the suite's sharing sizes (link preview, square, portrait,
 * story, pin, wide): the flag whole, centred on a Night ground with room around it. One SVG that
 * carries everything it shows, so it downloads as it is or is drawn into a PNG or WebP.
 *
 * A picture can't use the stylesheet's custom properties, so the ground and the flag's edge are
 * read from the same tokens, as plain values.
 */
import { resolveColors } from '@eurth/style';
import tokens from '@eurth/style/tokens.json';
import type { Flag } from './model';
import { flagSize, flagSvg } from './render';

const esc = (s: string): string => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const f = (v: number): string => String(Math.round(v * 100) / 100);

export interface PictureSize {
  width: number;
  height: number;
}

/** Where the flag sits in a picture of that size: as large as fits, a tenth of the short side kept clear. */
export function placeFlag(flag: Flag, { width, height }: PictureSize): { x: number; y: number; w: number; h: number } {
  const { W, H } = flagSize(flag);
  const margin = Math.min(width, height) / 10;
  const scale = Math.min((width - 2 * margin) / W, (height - 2 * margin) / H);
  const [w, h] = [W * scale, H * scale];
  return { x: (width - w) / 2, y: (height - h) / 2, w, h };
}

export function pictureSvg(flag: Flag, size: PictureSize, options: { title?: string; desc?: string } = {}): string {
  const night = resolveColors(tokens, 'dark');
  const { x, y, w, h } = placeFlag(flag, size);
  const label = options.title ? ` role="img" aria-label="${esc(options.title)}"` : '';
  const title = options.title ? `<title>${esc(options.title)}</title>` : '';
  const desc = options.desc ? `<desc>${esc(options.desc)}</desc>` : '';
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size.width} ${size.height}" width="${size.width}" height="${size.height}"${label}>${title}${desc}` +
    `<rect width="${size.width}" height="${size.height}" fill="${night.surface}"/>` +
    `<g transform="translate(${f(x)} ${f(y)})">${flagSvg(flag, { width: w, clipId: 'picture-clip' })}</g>` +
    // A thin edge, so a flag in Night's own colours still shows where it ends.
    `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" fill="none" stroke="${night['line-strong']}" stroke-width="2"/></svg>`
  );
}
