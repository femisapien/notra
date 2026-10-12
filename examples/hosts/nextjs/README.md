# Next.js host

Pathway's marketing site, a Next.js App Router app with one landing page. It serves the Notra site in [`examples/sites/nextjs`](../../sites/nextjs) under `/blog` and `/changelog` on its own domain, using `rewrites` in `next.config.ts`.

```text
www.pathway.com/            this app
www.pathway.com/blog/*      ──► https://pathway-nextjs.notra.site/blog/*
www.pathway.com/changelog/* ──► https://pathway-nextjs.notra.site/changelog/*
```

**Docs:** [Serve your site under a path with Next.js](https://usenotra.com/docs/sites/domains/nextjs)

## Run it locally

```bash
cp .env.example .env.local
bun install
bun run dev
```

Open http://localhost:3000, then click **Blog** or **Changelog**.

To try it against a local build of the site instead of the live one, set `NOTRA_SITE_ORIGIN=http://localhost:4321` (or wherever your build is served) and restart the dev server. Use a static server that serves `blog/index.html` for `/blog` without redirecting to `/blog/`.

## How it works

All of it is in [`next.config.ts`](./next.config.ts): four `beforeFiles` rewrites forward `/blog`, `/blog/*`, `/changelog` and `/changelog/*` to the Notra address with the path unchanged. Next.js proxies these requests itself, so it:

- sends `Host` set to the Notra address, which is how Notra finds the site
- forwards `POST` requests with their body, which site analytics needs
- passes Notra's redirects back to the browser and keeps the `Accept` header

The landing page links to `/blog` and `/changelog` with plain `<a>` tags, not `next/link`, because those paths aren't routes in this app.

Keep `trailingSlash` off, don't set a `basePath`, and if you add a `proxy.ts` or a site-wide `Content-Security-Policy`, exclude the section paths. The [Next.js guide](https://usenotra.com/docs/sites/domains/nextjs) explains each one.

## Deploy

**Vercel:** import the folder as a project (framework preset Next.js, root directory `examples/hosts/nextjs` if you deploy from this repository), add `NOTRA_SITE_ORIGIN` under **Settings → Environment Variables** and deploy.

**Anywhere else:** `bun run build && bun run start` on any Node.js host or container. Put it behind a load balancer or CDN that sets `X-Forwarded-For`, because Next.js passes that header on to Notra but doesn't add the visitor's IP itself.

After deploying, open `https://www.yourdomain.com/blog/_notra/probe.txt`. You should see a line that starts with `notra-site=`. Then click **Check** on the domain in Notra and add the sitemaps to your `robots.txt`:

```text
Sitemap: https://www.yourdomain.com/blog/sitemap.xml
Sitemap: https://www.yourdomain.com/changelog/sitemap.xml
```

## Environment variables

| Name | Default | What it is |
| --- | --- | --- |
| `NOTRA_SITE_ORIGIN` | `https://pathway-nextjs.notra.site` | The site's Notra address from its **Domains** page. Read at build time, so redeploy after changing it |

## Files

```text
next.config.ts     the rewrites to Notra
app/page.tsx       the landing page
app/layout.tsx     root layout and metadata
app/globals.css    styles
app/icon.svg       favicon
public/logo.svg    logo
.env.example       NOTRA_SITE_ORIGIN
```
