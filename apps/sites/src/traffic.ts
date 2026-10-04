import {
  TRAFFIC_CONTENT_TYPES,
  TRAFFIC_REPORT_TIMEOUT_MS,
  TRAFFIC_TRACING_HEADERS,
} from "./constants/traffic";
import type { TrafficPayload, TrafficReport } from "./types/traffic";

function header(headers: Headers, name: string): string | undefined {
  return headers.get(name) ?? undefined;
}

/** Pages, Markdown twins and llms.txt; assets and redirects are never AI traffic worth reporting. */
export function isReportableResponse(response: Response): boolean {
  if (response.status >= 300 && response.status < 400) {
    return false;
  }
  const contentType = response.headers.get("content-type") ?? "";
  return TRAFFIC_CONTENT_TYPES.some((type) => contentType.startsWith(type));
}

/**
 * The visitor as the ingest payload describes it. Behind a customer's proxy
 * the connecting IP and Cloudflare's location are the proxy's, so the
 * forwarded headers are the better guess there.
 */
function buildPayload(report: TrafficReport): TrafficPayload {
  const { request, publicUrl, proxied } = report;
  const { headers } = request;
  const cf = (request as { cf?: IncomingRequestCfProperties }).cf;
  const ip = proxied
    ? headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    : header(headers, "cf-connecting-ip");
  const geo = proxied
    ? {
        country:
          header(headers, "x-vercel-ip-country") ??
          header(headers, "cf-ipcountry"),
      }
    : {
        country: cf?.country ?? header(headers, "cf-ipcountry"),
        region: cf?.regionCode,
        city: cf?.city,
        timezone: cf?.timezone,
        latitude: cf?.latitude,
        longitude: cf?.longitude,
      };
  return {
    timestamp: new Date().toISOString(),
    method: request.method,
    url: publicUrl,
    ip: ip || undefined,
    geo,
    referer: header(headers, "referer"),
    userAgent: header(headers, "user-agent"),
    accept: header(headers, "accept"),
    acceptLanguage: header(headers, "accept-language"),
    requestId: header(headers, "cf-ray"),
    signals: {
      clientHints: headers.has("sec-ch-ua"),
      fetchMode: headers.get("sec-fetch-mode"),
      tracing: TRAFFIC_TRACING_HEADERS.some((name) => headers.has(name)),
    },
  };
}

/**
 * Sends one page view to Notra's AI traffic ingest. Ingest decides whether it
 * is AI traffic and drops everything else, the same way the SDK works on a
 * customer's own server. Never throws: tracking must not affect serving.
 */
export async function reportTraffic(report: TrafficReport): Promise<void> {
  try {
    const response = await report.fetch(report.ingestUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${report.token}`,
      },
      body: JSON.stringify(buildPayload(report)),
      signal: AbortSignal.timeout(TRAFFIC_REPORT_TIMEOUT_MS),
    });
    await response.body?.cancel();
    // 401: the site has no project to attribute traffic to (or is gone).
    if (!response.ok && response.status !== 401) {
      console.warn("sites.traffic_rejected", { status: response.status });
    }
  } catch (error) {
    console.warn("sites.traffic_failed", { error: String(error) });
  }
}
