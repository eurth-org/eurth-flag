/**
 * Starting points: the classic flag layouts, each a simple-mode design. They serve as the
 * template gallery, as pictures for the glossary, and as the sharing image. None is a real
 * country's flag: the colours are picked so each layout reads clearly.
 */
import { defaultSimple, type Simple } from './simple';

export interface Template {
  id: string;
  name: string;
  /** What the layout is, and where it's seen. */
  about: string;
  simple: Simple;
}

const t = (id: string, name: string, about: string, simple: Partial<Simple>): Template => ({
  id,
  name,
  about,
  simple: { ...defaultSimple(), overlay: 'none', symbol: 'none', ...simple },
});

export const templates: readonly Template[] = [
  t('tricolour', 'Horizontal tricolour', 'Three equal bands, the layout of a third of the world’s flags. Change the colours and it is yours.', { division: 'h3', colors: ['#0a1f5c', '#ffffff', '#009739'] }),
  t('vertical-tricolour', 'Vertical tricolour', 'Three bands side by side, in the manner France made famous in 1794.', { division: 'v3', colors: ['#5c2d91', '#ffffff', '#ffb81c'] }),
  t('charged-triband', 'Triband with a charge', 'A wide middle band gives a symbol room: the Spanish fess.', { division: 'h-fess', colors: ['#0a1f5c', '#ffb81c', '#0a1f5c'], symbol: 'e-crown', symbolColor: '#0a1f5c', scale: 's' }),
  t('nordic-cross', 'Nordic cross', 'A cross set towards the hoist, so it looks centred when the flag flies. Scandinavia’s family flag.', { division: 'solid', colors: ['#00847e', '#ffffff', '#fcd116'], overlay: 'nordic', overlayColor: '#ffffff' }),
  t('saltire', 'Saltire', 'A diagonal cross, corner to corner. Scotland, Jamaica and many a navy.', { division: 'solid', colors: ['#005c2e', '#ffffff', '#fcd116'], overlay: 'saltire', overlayColor: '#ffb81c' }),
  t('canton', 'Canton and stripes', 'Stripes with a block in the upper hoist: room for a symbol where it stays visible on a still day.', { division: 'h7', colors: ['#00847e', '#ffffff', '#fcd116'], overlay: 'canton', overlayColor: '#7b1e2b', symbol: 'sun', symbolColor: '#ffb81c', position: 'canton', scale: 'l' }),
  t('hoist-triangle', 'Hoist triangle', 'A triangle pointing into the fly, as on the flags of Czechia, Cuba and the Bahamas.', { division: 'h2', colors: ['#ffffff', '#009739', '#fcd116'], overlay: 'pile', overlayColor: '#0a1f5c', symbol: 'star5', symbolColor: '#fcd116', position: 'hoist', scale: 'm' }),
  t('sun-disc', 'Disc on a field', 'One shape, one field. Japan, Bangladesh and Palau show how far that goes.', { division: 'solid', colors: ['#0a1f5c', '#ffffff', '#fcd116'], symbol: 'sun', symbolColor: '#ffb81c', scale: 'l' }),
  t('crescent', 'Crescent and star', 'A crescent holding a star, seen from Türkiye to Malaysia.', { division: 'solid', colors: ['#7b1e2b', '#ffffff', '#fcd116'], symbol: 'e-star-and-crescent', symbolColor: '#ffb81c', scale: 'l' }),
  t('ring-of-stars', 'Ring of stars', 'Stars in a circle: a union of equals. One star per member, or a fixed number, as Europe chose.', { division: 'solid', colors: ['#5c2d91', '#ffffff', '#fcd116'], symbol: 'star-ring', symbolColor: '#ffffff', scale: 'l' }),
  t('pall', 'Pall', 'A Y on its side, joining two bands into one: South Africa’s idea of coming together.', { division: 'h2', colors: ['#ce1126', '#0038a8', '#ffffff'], overlay: 'pall', overlayColor: '#ffffff' }),
  t('bicolour-emblem', 'Bicolour with an emblem', 'Two bands and one clear symbol across them.', { division: 'h2', colors: ['#6cace4', '#ffffff', '#fcd116'], symbol: 'e-anchor', symbolColor: '#0a1f5c', scale: 'm' }),
  t('diagonal', 'Diagonal bicolour', 'Divided corner to corner. Rare among nations, so it stands out.', { division: 'bend-up', colors: ['#6cace4', '#0a1f5c', '#ffffff'], symbol: 'e-horse', symbolColor: '#ffffff', scale: 'm' }),
  t('bend', 'Bend', 'A diagonal band across the field, as on the flags of Tanzania and Namibia. Here it carries a star.', { division: 'solid', colors: ['#ce1126', '#ffffff', '#fcd116'], overlay: 'bend-sinister', overlayColor: '#ffffff', symbol: 'star5', symbolColor: '#ce1126', scale: 's' }),
  t('quartered', 'Quartered', 'Four quarters in two colours, set diagonally: a favourite of cities and old families.', { division: 'quarters', colors: ['#00847e', '#fcd116', '#ffffff'] }),
  t('bordered', 'Bordered field', 'A border frames a field and its charge, as on the flags of the Maldives and Montenegro.', { division: 'solid', colors: ['#ce1126', '#ffffff', '#fcd116'], overlay: 'border', overlayColor: '#ffb81c', symbol: 'e-dove', symbolColor: '#ffffff', scale: 'm' }),
  t('rays', 'Rays', 'Rays from the centre: a rising sun, or a compass of provinces.', { division: 'gyronny16', colors: ['#0a1f5c', '#6cace4', '#fcd116'], symbol: 'disc', symbolColor: '#ffb81c', scale: 'm' }),
  t('hoist-band', 'Hoist band', 'A band along the hoist with stripes beside it, as on the flags of Benin, Madagascar and the Emirates.', { division: 'h2', colors: ['#6cace4', '#ffffff', '#fcd116'], overlay: 'hoist-band', overlayColor: '#0a1f5c', symbol: 'star5', symbolColor: '#fcd116', position: 'hoist', scale: 'm' }),
];
