/**
 * The flag in the nation's profile file (<nation>.eurth.json), which carries a nation from one
 * Eurth tool to the next. Flagwright owns the `flag` section and nothing else: every other
 * section, known or not, comes out exactly as it went in.
 */
import { createProfile, getSection, setSection, type EurthProfile } from '@eurth/profile';
import { cleanColor } from './colors';
import { fromLink, type Shared } from './link';

/** The profile's own limits (its schema): a link of 4,000 characters, a summary of 600, 20 colours. */
export const MAX_LINK = 4000;
export const MAX_SUMMARY = 600;
export const MAX_COLOURS = 20;

export interface FlagForProfile {
  /** The share link, which brings the whole design back. Https, or the profile turns it away. */
  link: string;
  /** The written description. */
  summary: string;
  svg: string;
  /** Height to width. */
  ratio: [number, number];
  /** Most used first. */
  colours: string[];
}

/** Whether a flag's link fits in a profile. A flag of many layers can outgrow it; its picture still goes in. */
export const linkFits = (link: string): boolean => link.length <= MAX_LINK;

const clip = (text: string, max: number): string => (text.length <= max ? text : `${text.slice(0, max - 1).trimEnd()}…`);

/**
 * The profile with this flag in its `flag` section. Without a profile, a new one is started,
 * which sets the nation's name and nothing else. A loaded profile keeps its name and everything
 * in it; fields a newer Flagwright may have added to the section are kept too.
 */
export function withFlag(profile: EurthProfile | null, nation: string, flag: FlagForProfile): EurthProfile {
  const base = profile ?? createProfile(nation);
  // The old link drew the old flag: it goes, even if the new one is too long to take its place.
  const { link: _link, ...kept } = (getSection(base, 'flag') ?? {}) as Record<string, unknown>;
  return setSection(base, 'flag', {
    ...kept,
    ...(linkFits(flag.link) ? { link: flag.link } : {}),
    summary: clip(flag.summary, MAX_SUMMARY),
    svg: flag.svg,
    ratio: `${flag.ratio[0]}:${flag.ratio[1]}`,
    colours: flag.colours.slice(0, MAX_COLOURS).map((colour) => cleanColor(colour)),
  });
}

/**
 * The flag a profile brings, if its link is a Flagwright link (`origins`: the addresses that
 * count as Flagwright). Links made before November 2026, with the design after the #, count too.
 * The link is someone else's input like any other: it is read and cleaned the same way.
 */
export function flagFromProfile(profile: EurthProfile | null, origins: readonly string[]): Shared | null {
  return fromLink(getSection(profile, 'flag')?.link, origins);
}
