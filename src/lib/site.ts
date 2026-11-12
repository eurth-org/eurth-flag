/** What the site is called and where it lives; used by the layout, the pages and the tools. */
export const site = {
  name: 'Flagwright',
  tagline: 'Flags made to fly',
  host: 'flag.eurth.org',
  url: 'https://flag.eurth.org',
  repo: 'https://github.com/eurth-org/eurth-flag',
  description:
    'A free online flag maker for worldbuilders and vexillology nerds. Design a flag in a few clicks or layer by layer, check it against the principles of good flag design, and download it as SVG or PNG. No account needed.',
};

/**
 * Links to other websites carry ?ref=flag.eurth.org, so the sites we link to can see where their
 * visitors came from.
 */
export function ref(href: string): string {
  try {
    const url = new URL(href);
    if (url.hostname === site.host || url.protocol !== 'https:') return href;
    url.searchParams.set('ref', site.host);
    return url.toString();
  } catch {
    return href;
  }
}

/** A Wikipedia article's address, from its title. */
export const wikipedia = (title: string): string => ref(`https://en.wikipedia.org/wiki/${encodeURIComponent(title.replaceAll(' ', '_'))}`);
