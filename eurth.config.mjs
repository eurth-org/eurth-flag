// What this tool is called and where it lives. Read at build time only: astro.config.mjs, the
// frontmatter of .astro pages, tests and tools/. Never import this from a Svelte component or a
// <script>: it pulls in the list of every Eurth tool, and browser code must not carry that
// (HANDBOOK.md, Launch). Hand the component what it needs as props instead.
import { defineSite } from '@eurth/style/build';

export const site = defineSite({
  // The subdomain, and the tool's id in @eurth/style's tools.json.
  id: 'flag',
  name: 'Flagwright',
  url: 'https://flag.eurth.org',
  // "<Name>: free online <thing> maker for worldbuilders"
  title: 'Flagwright: free online flag maker for worldbuilders',
  description:
    'A free online flag maker for worldbuilders: design a flag in a few clicks or layer by layer, check it against the principles of good flag design, and download it as SVG or PNG. No account needed.',
  tagline: 'Flags made to fly',
  pages: [
    { href: '/', label: 'Maker' },
    { href: '/templates/', label: 'Templates' },
    { href: '/guide/', label: 'Guide' },
    { href: '/glossary/', label: 'Glossary' },
  ],
  repo: 'https://github.com/eurth-org/eurth-flag',
  ogAlt: 'Flagwright, flags made to fly, at flag.eurth.org: the Eurth yurt beside six flags in the classic layouts.',
  // A halyard taps the pole when a flag is copied or downloaded, once sound is switched on.
  sound: true,
  llms: `## How a flag is kept

- A flag lives in its link: \`?s=1.…\` for a simple flag (readable: division, colours, overlay, symbol, proportions) and \`?f=1.…\` for an advanced one, with \`&n=\` for its name.
- Links made before November 2026 carry the same design after a \`#\` (\`#s=…\`, \`#f=…\`). They still open the same flag.
- The nation profile file (\`<nation>.eurth.json\`) carries the flag's link, written description, SVG, proportions and colours in its \`flag\` section.`,
});
