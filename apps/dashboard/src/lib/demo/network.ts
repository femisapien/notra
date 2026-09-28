import { DEMO_SITEMAPS, DEMO_SITEMAP_PAGES } from "@/constants/demo/brand";
import { DEMO_SESSION } from "@/constants/demo/workspace";

/** Installed before the real dashboard mounts. Only demo navigation can reach the server. */
export function installDemoNetworkBoundary() {
  const originalFetch = window.fetch;
  window.fetch = async (input, init) => {
    const request = new Request(input, init);
    const url = new URL(request.url, window.location.origin);
    if (
      url.origin === window.location.origin &&
      url.pathname === "/api/session" &&
      request.method === "GET"
    ) {
      return Response.json(DEMO_SESSION);
    }
    if (
      url.origin === window.location.origin &&
      request.method === "GET" &&
      url.pathname === "/api/organizations/public-demo-neon/chat/sessions"
    ) {
      return Response.json({ sessions: [] });
    }
    if (
      url.origin === window.location.origin &&
      request.method === "GET" &&
      url.pathname ===
        "/api/organizations/public-demo-neon/brand-identities/demo-neon-brand/sitemaps"
    ) {
      return Response.json(DEMO_SITEMAPS);
    }
    if (
      url.origin === window.location.origin &&
      request.method === "GET" &&
      url.pathname ===
        "/api/organizations/public-demo-neon/brand-identities/demo-neon-brand/sitemaps/demo-sitemap/pages"
    ) {
      return Response.json(DEMO_SITEMAP_PAGES);
    }
    const isNavigation =
      url.origin === window.location.origin &&
      (url.pathname === "/demo" ||
        url.pathname.startsWith("/demo/") ||
        url.pathname.startsWith("/_next/"));
    if (isNavigation && request.method === "GET") {
      return originalFetch(input, init);
    }
    throw new Error(
      "This demo is read only. Create a workspace to save changes."
    );
  };
  return () => {
    window.fetch = originalFetch;
  };
}
