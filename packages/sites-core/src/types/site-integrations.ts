import type {
  siteIntegrationsSchema,
  siteSecuritySchema,
} from "@notra/sites-core/schemas/site-integrations";
import type { z } from "zod";

export type SiteIntegrations = z.infer<typeof siteIntegrationsSchema>;
export type SiteSecurity = z.infer<typeof siteSecuritySchema>;

/**
 * A `<script>` the theme renders in `<head>`. Inline code is final JavaScript:
 * any configured value in it is already JSON-encoded.
 */
export type SiteHeadScript =
  | { kind: "external"; src: string; attributes: Record<string, string | true> }
  | { kind: "inline"; code: string };

/** Origins one integration needs, per CSP directive. */
export interface SiteCspSources {
  scriptSrc: string[];
  connectSrc: string[];
}

export interface SiteContentSecurityPolicyParams {
  integrations: SiteIntegrations;
  security: SiteSecurity;
  /** Base64 SHA-256 of every inline script in the built HTML. */
  scriptHashes: Iterable<string>;
}
