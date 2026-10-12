# Plausible

A journal and changelog for a fictional privacy-focused design studio, Northwind Studio, that sends visits to Plausible.

- **Live:** https://northwind-plausible.notra.site
- **Setup:** `integrations.plausible` in `blog.json`, no script tag and no cookie banner
- **Shows:** Plausible analytics, page background color per mode, terracotta accent, Google heading font, `list` blog index, narrow posts, compact changelog, footer columns with socials
- **Docs:** [Plausible](https://usenotra.com/docs/sites/integrations/analytics/plausible), [Analytics integrations](https://usenotra.com/docs/sites/integrations/analytics/overview)

## The Plausible setting

```json
"integrations": {
  "plausible": { "domain": "northwind-plausible.notra.site" }
}
```

`northwind-plausible.notra.site` is a placeholder. Replace it with the domain you added in Plausible, without `https://`, like `blog.acme.com`.

If you run Plausible yourself, add `server` with your server's hostname, without protocol or path, and a port if it needs one:

```json
"integrations": {
  "plausible": { "domain": "blog.acme.com", "server": "plausible.acme.com" }
}
```

Without `server`, events go to Plausible Cloud at `plausible.io`. Notra loads the script over HTTPS and adds the host to the Content-Security-Policy for you.

The script only runs on the live production site. Drafts, PR previews, branch previews and local development don't load it, so test on the live URL and watch the realtime count in Plausible.

## Use it

1. Add your site in [Plausible](https://plausible.io/docs/add-website) and replace the placeholder domain in `blog.json`.
2. Copy this folder into your repository.
3. In Notra, open **Sites → New site**, pick the repository and, if the folder isn't at the root, turn on **Site is in a subdirectory** and enter its path.
4. After the first production deployment, open the live site and check that the visit appears in Plausible.

## Files

```text
blog.json          settings: name, logo, colors, background, fonts, navigation, authors, Plausible
blog/              one .mdx file per post
changelog/         one .mdx file per release
public/images/     logo and favicon
```
