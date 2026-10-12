# Cloudflare host

A Cloudflare Worker for Relaywave's main website. It serves a one-page landing page at `/` and forwards `/blog` and `/changelog` to the Notra site in [`examples/sites/cloudflare`](../../sites/cloudflare).

The proxy code follows [Serve your site under a path with Cloudflare](https://usenotra.com/docs/sites/domains/cloudflare): it forwards each section path and everything below it with the path unchanged, drops `cookie` and `authorization`, sets `x-forwarded-for` from `cf-connecting-ip`, forwards the method and body, and returns Notra's redirects to the browser with `redirect: "manual"`.

## Run locally

```bash
bun install
cp .env.example .env   # optional, to point at a different Notra address
bun run dev
```

Open http://localhost:8787, then `/blog` and `/changelog`.

To test against a local build of the site instead of the live one, serve the build folder and point the Worker at it:

```bash
python3 -m http.server 4321 -d path/to/build
echo "NOTRA_SITE_ORIGIN=http://localhost:4321" > .env
bun run dev
```

## Deploy

```bash
bunx wrangler login
bun run deploy
```

Then pick one of the two route setups in `wrangler.jsonc`:

- **This Worker is the whole website.** Uncomment the `custom_domain` route. Cloudflare creates the DNS record and certificate for `www.yourdomain.com`.
- **You already have a website.** Uncomment the two section routes and add `"PASS_THROUGH": "true"` to `vars`. The Worker only receives `/blog*` and `/changelog*`, and anything else it gets goes straight to your origin with `fetch(request)`, like in the docs.

After deploying, open `https://www.yourdomain.com/blog/_notra/probe.txt` and click **Check** on the domain in Notra. If Bot Fight Mode or WAF rules are on, allow the section paths or the user agent `NotraSitesVerifier/1.0`, and exclude the section paths from any "cache everything" rule.

## Environment variables

| Name | Default | Description |
| --- | --- | --- |
| `NOTRA_SITE_ORIGIN` | `https://relaywave-cloudflare.notra.site` | The Notra address from the site's **Domains** page. Set it in `vars` in `wrangler.jsonc`, or in `.env` for `wrangler dev` |
| `PASS_THROUGH` | unset | `"true"` sends every non-section request to your origin instead of the landing page |

## Files

```text
worker.js          routing: sections to Notra, everything else to the landing page
landing.js         the landing page HTML
wrangler.jsonc     Worker name, vars and routes
.env.example       local override for NOTRA_SITE_ORIGIN
package.json       wrangler, pinned
```
