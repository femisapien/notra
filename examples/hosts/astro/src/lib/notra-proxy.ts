import type { APIRoute } from "astro";

// The Notra address from the site's Domains page.
const SITE_ORIGIN = (process.env.NOTRA_SITE_ORIGIN ?? "https://fernhill-astro.notra.site").replace(/\/$/, "");

// Headers that belong to this hop only, or that Notra must not receive.
const DROPPED_REQUEST_HEADERS = [
  "host",
  "connection",
  "keep-alive",
  "transfer-encoding",
  "upgrade",
  "te",
  "trailer",
  "proxy-authorization",
  "proxy-connection",
  "content-length",
  // Your visitors' sessions stay on your domain.
  "cookie",
  "authorization",
];

// fetch() decodes compressed bodies, so these no longer describe the body.
const DROPPED_RESPONSE_HEADERS = ["content-encoding", "content-length", "transfer-encoding", "connection"];

/**
 * Forwards /blog, /changelog and everything below them to Notra with the path
 * unchanged. Follows https://usenotra.com/docs/sites/domains/subpath#what-the-rewrite-has-to-do
 */
export const proxyToNotra: APIRoute = async ({ request, clientAddress }) => {
  const url = new URL(request.url);
  const headers = new Headers(request.headers);
  for (const name of DROPPED_REQUEST_HEADERS) {
    headers.delete(name);
  }
  // Lets site analytics see the visitor, not this server. Overwritten, so
  // visitors can't send their own.
  headers.set("x-forwarded-for", clientAddress);

  const hasBody = request.method !== "GET" && request.method !== "HEAD";
  const upstream = await fetch(`${SITE_ORIGIN}${url.pathname}${url.search}`, {
    method: request.method,
    headers,
    body: hasBody ? await request.arrayBuffer() : undefined,
    // Pass Notra's 307 and 308 redirects to the browser instead of following them.
    redirect: "manual",
  });

  const responseHeaders = new Headers(upstream.headers);
  for (const name of DROPPED_RESPONSE_HEADERS) {
    responseHeaders.delete(name);
  }
  // Keep Notra's own 404 pages instead of Astro's.
  responseHeaders.set("X-Astro-Reroute", "no");

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders,
  });
};
