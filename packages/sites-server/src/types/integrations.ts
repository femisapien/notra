import type { SITE_INTEGRATION_NAMES } from "@notra/sites-core/constants/integrations";

export type SiteIntegrationName = (typeof SITE_INTEGRATION_NAMES)[number];

export interface SiteIntegrationsState {
  /** The `integrations` block as written in notra.json (draft first), unvalidated. */
  integrations: Record<string, unknown>;
  /** notra.json has unpublished edits. */
  hasDraft: boolean;
  /** notra.json isn't valid JSON, so the tab can't edit it. */
  invalid: boolean;
}

export interface SaveSiteIntegrationsInput {
  provider: SiteIntegrationName;
  /** The provider's settings; null removes it. */
  settings: Record<string, unknown> | null;
  userId: string;
}
