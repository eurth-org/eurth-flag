import { describe, expect, it } from 'vitest';
import { cleanColor, colorName, contrast } from '../src/flag/colors';
import { describeFlag } from '../src/flag/describe';
import { emblems } from '../src/flag/emblems';
import { cleanFlag, decodeFlag, decodeSimple, encodeFlag, encodeSimple, fromHash, toHash } from '../src/flag/link';
import { defaultFlag, newOverlay, overlayDefs, overlayTypes } from '../src/flag/model';
import { randomSimple } from '../src/flag/random';
import { flagSize, flagSvg } from '../src/flag/render';
import { colorUnder, divisionColorAt, lookalike, review } from '../src/flag/review';
import { defaultSimple, divisionPresets, fromSimple, overlayPresets, symbolPresets } from '../src/flag/simple';
import { templates } from '../src/flag/templates';

/** A repeatable random number generator (mulberry32), so random flags can be tested. */
function seeded(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const wellFormed = (svg: string) => {
  expect(svg).toMatch(/^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" viewBox="0 0 \d+ 600"/);
  expect(svg).not.toMatch(/NaN|undefined|Infinity/);
  expect(svg.match(/<svg/g)).toHaveLength(1);
};

describe('colours', () => {
  it('cleans anything into #rrggbb', () => {
    expect(cleanColor('#FFF')).toBe('#ffffff');
    expect(cleanColor('CE1126')).toBe('#ce1126');
    expect(cleanColor('red"/><script>')).toBe('#ffffff');
    expect(cleanColor(42, '#000000')).toBe('#000000');
  });
  it('names colours and measures contrast', () => {
    expect(colorName('#d01020')).toBe('red');
    expect(contrast('#000000', '#ffffff')).toBeCloseTo(21);
  });
});

describe('rendering', () => {
  it('draws every division preset', () => {
    for (const preset of divisionPresets) wellFormed(flagSvg(fromSimple({ ...defaultSimple(), division: preset.id })));
  });
  it('draws every overlay preset and every drawn symbol', () => {
    for (const preset of overlayPresets) wellFormed(flagSvg(fromSimple({ ...defaultSimple(), overlay: preset.id })));
    for (const preset of symbolPresets) {
      const flag = fromSimple({ ...defaultSimple(), symbol: preset.id });
      wellFormed(flagSvg(flag));
      expect(flag.overlays.length).toBe(preset.id === 'none' ? 0 : 1);
    }
  });
  it('draws every layer type with its defaults', () => {
    expect(overlayDefs.map((d) => d.type).sort()).toEqual([...overlayTypes].sort());
    for (const type of overlayTypes) {
      const flag = { ...defaultFlag(), overlays: [newOverlay(type, '#ce1126')] };
      const svg = flagSvg(flag, { ids: true });
      wellFormed(svg);
      expect(svg).toContain('"#ce1126"');
    }
  });
  it('draws every emblem', () => {
    expect(new Set(emblems.map((e) => e.id)).size).toBe(emblems.length);
    for (const e of emblems) wellFormed(flagSvg({ ...defaultFlag(), overlays: [newOverlay('emblem', '#000000', { icon: e.id })] }));
  });
  it('follows the proportions', () => {
    expect(flagSize({ ...defaultFlag(), ratio: [1, 2] })).toEqual({ W: 1200, H: 600 });
    expect(flagSvg({ ...defaultFlag(), ratio: [1, 2] }, { width: 800 })).toContain('width="800" height="400"');
  });
  it('escapes the title', () => {
    expect(flagSvg(defaultFlag(), { title: 'Flag of <b>&"' })).toContain('<title>Flag of &lt;b&gt;&amp;&quot;</title>');
  });
});

describe('links', () => {
  it('carry simple flags there and back', () => {
    for (const template of templates) expect(decodeSimple(encodeSimple(template.simple))).toEqual(template.simple);
  });
  it('carry advanced flags there and back, apart from layer ids', () => {
    const flag = fromSimple(templates[5]!.simple);
    const back = decodeFlag(encodeFlag(flag))!;
    expect(back.division).toEqual(flag.division);
    expect(back.overlays.map(({ id: _id, ...rest }) => rest)).toEqual(flag.overlays.map(({ id: _id, ...rest }) => rest));
  });
  it('carry the name', () => {
    const hash = toHash({ mode: 'simple', simple: defaultSimple(), name: 'Orioni & co' });
    expect(fromHash(`#${hash}`)).toMatchObject({ mode: 'simple', name: 'Orioni & co' });
  });
  it('refuse nonsense', () => {
    expect(fromHash('#s=nope')).toBeNull();
    expect(fromHash('#f=%%%')).toBeNull();
    expect(fromHash('')).toBeNull();
  });
  it('clean what they are given', () => {
    const flag = cleanFlag({
      ratio: [0, 9999],
      division: { type: 'bands', dir: 'x', bands: [{ color: 'url(javascript:1)', weight: -5 }] },
      overlays: [
        { type: 'emblem', icon: '"><script>alert(1)</script>', color: '"onload="x', x: 1e9, size: 'big' },
        { type: 'script' },
        { type: 'star', points: 1e6, color: '#abc' },
      ],
    });
    expect(flag.ratio).toEqual([1, 40]);
    expect(flag.overlays).toHaveLength(2);
    expect(flag.overlays[0]).toMatchObject({ icon: 'crown', color: '#000000', x: 150 });
    expect(flag.overlays[1]).toMatchObject({ points: 24, color: '#aabbcc' });
    const svg = flagSvg(flag, { ids: true });
    wellFormed(svg);
    expect(svg).not.toMatch(/script|javascript|onload/);
  });
});

describe('description', () => {
  it('names the classic layouts', () => {
    expect(describeFlag(fromSimple({ ...defaultSimple(), division: 'h3', colors: ['#ce1126', '#ffffff', '#0038a8'], symbol: 'none' }))).toBe(
      'A horizontal tricolour of red, white and blue. Proportions 2:3.',
    );
    expect(describeFlag(fromSimple(templates.find((t) => t.id === 'nordic-cross')!.simple))).toBe('A teal field, with a white Nordic cross. Proportions 2:3.');
    expect(describeFlag(fromSimple(templates.find((t) => t.id === 'canton')!.simple))).toContain('a maroon canton and a gold sun of sixteen rays in the canton');
  });
});

describe('design check', () => {
  it('knows the field under a point', () => {
    const d = fromSimple({ ...defaultSimple(), division: 'h3', colors: ['#ce1126', '#ffffff', '#0038a8'] }).division;
    expect(divisionColorAt(d, 50, 10)).toBe('#ce1126');
    expect(divisionColorAt(d, 50, 50)).toBe('#ffffff');
    expect(divisionColorAt(d, 50, 90)).toBe('#0038a8');
  });
  it('sees what a charge lies on', () => {
    const flag = fromSimple(templates.find((t) => t.id === 'canton')!.simple);
    expect(colorUnder(flag, 1)).toBe('#7b1e2b');
  });
  it('warns when a charge is lost', () => {
    const flag = fromSimple({ ...defaultSimple(), division: 'solid', colors: ['#ce1126', '#ffffff', '#0038a8'], symbol: 'star5', symbolColor: '#ce1126' });
    expect(review(flag).findings.some((f) => f.level === 'warn' && f.id.startsWith('lost-'))).toBe(true);
  });
  it('recognises flags that fly already', () => {
    expect(lookalike(fromSimple({ ...defaultSimple(), division: 'v3', colors: ['#0038a8', '#ffffff', '#ce1126'], symbol: 'none' }))).toBe('France');
    expect(lookalike(fromSimple({ ...defaultSimple(), division: 'solid', colors: ['#ffffff', '#ffffff', '#ffffff'], symbol: 'disc', symbolColor: '#ce1126' }))).toBe('Japan');
    expect(lookalike(fromSimple(templates[0]!.simple))).toBeNull();
  });
  it('passes every template without a warning', () => {
    for (const template of templates) {
      const warnings = review(fromSimple(template.simple)).findings.filter((f) => f.level === 'warn');
      expect(warnings, template.id).toEqual([]);
    }
  });
});

describe('random flags', () => {
  it('are drawable, and their symbols can be seen', () => {
    const rng = seeded(2004);
    for (let i = 0; i < 300; i++) {
      const simple = randomSimple(rng);
      const flag = fromSimple(simple);
      wellFormed(flagSvg(flag));
      expect(decodeSimple(encodeSimple(simple))).toEqual(simple);
      expect(review(flag).findings.filter((f) => f.id.startsWith('lost-')), encodeSimple(simple)).toEqual([]);
    }
  });
});
