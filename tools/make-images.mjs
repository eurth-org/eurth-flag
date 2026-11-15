// Makes the pictures that aren't drawn by hand, with the Chrome on this machine: the favicon and
// the home-screen icons from Flagwright's own logo (src/assets/logo.svg), and the sharing image
// in the suite's layout, with flags from the template gallery as its art. Run it after changing
// the logo or the templates, and commit what it writes to public/:  npm run images
import { resolveColors } from '@eurth/style';
import { makeImages, sharingImage } from '@eurth/style/images';
import { readFileSync } from 'node:fs';
import { createServer } from 'vite';
import { site } from '../eurth.config.mjs';

const logo = readFileSync('src/assets/logo.svg', 'utf8');
const tokens = JSON.parse(readFileSync(new URL(import.meta.resolve('@eurth/style/tokens.json')), 'utf8'));
const night = resolveColors(tokens, 'dark');

// The flags come from the same code as the site (Vite reads TypeScript).
const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });
try {
  const { templates } = await vite.ssrLoadModule('/src/flag/templates.ts');
  const { fromSimple } = await vite.ssrLoadModule('/src/flag/simple.ts');
  const { flagSvg } = await vite.ssrLoadModule('/src/flag/render.ts');
  const pick = ['nordic-cross', 'hoist-triangle', 'sun-disc', 'canton', 'pall', 'ring-of-stars'];
  const flags = pick.map((id, i) => flagSvg(fromSimple(templates.find((t) => t.id === id).simple), { clipId: `og-${i}`, fluid: true }));
  const art = `<div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;width:100%">${flags
    .map((flag) => `<span style="display:block;aspect-ratio:3/2;overflow:hidden;border-radius:2px;outline:1px solid ${night['line-strong']};line-height:0">${flag}</span>`)
    .join('')}</div>`;
  const made = await makeImages({ logo, sharing: [{ file: 'og.png', html: sharingImage({ site, art }) }] });
  console.log(`Made ${made.map((file) => `public/${file}`).join(', ')}`);
} finally {
  await vite.close();
}
