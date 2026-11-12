// After `astro build`:
// 1. The Content-Security-Policy in dist/_headers gets the hash of every inline script the built
//    pages carry, so those scripts run and no others can.
// 2. dist/sw.js is written from src/offline/sw.js, with the list of files to keep on the device
//    and a version made from their contents.
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const DIST = 'dist';
const files = [];
const walk = (dir) => {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) walk(path);
    else files.push(relative(DIST, path));
  }
};
walk(DIST);

// 1. Inline scripts. Data blocks (JSON-LD) don't run, so they need no hash.
const hashes = new Set();
for (const file of files.filter((f) => f.endsWith('.html'))) {
  const html = readFileSync(join(DIST, file), 'utf8');
  for (const [, attrs, body] of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)) {
    if (/\bsrc=/.test(attrs) || /type="application\/(ld\+)?json"/.test(attrs) || !body.trim()) continue;
    hashes.add(`'sha256-${createHash('sha256').update(body).digest('base64')}'`);
  }
}
const headersPath = join(DIST, '_headers');
const headers = readFileSync(headersPath, 'utf8');
if (headers.split('__SCRIPT_HASHES__').length !== 2) throw new Error('postbuild: public/_headers must hold the __SCRIPT_HASHES__ placeholder exactly once');
writeFileSync(headersPath, headers.replace('__SCRIPT_HASHES__', [...hashes].sort().join(' ')));
console.log(`postbuild: ${hashes.size} inline script hashes in the Content-Security-Policy`);

// 2. The service worker. Left out: the sharing image, the server's files and the 404 page.
const skip = (path) => /^(og\.png$|_headers$|404\.html$|sw\.js$|robots\.txt$|sitemap)/.test(path);
const app = files.filter((f) => !skip(f)).sort();
const version = createHash('sha256');
for (const file of app) version.update(file).update(readFileSync(join(DIST, file)));
const urls = app.map((f) => `/${f.replace(/(^|\/)index\.html$/, '$1')}`);
const worker = readFileSync('src/offline/sw.js', 'utf8')
  .replace("'__VERSION__'", JSON.stringify(version.digest('hex').slice(0, 12)))
  .replace('__APP__', JSON.stringify(urls));
writeFileSync(join(DIST, 'sw.js'), worker);
console.log(`postbuild: service worker keeps ${urls.length} files`);
