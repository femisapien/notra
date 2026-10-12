# nginx host

The Stonebridge website: a static landing page served by nginx, which forwards `/blog` and `/changelog` to Notra. The Notra content is in [`examples/sites/nginx`](../../sites/nginx).

It follows [nginx and Caddy](https://usenotra.com/docs/sites/domains/nginx) and [Serve your site under a path](https://usenotra.com/docs/sites/domains/subpath).

## How it works

`nginx.conf` is a template for the official nginx Docker image. At startup the image runs `envsubst` on every file in `/etc/nginx/templates/` and writes the result to `/etc/nginx/conf.d/`, so `${NOTRA_SITE_ORIGIN}` turns into your Notra address.

- `location /` serves `html/` (the landing page, `favicon.svg` and `robots.txt`).
- `location ~ ^/(blog|changelog)(/|$)` matches `/blog`, `/blog/*`, `/changelog` and `/changelog/*`, the same paths as the four locations in the guide, and proxies them with the path unchanged.
- `proxy_set_header Host $proxy_host` sends the host from `NOTRA_SITE_ORIGIN`, like `stonebridge-nginx.notra.site`. It's the same value the guide hardcodes, read from the env var so you only set it once.
- `proxy_ssl_server_name on`, `X-Forwarded-For`, and empty `Cookie` and `Authorization` headers come straight from the guide. nginx passes redirects, `POST` bodies and the `Accept` header through by default.

## Run it locally

```bash
cp .env.example .env
docker compose up
```

Open http://localhost:8080, then http://localhost:8080/blog.

To test against a local build of the site instead of the live one, serve the build on port 8000 and point nginx at it:

```bash
python3 -m http.server 8000 -d path/to/build
NOTRA_SITE_ORIGIN=http://host.docker.internal:8000 docker compose up
```

## Deploy

On any server with Docker, copy this folder, set `NOTRA_SITE_ORIGIN` in `.env` and run `docker compose up -d`. Put TLS in front of it (a load balancer, or a `listen 443 ssl` block with your certificate).

Without Docker, render the template yourself and reload:

```bash
NOTRA_SITE_ORIGIN=https://stonebridge-nginx.notra.site \
  envsubst '${NOTRA_SITE_ORIGIN}' < nginx.conf > /etc/nginx/conf.d/stonebridge.conf
sudo nginx -t && sudo systemctl reload nginx
```

Pass the variable list to `envsubst` as above, or it also replaces nginx's own `$proxy_host` and `$uri` with empty strings.

nginx looks up the Notra host when it starts or reloads, so it refuses to start if the name doesn't resolve at that moment.

Then in Notra, add `www.yourdomain.com/blog` under **Domains** and click **Check**. Replace `www.example.com` in `html/robots.txt` with your domain so search engines find the section sitemaps.

## Environment variables

| Name | Default | What it is |
| --- | --- | --- |
| `NOTRA_SITE_ORIGIN` | `https://stonebridge-nginx.notra.site` | Your site's Notra address from the **Domains** page, without a trailing slash |

## Files

```text
nginx.conf            server block template, mounted as /etc/nginx/templates/default.conf.template
docker-compose.yml    nginx:1.29.1-alpine on port 8080
.env.example          NOTRA_SITE_ORIGIN
html/                 landing page, favicon and robots.txt
```
