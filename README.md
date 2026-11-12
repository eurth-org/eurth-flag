# Flagwright

Flags made to fly. A free online flag maker for worldbuilders, writers, roleplayers and vexillology nerds: make a flag in four choices or layer by layer, have it checked against the principles of good flag design, and download it as SVG or PNG. Made by [Eurth](https://eurth.org), as a sibling of [Governmint](https://gov.eurth.org).

Live page: https://flag.eurth.org (not deployed yet; see [roadmap.md](roadmap.md), Next)

Status: preview. See the [roadmap](roadmap.md) for what's next, what each release added and what's not planned.

## How it works

- A static site built with Astro; the maker is a Svelte component that wakes up in the browser. There is no account and no server-side code: a flag lives in its link (`#s=…` for simple flags, `#f=…` for advanced ones) and, if saved, in the browser.
- The engine in `src/flag/` is plain TypeScript with no browser or framework in it: a flag is data, and one function draws it as SVG text. The editor, the downloads, the template pages (at build time), the sharing image and the tests all use that one function.
- Cloudflare serves the built files from `dist/` as Workers static assets on the `flag.eurth.org` custom domain (`wrangler.jsonc`).
- `public/_headers` sets security and caching headers. `tools/postbuild.mjs` writes the hashes of the pages' inline scripts into the Content-Security-Policy and builds the service worker.
- The look follows gov.eurth.org and the Eurth design system (`src/styles/app.css`): light, dark or Auto through the Deluminator-style switch.

## Where things live

| What | Where |
| --- | --- |
| The flag model: divisions, layer kinds and their numbers | `src/flag/model.ts` |
| Drawing a flag as SVG | `src/flag/render.ts` |
| Simple mode's presets (divisions, overlays, symbols) | `src/flag/simple.ts` |
| The palette, colour names, contrast | `src/flag/colors.ts` |
| The emblem library (Font Awesome icons, grouped) | `src/flag/emblems.ts` |
| Links: encoding, decoding and cleaning what arrives | `src/flag/link.ts` |
| The written description | `src/flag/describe.ts` |
| The design check and the lookalike list | `src/flag/review.ts` |
| Random flags | `src/flag/random.ts` |
| Templates (also the glossary's and sharing image's flags) | `src/flag/templates.ts` |
| The maker: modes, history, link, save, export | `src/ui/Maker.svelte` |
| Simple and advanced controls | `src/ui/SimpleControls.svelte`, `src/ui/AdvancedControls.svelte` |
| The flag on screen: selecting and dragging layers | `src/ui/Stage.svelte` |
| Head tags, bars, header, thanks | `src/layouts/Base.astro` |
| Pages: maker, templates, guide, glossary, 404 | `src/pages/` |
| Site name, address, `?ref=` on outgoing links | `src/lib/site.ts` |
| Tokens and shared styles | `src/styles/app.css`, `src/styles/site.css` |
| Service worker | `src/offline/sw.js` (filled in by `tools/postbuild.mjs`) |
| Security headers | `public/_headers` |
| Icons and the sharing image | `tools/make-images.mjs` (from `src/assets/logo.svg` and the templates) |
| Tests | `tests/` |

## Adding to it

- **A division, overlay or drawn symbol in simple mode:** add a line to the preset list in `src/flag/simple.ts`. Its picture in the tool is drawn from it.
- **An emblem:** import the Font Awesome icon in `src/flag/emblems.ts` and add it to a group.
- **A layer kind:** add it to `overlayTypes` and `overlayDefs` in `model.ts` (its numbers, ranges and defaults become its sliders), draw it in `render.ts`, describe it in `describe.ts`. A test fails until all three agree.
- **A template:** add it to `src/flag/templates.ts`. Keep it clear of real flags; a test checks it passes the design check.
- **A lookalike:** add it to the list in `src/flag/review.ts`, by colour family.

## Local development

Astro 7 needs Node 22.23 or newer.

```bash
npm install
npm run dev      # dev server on http://localhost:4321
npm run check    # Astro and TypeScript checks
npm test         # unit tests (after a build, also checks the built pages against the headers)
npm run build    # static build into dist/, then the CSP hashes and the service worker
npm run preview  # the built site as Cloudflare serves it, headers included, on http://localhost:8787
npm run images   # remake the icons and the sharing image (needs Google Chrome)
```

## Deployment

The site runs as the `eurth-flag` Worker (static assets only) on the Cloudflare account that holds the eurth.org zone. The custom domain in `wrangler.jsonc` owns the `flag.eurth.org` DNS record.

GitHub Actions (`.github/workflows/ci.yml`) checks, builds and tests every push and pull request. Pushes to `main` that pass are deployed to flag.eurth.org.

Deploying needs one repository secret, `CLOUDFLARE_API_TOKEN` (Workers Scripts and Workers Routes, edit), set with `gh secret set CLOUDFLARE_API_TOKEN --repo eurth-org/eurth-flag`. Without it, the deploy step is skipped with a warning. To deploy by hand from a machine logged in with `npx wrangler login`, run `npm run deploy`.

## Releasing

1. In the same commits as the work, update [roadmap.md](roadmap.md): move finished items out of Next, and add or extend the release's dated section.
2. Run `npm run check`, `npm run build` and `npm test`.
3. Bump the version in `package.json`, merge to `main`, and tag it.

## Credits

- Inspired by [Scrontch's Flag Designer](https://scrontch.eu/flags/) by Lars Ruoff and [FlagMaker Jr.](https://andrewsarnold.github.io/FlagMaker-Jr/) by Andrew Arnold. Written from scratch: no code or artwork is taken from either.
- Icons and emblems by [Font Awesome](https://fontawesome.com) Free (CC BY 4.0); sun and moon by [line-md](https://github.com/cyberalien/line-md) (MIT).
- The design check follows the principles in Ted Kaye's *Good Flag, Bad Flag* (NAVA), in its own words.

## Licence

Apache 2.0, see [LICENSE](LICENSE).
