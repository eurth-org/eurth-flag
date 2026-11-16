/**
 * A flag as Markdown, for "Copy Markdown" and the .md download: the forum and most wikis take
 * it. The flag's name as a heading (if it has one), the written description, what the design
 * check made of it, and the link that brings the flag back.
 *
 * The name is the one thing a visitor typed, so it is written literally (markdownText) and
 * can't turn into markup. The description and the check are Flagwright's own words.
 */
import { markdownText } from '@eurth/style';
import { describeFlag } from './describe';
import type { Flag } from './model';
import { review } from './review';

export interface MarkdownOptions {
  /** What the flag is called ("Flag of Orioni"), from the name the visitor typed. Without one, no heading. */
  heading?: string;
  /** The link that opens this flag in the maker again. */
  link: string;
  /** The tool's name, for the link's words. */
  site?: string;
}

/** A link's address, safe between the brackets of a Markdown link. */
const address = (link: string): string => link.replace(/[()<>\s]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase().padStart(2, '0')}`);

export function flagMarkdown(flag: Flag, { heading = '', link, site = 'Flagwright' }: MarkdownOptions): string {
  const check = review(flag);
  const name = heading.trim();
  return [
    ...(name ? [`## ${markdownText(name)}`, ''] : []),
    describeFlag(flag),
    '',
    `**Design check:** ${check.score}/10 · ${check.verdict}`,
    '',
    `[Open this flag in ${markdownText(site)}](${address(link)})`,
  ].join('\n');
}
