import type { KeyObject } from "node:crypto";

import type { Site } from "./sites";

export interface DomainConnectConfig {
  providerId: string;
  serviceId: string;
  keyHost: string;
  privateKey: KeyObject;
}

export interface DomainConnectSettings {
  providerId: string;
  providerName: string;
  providerDisplayName?: string;
  urlSyncUX?: string;
  urlAPI: string;
  /** Zone the provider hosts (`acme.com`). */
  domain: string;
  /** Label(s) below the zone (`blog`); never empty, a CNAME cannot sit at the apex. */
  host: string;
}

export type DomainConnectResult =
  | {
      status: "unavailable";
      reason:
        | "not_configured"
        | "not_subdomain"
        | "already_active"
        | "missing_records"
        | "target_mismatch";
    }
  | { status: "unsupported"; providerName?: string }
  | { status: "ready"; providerName: string; applyUrl: string };

export interface DomainConnectCallbackClaims {
  siteId: string;
  domainId: string;
  exp: number;
}

export interface DomainConnectDeps {
  resolveTxt: (name: string) => Promise<string[][]>;
  fetch: typeof fetch;
}

export interface DomainConnectJsonResponse {
  status: number;
  body: unknown;
}

export interface BuildApplyUrlParams {
  settings: Pick<DomainConnectSettings, "urlSyncUX">;
  config: DomainConnectConfig;
  domain: string;
  host: string;
  variables: Record<string, string>;
  redirectUri?: string;
  state?: string;
}

export interface DomainConnectForDomainParams {
  site: Pick<Site, "id">;
  domainId: string;
  deps?: DomainConnectDeps;
}
