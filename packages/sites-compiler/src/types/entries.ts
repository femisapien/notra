export interface SiteEntry {
  area: "blog" | "changelog";
  /** URL slug inside the area, e.g. `2026/launch` for `blog/2026/launch.mdx`. */
  slug: string;
  path: string;
  format: "md" | "mdx";
}
