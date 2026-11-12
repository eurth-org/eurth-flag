/// <reference types="node" />
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// The Content-Security-Policy allows inline scripts only by their hashes, which the build writes
// in (tools/postbuild.mjs). The source must never allow them wholesale; and when a build is
// present, every inline script in it must be on the list, or the page would break in silence.
describe('security headers', () => {
  const source = readFileSync('public/_headers', 'utf8');

  it('allow inline scripts only by hash', () => {
    expect(source).toContain("script-src 'self' __SCRIPT_HASHES__;");
    expect(source).not.toMatch(/script-src[^;]*'unsafe-inline'/);
    expect(source).not.toMatch(/script-src[^;]*'unsafe-eval'/);
  });

  it('turn off what the site never uses', () => {
    expect(source).toMatch(/object-src 'none'/);
    expect(source).toMatch(/Permissions-Policy: camera=\(\), microphone=\(\), geolocation=\(\)/);
  });

  it.skipIf(!existsSync('dist/_headers'))('list every inline script of the built pages', () => {
    const built = readFileSync('dist/_headers', 'utf8');
    expect(built).not.toContain('__SCRIPT_HASHES__');
    const pages: string[] = [];
    const walk = (dir: string) => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        if (entry.isDirectory()) walk(join(dir, entry.name));
        else if (entry.name.endsWith('.html')) pages.push(join(dir, entry.name));
      }
    };
    walk('dist');
    expect(pages.length).toBeGreaterThan(3);
    for (const page of pages) {
      const html = readFileSync(page, 'utf8');
      for (const [, attrs, body] of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)) {
        if (/\bsrc=/.test(attrs!) || /type="application\/(ld\+)?json"/.test(attrs!) || !body!.trim()) continue;
        expect(built, `${page}: ${body!.slice(0, 60)}`).toContain(`'sha256-${createHash('sha256').update(body!).digest('base64')}'`);
      }
    }
  });
});
