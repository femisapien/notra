export interface SitePreviewTokenClaims {
  siteId: string;
  /** `null` grants every preview of the site. */
  previewKey: string | null;
  /** Unix seconds. */
  exp: number;
  /**
   * `member` for dashboard sessions, `share` for share links, `password` for
   * visitors who entered the site's preview password.
   */
  kind: "member" | "share" | "password";
  /** Member sessions: the member. Share links: the member who created it. */
  userId?: string;
  /** Unix ms; compared with the site's revocations. */
  issuedAt?: number;
  /** Password sessions only: the `version` of the password they were opened with. */
  passwordVersion?: string;
}

/** A correctly signed token, also when it has expired (expired member sessions can be renewed). */
export interface ReadSitePreviewToken {
  claims: SitePreviewTokenClaims;
  expired: boolean;
}

export type PreviewRevocationScope = "signed_out" | "access_lost";
