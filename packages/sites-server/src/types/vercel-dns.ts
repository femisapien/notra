import type { SiteDomainVerificationRecord } from "@notra/db/types/sites";

export interface VercelDnsConfig {
  /** URL slug of the Notra integration: vercel.com/integrations/{slug}. */
  slug: string;
  clientId: string;
  clientSecret: string;
}

export interface VercelDnsDeps {
  resolveNs: (name: string) => Promise<string[]>;
  fetch: typeof fetch;
}

/** What one install of the integration grants: a token for one team (or personal account). */
export interface VercelDnsGrant {
  accessToken: string;
  teamId: string | null;
  configurationId: string;
}

export interface ApplyVercelDnsRecordsParams {
  grant: VercelDnsGrant;
  /** The Vercel-hosted zone (`acme.com`) the records go into. */
  zone: string;
  records: SiteDomainVerificationRecord[];
  deps?: Pick<VercelDnsDeps, "fetch">;
}

/** POST /v2/oauth/access_token, as far as the setup reads it. */
export interface VercelTokenResponse {
  access_token?: string;
  team_id?: string | null;
  installation_id?: string;
}
