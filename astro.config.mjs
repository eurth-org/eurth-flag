// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import svelte from '@astrojs/svelte';

export default defineConfig({
  site: 'https://flag.eurth.org',
  output: 'static',
  trailingSlash: 'always',
  // The stylesheet goes inside each page: the first paint needs one download instead of two.
  build: { inlineStylesheets: 'always' },
  // Scripts stay separate files, so the Content-Security-Policy can allow only the site's own.
  vite: { build: { assetsInlineLimit: 0 } },
  integrations: [
    svelte(),
    sitemap({
      filter: (page) => !/\/404\/?$/.test(page),
      changefreq: 'monthly',
      lastmod: new Date(),
    }),
  ],
});
