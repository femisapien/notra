import { ICONS } from "../constants/icons";
import type { IconName } from "../types/icons";

export function socialIcon(name: string): IconName {
  const key = name.toLowerCase();
  if (key === "twitter" || key === "x") {
    return "x";
  }
  if (key in ICONS) {
    return key as IconName;
  }
  return "globe";
}
