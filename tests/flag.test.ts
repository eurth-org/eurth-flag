import { describe, expect, it } from 'vitest';
import { cleanColor, colorName, contrast } from '../src/flag/colors';
import { describeFlag } from '../src/flag/describe';
import { emblems } from '../src/flag/emblems';
import { createProfile, getSection, parseProfile, serialiseProfile, setSection, validateProfile } from '@eurth/profile';
import calderwyn from '@eurth/profile/examples/calderwyn.eurth.json';
import { PICTURE_SIZES } from '@eurth/style';
import { advancedLink, cleanFlag, decodeFlag, decodeSimple, encodeFlag, encodeSimple, flagLink, fromAddress, fromHash, fromLink, fromQuery, simpleLink, toQuery } from '../src/flag/link';
import { colorsOf, defaultFlag, newOverlay, overlayDefs, overlayTypes, type Flag } from '../src/flag/model';
import { pictureSvg, placeFlag } from '../src/flag/picture';
import { flagFromProfile, linkFits, withFlag } from '../src/flag/profile';
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

/** A flag without its layer ids, which are made anew each time a link is read. */
const bare = (flag: Flag) => ({ ...flag, overlays: flag.overlays.map(({ id: _id, ...rest }) => rest) });

describe('links', () => {
  it('carry simple flags there and back', () => {
    for (const template of templates) expect(decodeSimple(encodeSimple(template.simple))).toEqual(template.simple);
  });
  it('carry advanced flags there and back, apart from layer ids', () => {
    const flag = fromSimple(templates[5]!.simple);
    expect(bare(decodeFlag(encodeFlag(flag))!)).toEqual(bare(flag));
  });
  it('put the design in the query string, with its version in front', () => {
    const simple = templates.find((t) => t.id === 'nordic-cross')!.simple;
    expect(simpleLink(simple)).toBe('/?s=1.solid_00847e_ffffff_fcd116_nordic_ffffff_none_0a1f5c_centre_m_2x3');
    expect(advancedLink(fromSimple(simple))).toMatch(/^\/\?f=1\.[A-Za-z0-9_-]+$/);
    expect(flagLink({ mode: 'simple', simple, name: 'Orioni' }, 'https://flag.eurth.org')).toBe(
      'https://flag.eurth.org/?s=1.solid_00847e_ffffff_fcd116_nordic_ffffff_none_0a1f5c_centre_m_2x3&n=Orioni',
    );
    expect(fromQuery('?s=1.solid_00847e_ffffff_fcd116_nordic_ffffff_none_0a1f5c_centre_m_2x3&n=Orioni')).toEqual({ mode: 'simple', simple, name: 'Orioni' });
  });
  it('carry every template and a busy advanced flag through an address', () => {
    for (const template of templates) {
      expect(fromAddress(simpleLink(template.simple).slice(1), '')).toEqual({ shared: { mode: 'simple', simple: template.simple, name: '' }, old: false });
      const flag = fromSimple(template.simple);
      const back = fromAddress(advancedLink(flag).slice(1), '')!;
      expect(back.old).toBe(false);
      expect(bare(back.shared.flag!)).toEqual(bare(flag));
    }
  });
  it('carry the name', () => {
    const query = toQuery({ mode: 'simple', simple: defaultSimple(), name: 'Orioni & co' });
    expect(query).toContain('n=Orioni+%26+co');
    expect(fromQuery(`?${query}`)).toMatchObject({ mode: 'simple', name: 'Orioni & co' });
  });
  it('refuse nonsense, and versions from the future', () => {
    expect(fromQuery('?s=nope')).toBeNull();
    expect(fromQuery('?s=1.nope')).toBeNull();
    expect(fromQuery('?f=1.%%%')).toBeNull();
    expect(fromQuery('?f=1.bnVsbA')).toBeNull();
    expect(fromQuery('?s=2.h3_ce1126_ffffff_0038a8_none_fcd116_none_0a1f5c_centre_m_2x3')).toBeNull();
    expect(fromQuery(`?f=2.${encodeFlag(defaultFlag()).slice(2)}`)).toBeNull();
    expect(fromQuery('')).toBeNull();
    expect(fromQuery(`?s=1.${'x'.repeat(50_000)}`)).toBeNull();
    expect(fromAddress('', '')).toBeNull();
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
    expect(fromQuery('?s=1.h3_zzzzzz_ffffff_0038a8_none_fcd116_none_0a1f5c_centre_m_2x3&n=%3Cb%3EOrioni%3C%2Fb%3E')).toMatchObject({ name: 'bOrioni/b', simple: { colors: ['#2698d4', '#ffffff', '#0038a8'] } });
  });
});

/*
 * Links made before November 2026 kept the design after the #, with no version. They are all over
 * the forum, so these are real ones: the first two from the templates page as it was, the third an
 * advanced flag as the maker wrote it then. They must open the same flag for good.
 */
