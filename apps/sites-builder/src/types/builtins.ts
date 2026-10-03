import type { IconName } from "./icons";

export type CalloutVariant =
  | "note"
  | "tip"
  | "info"
  | "warning"
  | "check"
  | "danger";

export interface CalloutTone {
  icon: IconName;
  tone: string;
  label: string;
}
