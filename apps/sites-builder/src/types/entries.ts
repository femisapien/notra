import type { CollectionEntry } from "astro:content";

export type BlogEntry = CollectionEntry<"blog">;
export type ChangelogEntry = CollectionEntry<"changelog">;

/** Any collection entry with a publish date, for sorting. */
export interface DatedEntry {
  data: { date: Date };
}

/** What Astro's glob loader passes to `generateId`. */
export interface EntryIdOptions {
  entry: string;
}