describe('old links', () => {
  const oldNordic = '#s=solid_00847e_ffffff_fcd116_nordic_ffffff_none_0a1f5c_centre_m_2x3';
  const oldCanton = '#s=h7_00847e_ffffff_fcd116_canton_7b1e2b_sun_ffb81c_canton_l_2x3&n=Orioni%20%26%20co';
  const oldAdvanced =
    '#f=eyJyYXRpbyI6WzIsM10sImRpdmlzaW9uIjp7InR5cGUiOiJiYW5kcyIsImRpciI6ImgiLCJiYW5kcyI6W3siY29sb3IiOiIjMGExZjVjIiwid2VpZ2h0IjoxfSx7ImNvbG9yIjoiI2ZmZmZmZiIsIndlaWdodCI6Mn1dfSwib3ZlcmxheXMiOlt7InR5cGUiOiJzdGFyIiwiY29sb3IiOiIjZmNkMTE2IiwieCI6NTAsInkiOjUwLCJzaXplIjo0MCwicG9pbnRzIjo1LCJpbm5lciI6MzgsInJvdCI6MH1dfQ';

  it('open the same simple flag', () => {
    const nordic = templates.find((t) => t.id === 'nordic-cross')!.simple;
    expect(fromAddress('', oldNordic)).toEqual({ shared: { mode: 'simple', simple: nordic, name: '' }, old: true });
    expect(fromAddress('', oldCanton)).toEqual({ shared: { mode: 'simple', simple: templates.find((t) => t.id === 'canton')!.simple, name: 'Orioni & co' }, old: true });
    for (const template of templates) expect(fromHash(`#s=${encodeSimple(template.simple)}`)?.simple).toEqual(template.simple);
  });
  it('open the same advanced flag', () => {
    const arrived = fromAddress('', oldAdvanced)!;
    expect(arrived.old).toBe(true);
    expect(arrived.shared.mode).toBe('advanced');
    expect(bare(arrived.shared.flag!)).toEqual({
      ratio: [2, 3],
      division: { type: 'bands', dir: 'h', bands: [{ color: '#0a1f5c', weight: 1 }, { color: '#ffffff', weight: 2 }] },
      overlays: [{ type: 'star', color: '#fcd116', x: 50, y: 50, size: 40, points: 5, inner: 38, rot: 0 }],
    });
  });
  it('are rewritten to today\'s form, which draws the same flag', () => {
    for (const old of [oldNordic, oldCanton, oldAdvanced]) {
      const { shared } = fromAddress('', old)!;
      const query = toQuery(shared);
      expect(query).toMatch(/^[sf]=1\./);
      const again = fromAddress(`?${query}`, '')!;
      expect(again.old).toBe(false);
      expect(again.shared.name).toBe(shared.name);
      const draw = (s: typeof shared) => flagSvg(s.mode === 'simple' ? fromSimple(s.simple!) : s.flag!);
      expect(draw(again.shared)).toBe(draw(shared));
    }
  });
  it('give way to the query string when an address has both', () => {
    const tricolour = templates[0]!.simple;
    expect(fromAddress(simpleLink(tricolour).slice(1), oldNordic)).toEqual({ shared: { mode: 'simple', simple: tricolour, name: '' }, old: false });
  });
  it('refuse nonsense as before', () => {
    expect(fromHash('#s=nope')).toBeNull();
    expect(fromHash('#f=%%%')).toBeNull();
    expect(fromHash('#check-title')).toBeNull();
    expect(fromHash('')).toBeNull();
  });
});

