import { BRAND_ICONS, ICONS } from "../constants/icons";
import type { BrandIconName, IconName, LinkIcon } from "../types/icons";

/** A Lucide name from notra.json; names the theme doesn't ship render no icon. */
export function lucideIcon(name: string | undefined): LinkIcon | undefined {
  if (!(name && Object.hasOwn(ICONS, name))) {
    return undefined;
  }
  return { kind: "lucide", name: name as IconName };
}

/** A platform's brand mark (`github`, `x`, `hacker-news`); `website` and unknown platforms get a globe. */
export function brandIcon(platform: string): LinkIcon {
  const key =
    platform.toLowerCase() === "twitter" ? "x" : platform.toLowerCase();
  if (Object.hasOwn(BRAND_ICONS, key)) {
    return { kind: "brand", name: key as BrandIconName };
  }
  return { kind: "lucide", name: "globe" };
}
