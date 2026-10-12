# Netlify host

Tidepool's main website: one static landing page on Netlify that serves the [Tidepool Notra site](../../sites/netlify) under `/blog` and `/changelog` with proxy rules in `netlify.toml`.

- **Recipe:** [Serve your site under a path on Netlify](https://usenotra.com/docs/sites/domains/netlify)
- **Notra address:** `https://tidepool-netlify.notra.site`

## How it works

`netlify.toml` has four rules, one for each section path and one for everything below it:

```toml
[[redirects]]
  from = "/blog/*"
  to = "https://tidepool-netlify.notra.site/blog/:splat"
  status = 200
  force = true
```

`status = 200` makes Netlify proxy the request instead of redirecting, so visitors stay on your domain, and `force = true` applies the rule even if a file exists at that path. These are the rules from the Netlify recipe, which meet [What the rewrite has to do](https://usenotra.com/docs/sites/domains/subpath#what-the-rewrite-has-to-do).

**The Notra address is written into `netlify.toml`.** Netlify doesn't read environment variables in redirect rules, so `NOTRA_SITE_ORIGIN` can't be used there. Replace `tidepool-netlify.notra.site` with the address on your site's **Domains** page. If you use a `_redirects` file instead, the same applies.

Netlify uses the first rule that matches, so keep these above any catch-all rule like `/* /index.html 200`.

## Run it locally

Netlify's proxy only runs on Netlify (or in `netlify dev`). `dev.ts` is a small stand-in that serves `public/` and applies the rules from `netlify.toml`, with the Notra address swapped for `NOTRA_SITE_ORIGIN` when it's set:

```bash
cp .env.example .env
bun run dev
# http://localhost:8888, with /blog and /changelog coming from NOTRA_SITE_ORIGIN
```

To test against a local build of the site, serve the build folder and point the stand-in at it:

```bash
python3 -m http.server 4321 -d path/to/build
NOTRA_SITE_ORIGIN=http://localhost:4321 bun run dev
```

With the Netlify CLI installed, `netlify dev` runs the real rules against the address in `netlify.toml`.

## Deploy

1. Create a site on Netlify from this folder (set **Base directory** to `examples/hosts/netlify` if it lives in this repository). There is no build command, and `netlify.toml` publishes `public/`.
2. Add your domain to the Netlify site, for example `www.tidepool.example`.
3. In Notra, set the section paths to `/blog` and `/changelog`, open **Domains → Add domain** and enter `www.tidepool.example/blog`.
4. Open `https://www.tidepool.example/blog/_notra/probe.txt` to confirm the rule works, then click **Check** in Notra.
5. Replace the domain in `public/robots.txt` with yours, so it lists both section sitemaps.

## Environment variables

| Variable | Used by | Default |
| --- | --- | --- |
| `NOTRA_SITE_ORIGIN` | `dev.ts` only | `https://tidepool-netlify.notra.site` |
| `PORT` | `dev.ts` only | `8888` |

Netlify itself needs no variables.

## Files

```text
netlify.toml       publish folder and the proxy rules
public/index.html  the landing page, with links to /blog and /changelog
public/style.css   landing page styles
public/robots.txt  crawler rules and the section sitemaps
public/favicon.svg the Tidepool mark
dev.ts             local stand-in for Netlify's proxy rules
.env.example       NOTRA_SITE_ORIGIN for dev.ts
```
