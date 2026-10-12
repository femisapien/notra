import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";

// The site's Notra address, from the Domains page. Read at build time.
const NOTRA_SITE =
  process.env.NOTRA_SITE_ORIGIN ?? "https://brightdesk-tanstack.notra.site";

export default defineConfig({
  plugins: [
    tanstackStart(),
    viteReact(),
    nitro({
      // On Vercel: forwarded at the edge, before the request reaches the app.
      vercel: {
        config: {
          version: 3,
          routes: [
            { src: "^/blog(/.*)?$", dest: `${NOTRA_SITE}/blog$1` },
            { src: "^/changelog(/.*)?$", dest: `${NOTRA_SITE}/changelog$1` },
          ],
        },
      },
      // Everywhere else (Node, Docker, Netlify, Cloudflare): proxied by Nitro.
      routeRules: {
        "/blog": { proxy: `${NOTRA_SITE}/blog` },
        "/blog/**": { proxy: `${NOTRA_SITE}/blog/**` },
        "/changelog": { proxy: `${NOTRA_SITE}/changelog` },
        "/changelog/**": { proxy: `${NOTRA_SITE}/changelog/**` },
      },
      // Local development: the same paths through the dev server.
      devProxy: {
        "/blog": { target: NOTRA_SITE, changeOrigin: true },
        "/blog/**": { target: NOTRA_SITE, changeOrigin: true },
        "/changelog": { target: NOTRA_SITE, changeOrigin: true },
        "/changelog/**": { target: NOTRA_SITE, changeOrigin: true },
      },
    }),
  ],
});
