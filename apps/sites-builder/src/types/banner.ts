export interface ResolvedBanner {
  html: string;
  dismissible: boolean;
  storageKey: string;
  light: string;
  dark: string;
  /** `info` follows the brand color, whose readable text color may be dark. */
  foreground: string;
}
