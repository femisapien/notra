# Astro host

The Fernhill marketing site, built with Astro. It serves the Notra site from [`examples/sites/astro`](../../sites/astro) under `/blog` and `/changelog` on its own domain.

- The landing page, `/robots.txt` and `/llms.txt` are prerendered at build time.
- `src/pages/blog/[...path].ts` and `src/pages/changelog/[...path].ts` render on demand (`prerender = false`) and forward every request to Notra with the path unchanged. `[...path]` also matches `/blog` itself.
- The Node adapter (`@astrojs/node`, standalone mode) runs the server anywhere Node runs.

The proxy in `src/lib/notra-proxy.ts` follows [the rules for a rewrite](https://usenotra.com/docs/sites/domains/subpath#what-the-rewrite-has-to-do):

| Rule | How |
| --- | --- |
| Keep the path | Fetches `NOTRA_SITE_ORIGIN` + the same path and query |
| `Host` is the Notra address | Drops the incoming `Host`, so `fetch` sets it from the URL |
| Don't follow redirects | `redirect: "manual"` returns Notra's `307` and `308` to the browser |
| Forward `POST` with its body | Analytics posts to `/blog/_notra/e` |
| Keep `Accept` | Copies the request headers, so AI agents get Markdown |
| Visitor IP in `X-Forwarded-For` | Appends Astro's `clientAddress` |
| No cookies or `Authorization` | Removed before forwarding |
| Leave Notra's response alone | Passes status and headers through, and `X-Astro-Reroute: no` keeps Notra's 404 page |
| No trailing-slash redirect | `trailingSlash: "ignore"` (the default) |

`security.checkOrigin` is off in `astro.config.mjs`. Notra's analytics sends a `text/plain` POST with `navigator.sendBeacon`, which Astro's origin check can reject behind a proxy that changes the host or protocol. The proxy routes are the only on-demand routes in this app. If your app has its own forms, keep the check on and confirm `/blog/_notra/e` still answers.

## Run locally

```bash
cp .env.example .env
bun install
bun run dev
```

Open http://localhost:4321, then http://localhost:4321/blog. The proxy also works in `astro dev`.

To test against a local build of the site instead of the live one, build `examples/sites/astro`, serve the output on a port, and set `NOTRA_SITE_ORIGIN=http://localhost:<port>`.

## Deploy

Build once, then run the Node server:

```bash
bun run build
HOST=0.0.0.0 PORT=8080 bun run start
```

This works on Railway, Render, Fly.io, a VPS or Docker. A minimal Dockerfile:

```dockerfile
FROM oven/bun:1 AS build
WORKDIR /app
COPY . .
RUN bun install && bun run build

FROM node:24-slim
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
ENV HOST=0.0.0.0 PORT=8080
CMD ["node", "./dist/server/entry.mjs"]
```

On Vercel or Netlify, swap `@astrojs/node` for `@astrojs/vercel` or `@astrojs/netlify`. The routes stay the same.

### Fully static Astro site on Vercel

If your Astro site has no adapter and deploys as static files, skip the proxy routes and use rewrites in `vercel.json` at the project root. See [Vercel](https://usenotra.com/docs/sites/domains/vercel).

```json vercel.json
{
  "rewrites": [
    { "source": "/blog", "destination": "https://fernhill-astro.notra.site/blog" },
    { "source": "/blog/:path*", "destination": "https://fernhill-astro.notra.site/blog/:path*" },
    { "source": "/changelog", "destination": "https://fernhill-astro.notra.site/changelog" },
    { "source": "/changelog/:path*", "destination": "https://fernhill-astro.notra.site/changelog/:path*" }
  ]
}
```

Delete any `src/pages/blog` and `src/pages/changelog` pages first, because files in your deployment win over rewrites. Netlify and Cloudflare have their own guides under [Serve your site under a path](https://usenotra.com/docs/sites/domains/subpath).

## Environment variables

| Name | Default | What it is |
| --- | --- | --- |
| `NOTRA_SITE_ORIGIN` | `https://fernhill-astro.notra.site` | The Notra address from the site's **Domains** page, read at request time |
| `SITE_URL` | `http://localhost:4321` | This website's public URL, used for the `Sitemap` lines in `/robots.txt` at build time |
| `HOST`, `PORT` | `localhost`, `4321` | Where the Node server listens |

## After deploying

1. In Notra, open **Domains → Add domain** and enter `www.yourdomain.com/blog`.
2. Open `https://www.yourdomain.com/blog/_notra/probe.txt` to confirm the proxy works, then click **Check**.

## Files

```text
astro.config.mjs                    Node adapter, trailingSlash, checkOrigin
src/lib/notra-proxy.ts              forwards a request to Notra
src/pages/blog/[...path].ts         /blog and everything below it
src/pages/changelog/[...path].ts    /changelog and everything below it
src/pages/index.astro               the landing page
src/pages/robots.txt.ts             your robots.txt, with the section sitemaps
src/pages/llms.txt.ts               your llms.txt, linking each section's llms.txt
```
