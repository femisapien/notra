# Vercel host

A one-page static website for Quillstack on Vercel that serves the Notra site from [`../../sites/vercel`](../../sites/vercel) under `/blog` and `/changelog`. There is no framework and no build step: `vercel.json` does the forwarding, so the same rewrites work for any framework you deploy on Vercel.

- **Recipe:** [Serve your site under a path on Vercel](https://usenotra.com/docs/sites/domains/vercel)

## How it works

`vercel.json` has four rewrites, `/blog`, `/blog/:path*`, `/changelog` and `/changelog/:path*`, each pointing to the same path on `https://quillstack-vercel.notra.site`. Vercel fetches those paths from Notra at the edge and keeps your domain in the address bar. Vercel keeps the `Accept` header and passes Notra's redirects back to the browser, so Markdown for AI agents and `blog.json` redirects work without extra setup.

### Why the address is hardcoded

`vercel.json` is static and can't read environment variables, so there is no `NOTRA_SITE_ORIGIN` here and no `.env.example`. To point the rewrites at your own site, replace `https://quillstack-vercel.notra.site` with the address on your site's **Domains** page in all four rules. If you need the address to come from an environment variable, use a framework config instead, like [Next.js](https://usenotra.com/docs/sites/domains/nextjs).

## Run locally

`vercel dev` applies the rewrites locally. It asks to link the folder to a Vercel project the first time:

```bash
cd examples/hosts/vercel
vercel dev
```

Then open http://localhost:3000, http://localhost:3000/blog and http://localhost:3000/changelog. Opening `index.html` directly works for the landing page, but not for the rewrites.

## Deploy

1. Import the repository on Vercel and set **Root Directory** to `examples/hosts/vercel`, or run `vercel deploy --prod` from this folder.
2. Leave the framework preset on **Other**, with no build command.
3. Add your domain to the Vercel project.
4. In Notra, open **Domains → Add domain**, enter `www.yourdomain.com/blog`, and click **Check**. You can test the rewrite first at `https://www.yourdomain.com/blog/_notra/probe.txt`.

Keep these in mind (from the recipe):

- Don't set `trailingSlash: true`, because the check fails on the `/blog` → `/blog/` redirect.
- Don't add pages under `/blog` or `/changelog` to this folder. Files win over rewrites.
- If the Vercel Firewall's Attack Challenge Mode is on, allow the section paths or the user agent `NotraSitesVerifier/1.0`.
- Exclude `/blog` and `/changelog` from any `headers` rule for `/(.*)`, like a `Content-Security-Policy`.

## Environment variables

None. See [why the address is hardcoded](#why-the-address-is-hardcoded).

## Files

```text
vercel.json   the four rewrites to Notra
index.html    the landing page, with links to /blog and /changelog
robots.txt    your own robots.txt, with the section sitemaps (replace www.quillstack.dev with your domain)
favicon.svg   the Quillstack mark
```
