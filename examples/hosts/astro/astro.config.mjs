import node from "@astrojs/node";
import { defineConfig } from "astro/config";

export default defineConfig({
  site: process.env.SITE_URL ?? "http://localhost:4321",
  // Pages are static by default. Only the /blog and /changelog proxy routes
  // opt out with `prerender = false` and run on the Node server.
  adapter: node({ mode: "standalone" }),
  // "ignore" (the default) never redirects /blog to /blog/, which Notra's check needs.
  trailingSlash: "ignore",
  security: {
    // Notra's analytics posts time on page to /blog/_notra/e with
    // navigator.sendBeacon (a text/plain POST). Astro's origin check rejects
    // such requests behind proxies that rewrite the host or protocol, and the
    // proxy routes are this app's only on-demand routes, so it is turned off.
    checkOrigin: false,
  },
});
