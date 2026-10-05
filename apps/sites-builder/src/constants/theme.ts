export const GOOGLE_FONTS = "https://fonts.googleapis.com/css2";

/** `layout.width` the theme's own container sizes were designed for. */
export const BASE_LAYOUT_WIDTH_REM = 72;

/**
 * Container widths at the base layout width, in rem. A different `layout.width`
 * scales all of them by the same factor, so the proportions between the index
 * grid, the post page and reading columns stay the same.
 */
export const LAYOUT_CONTAINERS_REM = {
  index: 55,
  post: 80,
  reading: 48,
} as const;
