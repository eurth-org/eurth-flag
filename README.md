# Flagwright

> A friendly note: Flagwright is live, and it shares its shell with the rest of Eurth's worldbuilding tools, which arrive through Eurth's advent calendar from 10 December 2026. Please don't spoil the surprise before those doors open.

Flags made to fly. Flagwright is a free online flag maker for worldbuilders, writers, roleplayers and vexillology nerds: make a flag in four choices or layer by layer, have it checked against the principles of good flag design, and take it with you as a link, a picture or a profile file. Made by [Eurth](https://eurth.org), a worldbuilding and roleplay community since 2004.

Live page: https://flag.eurth.org

Flagwright keeps its own design, exactly as it was perfected before the shared shell: the suite provides the header and the footer, and everything between them looks and works as it always has. See [CLAUDE.md](CLAUDE.md).

The rules every Eurth tool follows are in the handbook, [`node_modules/@eurth/style/HANDBOOK.md`](https://style.eurth.org/handbook/). On everything else the tools share, the handbook wins. What's planned, what each release added and what's not planned is in the [roadmap](roadmap.md); points from reviews are in the [feedback log](docs/feedback-log.md).

## Use

Open the maker and pick a division, an overlay, a symbol and their colours (Simple), or switch to Advanced and place every band and layer by hand. **Random** rolls a flag to start from; once you have changed a flag it turns red when pointed at, and it asks once before it replaces one. The design check reads the flag the way a vexillologist would. Then:

- **Save** or **Copy link.** The link holds the whole flag: `?s=1.…` for a simple flag, `?f=1.…` for an advanced one, `&n=` for its name. Copying the link is saving the flag, so that is what Save does.
- **Download** it as SVG, PNG or WebP: the flag alone at up to 3840 pixels wide, or on a Night ground in the sizes social sites like (link preview, square, portrait, story, pin, wide).
- **Copy picture** or **Copy description**, or **Share** it to the Eurth forum and ten other places.
- **Copy Markdown**, or download it as a `.md` file, for the forum and wikis: the flag's name, its written description, the design check's score and its link.
- **Save profile** puts the flag into your nation's profile file (`<nation>.eurth.json`), which the other Eurth tools read; **Load profile** brings a nation back, flag and all.

Nothing is stored in the browser: no cookies, no localStorage, no account. Links made before November 2026 kept the design after a `#` (`#s=…`, `#f=…`); they still open the same flag, and the address is then rewritten to today's form.

## How it works

- A static site built with Astro; the maker is a Svelte component that wakes up in the browser. There is no server-side code.
- The shell (header, footer, theme switch, share dialog, toasts, offline note, service worker, security headers, web manifest, `robots.txt`, `llms.txt`) comes from [`@eurth/style`](https://style.eurth.org), and the profile file from `@eurth/profile`. Both are installed from GitHub and built into the site; nothing is loaded at run time from another address.
- The engine in `src/flag/` is plain TypeScript with no browser or framework in it: a flag is data, and one function draws it as SVG text. The editor, the downloads, the template pages (at build time), the sharing image and the tests all use that one function.
- Between the suite's header and footer the tool wears its own design. Every page is `src/layouts/Base.astro`, which wraps the page in `.fw`; Flagwright's tokens and styles (`src/styles/app.css`, `src/styles/site.css` and each component) apply inside that wrapper only, and the suite's base styles are undone there, so neither stylesheet reaches into the other's part of the page. The suite's own windows (the share dialog, Random's question) keep the suite's look.
- It is held to WCAG 2.2 AA with 24px targets (`"eurth"` in `package.json`), not the suite's AAA and 44px: an exception on Stijn's word, 16 November 2026.

## Where things live

| What | Where |
| --- | --- |
| The tool's name, address, title and pages (build time only) | `eurth.config.mjs` |
| The flag model: divisions, layer kinds and their numbers | `src/flag/model.ts` |
| Drawing a flag as SVG | `src/flag/render.ts` |
| A flag in the suite's sharing sizes | `src/flag/picture.ts` |
| Simple mode's presets (divisions, overlays, symbols) | `src/flag/simple.ts` |
| The palette, colour names, contrast | `src/flag/colors.ts` |
| The emblem library (Font Awesome icons, grouped) | `src/flag/emblems.ts` |
| Links: today's query string, the old `#` form, and cleaning what arrives | `src/flag/link.ts` |
| The flag section of the nation profile | `src/flag/profile.ts` |
| The written description | `src/flag/describe.ts` |
| The flag as Markdown | `src/flag/markdown.ts` |
| The design check and the lookalike list | `src/flag/review.ts` |
| Random flags | `src/flag/random.ts` |
| Templates (also the glossary's and sharing image's flags) | `src/flag/templates.ts` |
| The maker: modes, history, link, share, downloads, profile | `src/ui/Maker.svelte` |
| Simple and advanced controls | `src/ui/SimpleControls.svelte`, `src/ui/AdvancedControls.svelte` |
| The flag on screen: selecting and dragging layers | `src/ui/Stage.svelte` |
| The page around every page: the suite's shell, the `.fw` wrapper, the flag and the Preview badge | `src/layouts/Base.astro` |
| Flagwright's own tokens, buttons, pills, sliders and tooltips, scoped to `.fw` | `src/styles/app.css` |
| Its panels, flags on a page and written pages, scoped to `.fw` | `src/styles/site.css` |
| Pages: maker, templates, guide, glossary, 404 | `src/pages/` |
| The footer's credits | `src/components/Credits.astro` |
| Icons and the sharing image | `tools/make-images.mjs` (from `src/assets/logo.svg` and the templates) |
| The checks every tool runs; Flagwright's own | `tests/shell.test.js`; `tests/flag.test.ts`, `tests/contrast.test.ts` |
| The moment the door opened | `LAUNCH_AT` |

## Adding to it

- **A division, overlay or drawn symbol in simple mode:** add a line to the preset list in `src/flag/simple.ts`. Its picture in the tool is drawn from it. Its id becomes part of links, so never rename or remove one.
- **An emblem:** import the Font Awesome icon in `src/flag/emblems.ts` and add it to a group.
- **A layer kind:** add it to `overlayTypes` and `overlayDefs` in `model.ts` (its numbers, ranges and defaults become its sliders), draw it in `render.ts`, describe it in `describe.ts`. A test fails until all three agree.
- **A template:** add it to `src/flag/templates.ts`. Keep it clear of real flags; a test checks it passes the design check.
- **A lookalike:** add it to the list in `src/flag/review.ts`, by colour family.
- **A change to what a link holds:** raise `LINK_VERSION` in `src/flag/link.ts`, keep reading every older version, and add a real old link to `tests/flag.test.ts`. A link made today must open next year.

## Development

Node 22 or later.

```sh
npm install          # then commit package-lock.json
npm run dev          # the site while you work
npm run check        # types
npm run build        # the static site, into dist/
npm test             # the tool's own tests and the suite's checks (they read dist/)
npm run axe          # accessibility: every page, both themes, at WCAG 2.2 AA
npm run smoke        # the built site in real Chrome: theme, nothing stored, offline
npm run preview      # the built site with its real headers (wrangler dev)
npm run images       # icons and the sharing image, after changing them (needs Google Chrome)
```

## Deployment

The site runs as the `eurth-flag` Worker (static assets only) on the Cloudflare account that holds the eurth.org zone. The custom domain in `wrangler.jsonc` owns the `flag.eurth.org` DNS record; there is no workers.dev address.

GitHub Actions checks, builds and tests every push and pull request, and deploys every push to `main` that passes (`.github/workflows/ci.yml`). A nightly run updates `@eurth/style` and `@eurth/profile` within version 1, rebuilds, tests, and deploys if anything changed (`nightly.yml`): that is how the Tools menu gains each newly launched tool. Both are thin callers of the workflows in `eurth-org/eurth-style`. Deploying uses the organisation secret `CLOUDFLARE_API_TOKEN`; without it, the deploy step is skipped with a warning.

## Releasing

1. In the same commits as the work, update [roadmap.md](roadmap.md): move finished items out of Next, and add or extend the release's dated section. Points from a review go into [docs/feedback-log.md](docs/feedback-log.md).
2. Run `npm run check`, `npm run build`, `npm test`, `npm run axe` and `npm run smoke`.
3. Bump the version in `package.json`, merge to `main`, and tag it.

## Credits

- Inspired by [Scrontch's Flag Designer](https://scrontch.eu/flags/) by Lars Ruoff and [FlagMaker Jr.](https://andrewsarnold.github.io/FlagMaker-Jr/) by Andrew Arnold. Written from scratch: no code or artwork is taken from either.
- Icons and emblems by [Font Awesome](https://fontawesome.com) Free (CC BY 4.0); the icons that draw themselves in the header and footer by line-md (MIT).
- The design check follows the principles in Ted Kaye's *Good Flag, Bad Flag* (NAVA), in its own words.

## Licence

Apache 2.0, see [LICENSE](LICENSE).
