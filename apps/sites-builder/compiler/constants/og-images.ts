/** Share image size every platform crops well (Open Graph, X large card, LinkedIn). */
export const OG_IMAGE_WIDTH = 1200;
export const OG_IMAGE_HEIGHT = 630;

/** Below the public dir, so each area serves them at `<mount>/_notra/og/<area>/<slug>.png`. */
export const OG_IMAGES_DIR = "_notra/og";

/**
 * Inter, bundled with the toolchain because builds run without network.
 * Satori reads woff but not woff2. Several subsets so non-English titles
 * still have glyphs. Each subset is registered as its own family (satori
 * merges fonts of one name by weight) and listed in the CSS font stack, which
 * satori walks per character.
 */
export const OG_FONT_SUBSETS = [
  "latin",
  "latin-ext",
  "cyrillic",
  "greek",
] as const;
export const OG_FONT_WEIGHTS = [500, 700] as const;

export const OG_FONT_FAMILY = OG_FONT_SUBSETS.map(
  (subset) => `"Inter ${subset}"`
).join(", ");

/** Repository images satori can decode, by extension. */
export const OG_BACKGROUND_MIME_TYPES: Readonly<Record<string, string>> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
};

export const OG_THEME = {
  light: { background: "#ffffff", text: "#0a0a0a", muted: "#6b7280" },
  dark: { background: "#0a0a0a", text: "#fafafa", muted: "#a1a1aa" },
} as const;

/** Title size steps: long titles shrink so three lines still fit. */
export const OG_TITLE_SIZES = [
  { maxLength: 40, size: 72 },
  { maxLength: 70, size: 60 },
  { maxLength: Number.POSITIVE_INFINITY, size: 50 },
] as const;
