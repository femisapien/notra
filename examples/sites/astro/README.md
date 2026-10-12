# Astro

A plant-care blog and changelog for a fictional app, Fernhill, served under `/blog` and `/changelog` of an Astro marketing site.

- **Live:** https://fernhill-astro.notra.site
- **Setup:** an Astro site with the Node adapter forwards `/blog` and `/changelog` to Notra from two catch-all routes. The host app is in [`examples/hosts/astro`](../../hosts/astro)
- **Shows:** logo that links back to the host's home page, green brand color, Fraunces headings with DM Sans body text, `dots` background, grid blog index with cover images and reading time, timeline changelog, authors, Steps, Tabs, callouts, code blocks and tables
- **Docs:** [Astro](https://usenotra.com/docs/sites/domains/astro), [Serve your site under a path](https://usenotra.com/docs/sites/domains/subpath), [Design and CSS](https://usenotra.com/docs/sites/customize/design), [Layouts](https://usenotra.com/docs/sites/customize/layouts)

## Use it

1. Copy this folder into your repository.
2. In Notra, open **Sites → New site**, pick the repository and, if the folder isn't at the root, turn on **Site is in a subdirectory** and enter its path.
3. Under **Settings → Content → Sections**, set the paths to `/blog` and `/changelog`.
4. Add the proxy routes from [`examples/hosts/astro`](../../hosts/astro) to your Astro site and deploy it.
5. Open **Domains → Add domain**, enter `www.yourdomain.com/blog` and click **Check**.

## Files

```text
blog.json          settings: name, logo, colors, fonts, background, navigation, authors
blog/              one .mdx file per post
changelog/         one .mdx file per release
public/images/     logo, favicon and cover images
```
