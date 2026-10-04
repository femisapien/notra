/** One page view for Notra's AI traffic ingest; mirrors the `@usenotra/geo` SDK payload. */
export interface TrafficPayload {
  timestamp: string;
  method: string;
  url: string;
  ip?: string;
  geo?: {
    country?: string;
    region?: string;
    city?: string;
    timezone?: string;
    latitude?: string;
    longitude?: string;
  };
  referer?: string;
  userAgent?: string;
  accept?: string;
  acceptLanguage?: string;
  requestId?: string;
  signals: {
    clientHints: boolean;
    fetchMode: string | null;
    tracing: boolean;
  };
}

export interface TrafficReport {
  fetch: (url: string, init: RequestInit) => Promise<Response>;
  ingestUrl: string;
  token: string;
  request: Request;
  /** The page under the site's public origin, also when the request came through a proxy. */
  publicUrl: string;
  /** True when the request reached the alias through the customer's own proxy. */
  proxied: boolean;
}
