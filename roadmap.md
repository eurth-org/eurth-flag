# Roadmap

Flagwright is a flag maker for worldbuilders and vexillology nerds, at flag.eurth.org: quick enough to make a flag in a minute (Simple mode), deep enough to place every layer by hand (Advanced mode), and opinionated enough to tell you when a star can't be seen. It is for anyone, with Eurth in the background as the community that makes it, and it wears the shell every Eurth tool shares.

Three parts: what comes next, what each release added (newest first), and what's not planned. Points from reviews are in the [feedback log](docs/feedback-log.md).

## Next

- **Automatic deploys:** check that the organisation's `CLOUDFLARE_API_TOKEN` secret reaches this repository; without it the deploy step is skipped with a warning, and releases are deployed by hand with `npm run deploy`.
- **Launch:** submit the sitemap in Search Console, add Flagwright to status.eurth.org and Eurth's Worldbuilding Tools docs, and announce it on the forum and Discord.
- **Heraldic charges drawn for Flagwright:** lion, eagle, fleur-de-lis, sword, trident, laurel wreath, hammer and sickle. Font Awesome has none of them, and flags want them.
- **Outlines (fimbriation) as a setting** on any layer, instead of laying a thicker copy beneath.
- **Your own emblem:** upload an SVG or PNG as a layer (held for the visit only, embedded in the download).
- **More fields:** diagonal stripes, wavy and serrated dividing lines (Qatar, Bahrain), a chevron.
- **Rows and grids of stars**, for cantons in the American manner.
- **Wiki-ready output:** an IIWiki infobox snippet and a symbolism section to fill in.
- **A waving preview**, and the flag on a pole, a ship and a map pin.
- **Eurth's own flags** as examples, once their nations agree.
- **A count of flags hoisted**, as Governmint counts countries.
- **Shareable link previews per flag** (a Worker would draw the image; the design is in the query string so that one can read it).
- **Sharing sizes with the nation's name** set under the flag, and a choice of ground (Night, light or see-through).
- **Read more from the profile file:** offer the nation's colours from its other sections as a starting palette.
- **Lighthouse on the new shell:** CI holds it at 100; watch the first runs on `main`.

## 15 November 2026: the shared shell (0.2.0)

Flagwright moves onto `@eurth/style`, the shell every Eurth tool shares, and `@eurth/profile`, the file that carries a nation between them.

- **The suite's header and footer:** the yurt and "Flagwright by Eurth", the pages (Maker, Templates, Guide, Glossary), the Tools menu, the Deluminator and the Join Eurth pill; in the footer the rest of Eurth, the promises, the credits, and this visit's switches for sound and motion. The "Preview" badge and the GitHub link in the navigation are gone.
- **The suite's look:** only `@eurth/style`'s tokens and `eu-` classes; text at WCAG AAA contrast in both themes; everything pressable at least 44 by 44 pixels. Colours are now picked from a palette that opens under a button, and a chosen option carries a tick as well as its colour.
- **Nothing stored.** No localStorage: the theme lasts for the visit, and "Saved on this device" is gone. A flag is saved by copying its link, downloading it, or saving the profile file.
- **The nation profile file:** "Load profile" and "Save profile". Flagwright writes the `flag` section (link, written description, SVG, proportions, colours) and leaves every other section exactly as it was; a loaded profile's Flagwright link opens that flag.
- **A flag lives in its link's query string, with a version:** `?s=1.…` for simple flags (still readable), `?f=1.…` for advanced ones, `&n=` for the name. Links from before, with the design after the `#` (`#s=…`, `#f=…`), open the same flag and the address is rewritten to the new form.
- **The suite's share row and dialog:** Copy link (a paper plane flies off), Copy picture, Copy description, and Share: the Eurth forum first, then Reddit, Bluesky, X, Facebook, LinkedIn, Tumblr, WhatsApp, Telegram, Email and the device's share sheet.
- **Pictures in the suite's sizes:** besides the flag alone at up to 3840 pixels wide, the flag on a Night ground as link preview, square, portrait, story, pin and wide, as SVG, PNG or WebP.
- **Delight:** the flag catches the wind for a moment when it is copied or downloaded, and with sound switched on a halyard taps the pole; "Nice." when a slider settles on 69; a plain white flag has its surrender accepted. The suite's own (the Konami emu, the seasonal yurt, the beating hearts) come with the shell.
- **For search engines:** the start page's title in the suite's pattern, a description of its own on every page, structured data from the suite's builders (WebApplication, FAQPage, BreadcrumbList, Article, DefinedTermSet), `llms.txt`, and sources with a last-updated date on the guide. The hand-written HowTo and CollectionPage data went: the suite has no builder for them.
- **Offline and install:** the suite's service worker, web manifest, Install button and offline note.
- **The kit:** `eurth(site)` in `astro.config.mjs` writes the security headers, the service worker, the manifest, `robots.txt` and `llms.txt`; `standardSuites` replaces Flagwright's own contrast and header tests; `npm run axe` (WCAG 2.2 A, AA and AAA rules, both themes) and `npm run smoke` (real Chrome under the real headers); CI and a nightly rebuild from the suite's reusable workflows; no workers.dev address.

