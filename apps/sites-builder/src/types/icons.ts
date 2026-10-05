import type { BRAND_ICONS, ICONS } from "../constants/icons";

export type IconName = keyof typeof ICONS;
export type BrandIconName = keyof typeof BRAND_ICONS;

/** An icon next to a link: a Lucide outline or a filled brand mark. */
export type LinkIcon =
  | { kind: "lucide"; name: IconName }
  | { kind: "brand"; name: BrandIconName };
