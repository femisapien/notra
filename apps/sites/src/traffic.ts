import {
  TRAFFIC_CONTENT_TYPES,
  TRAFFIC_REPORT_TIMEOUT_MS,
  TRAFFIC_TRACING_HEADERS,
} from "./constants/traffic";
import type { TrafficPayload, TrafficReport } from "./types/traffic";

function header(headers: Headers, name: string): string | undefined {
  return headers.get(name) ?? undefined;
}

/** Speculation rules and link prefetch say so; ingest then skips the view. */
function isPrefetch(headers: Headers): boolean {
  const purpose = `${headers.get("sec-purpose") ?? ""} ${headers.get("purpose") ?? ""}`;
  return purpose.toLowerCase().includes("prefetch");
}

/** Pages, Markdown twins and llms.txt; assets and redirects are never AI traffic worth reporting. */
function isReportableResponse(response: Response): boolean {
  if (response.status >= 300 && response.status < 400) {
    return false;
  }
  const contentType = response.headers.get("content-type") ?? "";
  return TRAFFIC_CONTENT_TYPES.some((type) => contentType.startsWith(type));
}

/**
 * The dashboard shows the live site in a frame; that is the owner, not a
 * visitor. The frame's first load names the dashboard as referer, clicks
 * inside it name the site itself while still loading into a frame.
 */
function isDashboardPreview(request: Request, dashboardUrl: string): boolean {
  const referer = request.headers.get("referer");
  if (!referer) {
    return false;
  }
  try {
    const from = new URL(referer);
    if (from.origin === new URL(dashboardUrl).origin) {
      return true;
    }
    return (
      request.headers.get("sec-fetch-dest") === "iframe" &&
      from.host === new URL(request.url).host
    );
  } catch {
    return false;
  }
}

/** A visitor's GET of a page, never the dashboard's own preview frame. */
export function isReportablePageView(
  request: Request,
  response: Response,
  dashboardUrl: string
): boolean {
  return (
    request.method === "GET" &&
    isReportableResponse(response) &&
    !isDashboardPreview(request, dashboardUrl)
  );
}

/**
 * A click between two pages of the site, made on the alias host, names the
 * alias as referer; reported under the public origin it must stay internal,
 * or every page of the visit would look like a new arrival.
 */
function publicReferer(
  request: Request,
  publicUrl: string
): string | undefined {
  const referer = request.headers.get("referer") ?? undefined;
  if (!referer) {
    return undefined;
  }
  try {
    const from = new URL(referer);
    if (from.host !== new URL(request.url).host) {
      return referer;
    }
    return new URL(`${from.pathname}${from.search}`, publicUrl).href;
  } catch {
    return referer;
  }
}

/**
 * The visitor as the ingest payload describes it. Behind a customer's proxy
 * the connecting IP and Cloudflare's location are the proxy's, so the
 * forwarded headers are the better guess there.
 */
function buildPayload(report: TrafficReport): TrafficPayload {
  const { request, publicUrl, proxied, status } = report;
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
    referer: publicReferer(request, publicUrl),
    userAgent: header(headers, "user-agent"),
    accept: header(headers, "accept"),
    acceptLanguage: header(headers, "accept-language"),
    requestId: header(headers, "cf-ray"),
    status,
    signals: {
      clientHints: headers.has("sec-ch-ua"),
      fetchMode: headers.get("sec-fetch-mode"),
      tracing: TRAFFIC_TRACING_HEADERS.some((name) => headers.has(name)),
      prefetch: isPrefetch(headers),
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
