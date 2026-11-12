/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync('src/styles/app.css', 'utf8');

/** The custom properties declared in one block of app.css, as written. */
function declared(css: string, selector: string): Record<string, string> {
  const start = css.indexOf(`${selector} {`);
  const block = css.slice(start, css.indexOf('}', start));
  return Object.fromEntries([...block.matchAll(/--([\w-]+):\s*([^;]+);/g)].map(([, name, value]) => [name!, value!.trim()]));
}

/** Follows var() references the way the browser does: after the theme's overrides apply. */
function resolved(found: Record<string, string>): Record<string, string> {
  const resolve = (value: string): string => {
    const ref = value.match(/^var\(--([\w-]+)\)$/);
    return ref ? resolve(found[ref[1]!]!) : value;
  };
  return Object.fromEntries(Object.entries(found).map(([k, v]) => [k, resolve(v)]));
}

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi! + 0.05) / (lo! + 0.05);
}

const light = resolved(declared(css, ':root'));
const dark = resolved({ ...declared(css, ':root'), ...declared(css, ":root[data-theme='dark']") });

// [foreground, background, minimum]: 4.5 for text, 3 for icons, borders and focus rings.
const pairs: [string, string, number][] = [
  ['ink', 'surface', 4.5],
  ['ink', 'surface-raised', 4.5],
  ['ink', 'header', 4.5],
  ['ink', 'button', 4.5],
  ['ink', 'flash', 4.5],
  ['ink-muted', 'surface', 4.5],
  ['ink-muted', 'surface-raised', 4.5],
  ['ink-muted', 'header', 4.5],
  ['accent-text', 'surface', 4.5],
  ['accent-text', 'surface-raised', 4.5],
  ['on-accent-small', 'accent-fill', 4.5],

  ['ink', 'hover', 4.5],
  ['danger', 'surface-raised', 3],
  ['unusual', 'surface-raised', 3],
  ['good', 'surface-raised', 3],
  ['good', 'surface', 3],
  ['accent-fill', 'surface-raised', 3],
  ['line-strong', 'surface', 3],
  ['line-strong', 'surface-raised', 3],
  ['focus-ring', 'surface', 3],
  ['focus-ring', 'surface-raised', 3],
];

it('uses the same dark colours with and without the theme switch', () => {
  expect(declared(css, ':root:not([data-theme])')).toEqual(declared(css, ":root[data-theme='dark']"));
});

/*
 * Brand exceptions, decided knowingly for Governmint and kept here: Eurth blue buttons and selected
 * options with white text, and the reverse for the top bar's links. Kept here so the actual ratios stay visible and
 * can't slip further.
 */
const exceptions: [string, string, number][] = [
  ['on-selected', 'selected', 3.2],
  // The top bar's links: white pills with Eurth blue text.
  ['eurth-blue', 'on-selected', 3.2],
  ['selected', 'surface', 3.2],
  ['selected', 'surface-raised', 2.9],
];

describe('brand exceptions', () => {
  it.each(exceptions)('%s on %s stays at %s:1 or better', (fg, bg, min) => {
    expect(contrast(light[fg]!, light[bg]!)).toBeGreaterThanOrEqual(min);
  });
});

describe.each([
  ['light', light],
  ['dark', dark],
])('%s theme', (_, theme) => {
  it.each(pairs)('%s on %s reaches %s:1', (fg, bg, min) => {
    expect(theme[fg], fg).toMatch(/^#[0-9a-f]{6}$/i);
    expect(theme[bg], bg).toMatch(/^#[0-9a-f]{6}$/i);
    expect(contrast(theme[fg]!, theme[bg]!)).toBeGreaterThanOrEqual(min);
  });
});
