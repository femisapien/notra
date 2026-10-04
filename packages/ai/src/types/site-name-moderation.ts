export interface ModerateSiteNameParams {
  organizationId: string;
  organizationName: string;
  name: string;
  /** The public address, e.g. `acme.notra.site`. */
  address: string;
}

/** `null` when the name is fine or could not be checked. */
export type SiteNameModerationVerdict = "offensive" | "impersonation" | null;
