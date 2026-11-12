// Makes the pictures that aren't drawn by hand, with headless Chrome:
//   public/og.png            the sharing image (1200 × 630), flags from the template gallery
//   public/favicon.ico       the logo at 16, 32 and 48 pixels
//   public/apple-touch-icon.png, icon-192.png, icon-512.png   the logo on white, for home screens
// Run it after changing the logo (src/assets/logo.svg) or the templates:  npm run images
import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer } from 'vite';

const chrome = process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const work = mkdtempSync(join(tmpdir(), 'flagwright-'));
const logo = readFileSync('src/assets/logo.svg', 'utf8');

function shot(name, html, width, height, transparent = false) {
  const page = join(work, `${name}.html`);
  const out = join(work, `${name}.png`);
  writeFileSync(page, html);
  execFileSync(
    chrome,
    ['--headless=new', '--hide-scrollbars', '--disable-gpu', '--force-device-scale-factor=1', ...(transparent ? ['--default-background-color=00000000'] : []), `--window-size=${width},${height}`, `--screenshot=${out}`, `file://${page}`],
    { stdio: 'ignore' },
  );
  return out;
}

const icon = (size, logoSize, background) =>
  `<!doctype html><body style="margin:0;background:${background};display:grid;place-items:center;width:${size}px;height:${size}px"><div style="width:${logoSize}px;height:${logoSize}px">${logo.replace('width="64" height="64"', 'width="100%" height="100%"')}</div></body>`;

// The flags come from the same code as the site, loaded through Vite (it reads TypeScript).
const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });
try {
  const { templates } = await vite.ssrLoadModule('/src/flag/templates.ts');
  const { fromSimple } = await vite.ssrLoadModule('/src/flag/simple.ts');
  const { flagSvg } = await vite.ssrLoadModule('/src/flag/render.ts');
  const pick = ['nordic-cross', 'hoist-triangle', 'sun-disc', 'canton', 'pall', 'crescent', 'ring-of-stars', 'diagonal', 'charged-triband', 'saltire'];
  const flags = pick.map((id, i) => flagSvg(fromSimple(templates.find((t) => t.id === id).simple), { clipId: `og-${i}`, fluid: true }));
  const og = `<!doctype html><meta charset="utf-8"><style>
    body{margin:0;width:1200px;height:630px;overflow:hidden;background:#002b36;color:#fcf6e1;font-family:system-ui,Arial,sans-serif}
    .top{position:absolute;left:64px;top:56px;right:64px}
    .brand{display:flex;align-items:center;gap:20px;font-size:84px;font-weight:800;letter-spacing:.01em;text-transform:uppercase;color:#2698d4;line-height:1}
    .brand svg{width:96px;height:96px}
    .tag{margin:18px 0 0;font-size:38px;font-weight:600}
    .sub{margin:10px 0 0;font-size:26px;color:#a2b0a8}
    .flags{position:absolute;left:64px;right:64px;bottom:56px;display:grid;grid-template-columns:repeat(5,1fr);gap:22px}
    .flags span{display:block;aspect-ratio:3/2;border-radius:4px;overflow:hidden;box-shadow:0 0 0 1px rgb(255 255 255/.25),0 8px 20px rgb(0 0 0/.35)}
    .flags svg{display:block;width:100%;height:100%}
    .url{position:absolute;right:64px;top:74px;font-size:28px;font-weight:700;color:#002b36;background:#fff;border-radius:8px;padding:8px 18px}
  </style><body>
    <div class="top"><div class="brand">${logo}Flagwright</div><p class="tag">Flags made to fly</p><p class="sub">A free flag maker for worldbuilders and vexillology nerds, by Eurth</p></div>
    <div class="url">flag.eurth.org</div>
    <div class="flags">${flags.map((f) => `<span>${f}</span>`).join('')}</div>
  </body>`;
  copyFileSync(shot('og', og, 1200, 630), 'public/og.png');
} finally {
  await vite.close();
}

copyFileSync(shot('apple-touch-icon', icon(180, 132, '#ffffff'), 180, 180), 'public/apple-touch-icon.png');
copyFileSync(shot('icon-192', icon(192, 132, '#ffffff'), 192, 192), 'public/icon-192.png');
copyFileSync(shot('icon-512', icon(512, 340, '#ffffff'), 512, 512), 'public/icon-512.png');

// The three small pictures, packed into one .ico (an .ico may hold PNG images as they are).
const images = [16, 32, 48].map((size) => ({ size, png: readFileSync(shot(`favicon-${size}`, icon(size, size, 'transparent'), size, size, true)) }));
const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(images.length, 4);
let offset = 6 + 16 * images.length;
const entries = images.map(({ size, png }) => {
  const entry = Buffer.alloc(16);
  entry.writeUInt8(size, 0);
  entry.writeUInt8(size, 1);
  entry.writeUInt16LE(1, 4);
  entry.writeUInt16LE(32, 6);
  entry.writeUInt32LE(png.length, 8);
  entry.writeUInt32LE(offset, 12);
  offset += png.length;
  return entry;
});
writeFileSync('public/favicon.ico', Buffer.concat([header, ...entries, ...images.map((i) => i.png)]));
rmSync(work, { recursive: true });
console.log('Made public/og.png, favicon.ico, apple-touch-icon.png, icon-192.png and icon-512.png');