## 12 November 2026: preview (0.1.0)

The first version.

- **Simple mode:** four choices. 22 divisions (plain, bicolours, tricolours, tribands, stripes, quarters, diagonals, per saltire, rays), 16 overlays (cross, Nordic cross, saltire, border, canton, hoist triangle, bars, bends, pall, disc, lozenge), 10 drawn symbols and 137 emblems in eight groups, with search; colour, place and size for each; nine common proportions.
- **Advanced mode:** any proportions; a field of up to 24 bands with their own widths, or a grid, a diagonal, per saltire or rays; up to 60 layers of 19 kinds, each with its own numbers. Click a layer on the flag to select it, drag it, nudge it with the arrow keys, restack, duplicate, hide or delete it. Guides and snapping.
- Advanced starts from the simple design and then keeps its own; "Start from simple" replaces it.
- **Random:** flags from colour schemes real flags use, with symbols picked to stand out from what they lie on.
- **Design check:** a score out of ten and findings against the principles of flag design: number of colours, simplicity, contrast of every layer against what lies under it (the rule of tincture), charges too small to see, and lookalikes of some 30 real flags. The flag at three small sizes.
- **A written description** of every flag ("A horizontal tricolour of red, white and blue, with a gold five-pointed star in the centre"), inside the downloaded file and as its alternative text.
- **Download and share:** SVG, PNG and WebP up to 3840 pixels wide, copy the picture, the description or the link. The link holds the whole flag; nothing is stored on a server.
- Undo and redo, and flags saved on the device (until 0.2.0).
- **Pages for search engines and newcomers:** the maker with how-to and questions, 18 templates, a guide to the five principles with good and bad examples, and a glossary of 36 flag terms with pictures. Structured data on each (WebApplication, HowTo, FAQPage, Article, DefinedTermSet, BreadcrumbList), a sitemap, canonical addresses, and link previews with a sharing image.
- **The look of gov.eurth.org:** Eurth blue bars, the Deluminator switch (light, dark, auto), Font Awesome icons, panels and pills, and a logo: the Eurth yurt on a flag.
- **Live** at flag.eurth.org since 12 November 2026, from the public repository eurth-org/eurth-flag.
- **The kit:** an Astro static site with the tool as a Svelte island, on Cloudflare Workers static assets; a strict Content-Security-Policy with script hashes written by the build and checked by a test; a service worker for offline use; a web app manifest and icons; tests for the engine, links, design check, colour contrast and headers.

## Not planned

- **Lettering.** Text can't be read on moving cloth and reads backwards on the other side; the design guide says so, and the tool agrees. (Mottos belong on coats of arms.)
- **Saved flags in the browser: nothing is stored.** No cookies, localStorage, sessionStorage or IndexedDB, in any Eurth tool. A flag is saved as its link, a picture or the nation's profile file.
- **Accounts and a public gallery.** A flag lives in its link. A gallery needs moderation, storage and sign-ins; Eurth's forum and wiki are where flags are shown.
- **Real countries' flags as templates.** Templates are layouts in colours of their own. Plenty of sites offer real flags; this one is for making new ones.
- **AI-generated flags or emblems.** Every shape is drawn by code or by a person.
- **Trackers and analytics.**