describe('the nation profile', () => {
  const simple = templates.find((t) => t.id === 'nordic-cross')!.simple;
  const flag = fromSimple(simple);
  const mine = { link: flagLink({ mode: 'simple', simple, name: 'Orioni' }, 'https://flag.eurth.org'), summary: describeFlag(flag), svg: flagSvg(flag, { title: 'Flag of Orioni' }), ratio: flag.ratio, colours: colorsOf(flag) };

  it('starts a new file with the nation\'s name and the flag, and nothing else', () => {
    const profile = withFlag(null, 'Orioni', mine);
    expect(Object.keys(profile)).toEqual(['meta', 'flag']);
    expect(profile.meta.nation).toBe('Orioni');
    expect(getSection(profile, 'flag')).toMatchObject({ link: mine.link, summary: 'A teal field, with a white Nordic cross. Proportions 2:3.', ratio: '2:3', colours: ['#00847e', '#ffffff'] });
    expect(getSection(profile, 'flag')?.svg).toContain('<svg');
    expect(validateProfile(profile).ok).toBe(true);
  });
  it('leaves every other section exactly as it was, known or not', () => {
    const loaded = { ...(parseProfile(JSON.stringify(calderwyn)) as { ok: true; profile: ReturnType<typeof createProfile> }).profile, fromTheFuture: { anything: [1, 2, 3] } };
    const before = JSON.parse(serialiseProfile(loaded));
    const after = JSON.parse(serialiseProfile(withFlag(loaded, 'Somewhere else', mine)));
    expect(after.meta.nation).toBe(before.meta.nation);
    for (const key of Object.keys(before)) {
      if (key !== 'flag' && key !== 'meta') expect(after[key], key).toEqual(before[key]);
    }
    expect(Object.keys(after).sort()).toEqual(Object.keys(before).sort());
    expect(after.fromTheFuture).toEqual({ anything: [1, 2, 3] });
    expect(after.flag.link).toBe(mine.link);
    expect(validateProfile(withFlag(loaded, '', mine)).ok).toBe(true);
  });
  it('keeps fields a newer Flagwright may have added to its own section', () => {
    const newer = setSection(createProfile('Orioni'), 'flag', { link: 'https://flag.eurth.org/?s=1.old', motto: 'kept' } as never);
    expect(getSection(withFlag(newer, 'Orioni', mine), 'flag')).toMatchObject({ motto: 'kept', link: mine.link });
  });
  it('fits the profile\'s limits: a link too long is left out, a long description is cut', () => {
    const busy = { ...defaultFlag(), overlays: Array.from({ length: 60 }, (_, i) => newOverlay('starRing', '#ce1126', { x: i, y: i })) };
    const link = `https://flag.eurth.org${advancedLink(busy)}`;
    expect(linkFits(link)).toBe(false);
    const stale = setSection(createProfile('Orioni'), 'flag', { link: mine.link });
    const profile = withFlag(stale, 'Orioni', { link, summary: describeFlag(busy), svg: flagSvg(busy), ratio: busy.ratio, colours: colorsOf(busy) });
    const section = getSection(profile, 'flag')!;
    expect(section.link).toBeUndefined();
    expect(section.summary!.length).toBeLessThanOrEqual(600);
    expect(section.summary!.endsWith('…')).toBe(true);
    expect(validateProfile(profile).ok).toBe(true);
    // The link itself still opens the whole flag.
    expect(fromLink(link, ['https://flag.eurth.org'])?.flag?.overlays).toHaveLength(60);
  });
  it('opens the flag a profile brings, if its link is a Flagwright link', () => {
    const ours = ['https://flag.eurth.org'];
    expect(flagFromProfile(withFlag(null, 'Orioni', mine), ours)).toEqual({ mode: 'simple', simple, name: 'Orioni' });
    const old = setSection(createProfile('Orioni'), 'flag', { link: 'https://flag.eurth.org/#s=solid_00847e_ffffff_fcd116_nordic_ffffff_none_0a1f5c_centre_m_2x3' });
    expect(flagFromProfile(old, ours)?.simple).toEqual(simple);
    const elsewhere = setSection(createProfile('Orioni'), 'flag', { link: mine.link.replace('flag.eurth.org', 'flag.example.org') });
    expect(flagFromProfile(elsewhere, ours)).toBeNull();
    // The examples' links are placeholders, not designs.
    expect(flagFromProfile((parseProfile(JSON.stringify(calderwyn)) as { ok: true; profile: ReturnType<typeof createProfile> }).profile, ours)).toBeNull();
    expect(flagFromProfile(createProfile('Orioni'), ours)).toBeNull();
    expect(flagFromProfile(null, ours)).toBeNull();
    expect(fromLink('javascript:alert(1)', ours)).toBeNull();
    expect(fromLink(42, ours)).toBeNull();
  });
});

describe('pictures in the sharing sizes', () => {
  it('hold the whole flag, centred, with room around it', () => {
    for (const ratio of [[2, 3], [1, 2], [3, 2], [1, 1]] as [number, number][]) {
      const flag = { ...defaultFlag(), ratio };
      for (const size of PICTURE_SIZES) {
        const { x, y, w, h } = placeFlag(flag, size);
        const margin = Math.min(size.width, size.height) / 10;
        expect(x).toBeGreaterThanOrEqual(margin - 0.01);
        expect(y).toBeGreaterThanOrEqual(margin - 0.01);
        expect(x * 2 + w).toBeCloseTo(size.width);
        expect(y * 2 + h).toBeCloseTo(size.height);
        expect(w / h).toBeCloseTo(ratio[1] / ratio[0]);
        const svg = pictureSvg(flag, size, { title: 'Flag of <Orioni>', desc: 'A "test"' });
        expect(svg).toContain(`viewBox="0 0 ${size.width} ${size.height}" width="${size.width}" height="${size.height}"`);
        expect(svg).toContain('<title>Flag of &lt;Orioni&gt;</title>');
        expect(svg).not.toMatch(/NaN|undefined|Infinity|var\(/);
        expect(svg.match(/<svg/g)).toHaveLength(2);
      }
    }
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
