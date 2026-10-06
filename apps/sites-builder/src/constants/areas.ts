import type { SiteArea } from "@notra/sites-core/types/deployment";

/** Every area in display order; mirrors SITE_AREAS, which the theme can't import at runtime. */
export const THEME_AREAS = [
  "blog",
  "changelog",
] as const satisfies readonly SiteArea[];

/** Area titles when notra.json sets none; also the labels of the section switcher. */
export const AREA_DEFAULT_TITLES: Record<SiteArea, string> = {
  blog: "Blog",
  changelog: "Changelog",
};
