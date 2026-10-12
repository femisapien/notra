# TanStack Start host

The marketing site for Brightdesk, a fictional help desk, built with TanStack Start. It serves its own landing page at `/` and forwards `/blog` and `/changelog` to the Notra site in [`../../sites/tanstack-start`](../../sites/tanstack-start), so visitors only ever see the Brightdesk domain.

The forwarding lives in [`vite.config.ts`](./vite.config.ts), following the [TanStack Start guide](https://usenotra.com/docs/sites/domains/tanstack-start):

- **Vercel:** edge routes in `nitro({ vercel })` forward both paths before the request reaches the app.
- **Any other host** (Node, Docker, Netlify, Cloudflare): Nitro `routeRules` proxy both paths from the server.
- **Local development:** `devProxy` sends the same paths through the dev server.

The nav links to `/blog` and `/changelog` are plain `<a>` tags, because those pages aren't routes in this app. Don't add `src/routes/blog` or `src/routes/changelog`.

## Run locally

```bash
cp .env.example .env
bun install
bun run dev
```

Open http://localhost:3000, then http://localhost:3000/blog.

To try it against a local build of the Notra site instead of the live one, serve the build on a port and set `NOTRA_SITE_ORIGIN=http://localhost:<port>` in `.env`.

## Environment variables

| Name | Default | What it is |
| --- | --- | --- |
| `NOTRA_SITE_ORIGIN` | `https://brightdesk-tanstack.notra.site` | Your Notra address from the site's **Domains** page, without a trailing slash |

`vite.config.ts` reads it at build time, so set it in your host's build environment and redeploy after you change it.

## Deploy

### Vercel

Import the folder as a project. Vercel detects the Nitro output and uses the edge routes, so no extra settings are needed apart from `NOTRA_SITE_ORIGIN`.

### Node or Docker

```bash
bun run build
PORT=3000 bun run start
```

`bun run start` runs `.output/server/index.mjs`. In a Dockerfile, run `bun install` and `bun run build`, then start the server with `node .output/server/index.mjs`.

### Netlify or Cloudflare

Set the matching [Nitro preset](https://nitro.build/deploy) with `NITRO_PRESET=netlify` or `NITRO_PRESET=cloudflare_module` when you build. The `routeRules` proxy works on both.

## After the first deploy

1. In Notra, add the domain with its path on the site's **Domains** page, like `www.brightdesk.app/blog`, and click **Check**.
2. Add the section sitemaps to your own `robots.txt`:

   ```text
   Sitemap: https://www.brightdesk.app/blog/sitemap.xml
   Sitemap: https://www.brightdesk.app/changelog/sitemap.xml
   ```

## Limits

- A `routeRules` entry like `"/**": { headers: ... }` also applies to proxied pages and can replace Notra's `Content-Security-Policy`, so exclude `/blog` and `/changelog` from it.
- Middleware in `src/start.ts` doesn't run for `/blog` and `/changelog`, because Nitro forwards them before TanStack Start sees the request.

## Files

```text
vite.config.ts           TanStack Start, React and Nitro with the /blog and /changelog forwarding
src/routes/__root.tsx    HTML shell, title, favicon and RSS link
src/routes/index.tsx     the landing page
src/router.tsx           router setup
src/styles.css           landing page styles
public/favicon.svg       the Brightdesk mark
.env.example             NOTRA_SITE_ORIGIN
```
