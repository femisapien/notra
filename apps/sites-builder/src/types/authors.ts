/** A byline as the theme renders it: a known notra.json author or a plain name. */
export interface ResolvedAuthor {
  /** notra.json id; null for a name that isn't in `authors`. */
  id: string | null;
  name: string;
  title?: string;
  bio?: string;
  /** Image URL ready for `src`. */
  avatar?: string;
  /** The author's page on this site, for known authors. */
  href?: string;
  /** Profiles that identify the person (`sameAs`). */
  links: string[];
  /** Personal site or first profile, for `url` in structured data. */
  url?: string;
}
