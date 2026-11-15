# Building Flagwright

Flagwright is the flag maker at flag.eurth.org, one of Eurth's worldbuilding tools. It is live: `main` deploys. The standing instructions:

- Read `node_modules/@eurth/style/HANDBOOK.md` first. On anything the tools share (stack, look, shell, privacy, accessibility, search, sharing, offline, delight, launch, writing), the handbook wins over any brief; say so if they disagree.
- The shell comes from `@eurth/style` and is never rebuilt here. Use only its tokens and `eu-` classes: no local colours, fonts or spacing in the interface. The flag palette and the emblems are the tool's data, and stay.
- Nothing is stored: no cookies, localStorage, sessionStorage or IndexedDB. A flag lives in its link (query string, versioned: `?s=1.…`, `?f=1.…`) and in the nation's profile file.
- Links are forever. Old `#s=` and `#f=` links are all over the forum and must keep opening the same flag; when the shape of a link changes, raise its version and keep reading the old ones. `tests/flag.test.ts` holds real old links.
- Flagwright owns the `flag` section of the profile file (`link`, `summary`, `svg`, `ratio`, `colours`) and leaves every other section exactly as it was.
- `eurth.config.mjs` and `@eurth/style/build` are for build time only; never import them from browser code.
- Found a bug or a gap in the shell? Don't patch around it here: it is fixed in `@eurth/style`, and every tool has it by morning.
- A feature goes into `roadmap.md` in the same commit that adds it; a point from a review goes into `docs/feedback-log.md`.
- Done means: every handbook rule met, `npm run check`, `build`, `test`, `axe` and `smoke` passing, README and roadmap up to date.
- Ask Stijn before spending money, adding a Worker script or any Cloudflare product beyond static assets, or changing another repository.
