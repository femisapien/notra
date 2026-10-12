# TanStack Start

A product blog and changelog for a fictional help desk, Brightdesk, served under `/blog` and `/changelog` of its TanStack Start marketing site.

- **Live:** https://brightdesk-tanstack.notra.site
- **Setup:** a path on your own website, `brightdesk.app/blog` and `brightdesk.app/changelog`, forwarded to Notra from `vite.config.ts` with Nitro. The host app is in [`../../hosts/tanstack-start`](../../hosts/tanstack-start).
- **Shows:** Google fonts per role (Bricolage Grotesque headings, Inter body), warm page background, logo that links back to the host's home page, list blog index with a `wash` hero, timeline changelog with a cover image, Steps, Tabs and callouts in posts
- **Docs:** [TanStack Start](https://usenotra.com/docs/sites/domains/tanstack-start), [Serve your site under a path](https://usenotra.com/docs/sites/domains/subpath), [Layouts](https://usenotra.com/docs/sites/customize/layouts), [Design and CSS](https://usenotra.com/docs/sites/customize/design)

## Use it

1. Copy this folder into your repository.
2. In Notra, open **Sites → New site**, pick the repository and, if the folder isn't at the root, turn on **Site is in a subdirectory** and enter its path.
3. Under **Settings → Content → Sections**, set the paths to `/blog` and `/changelog`.
4. Open **Domains → Add domain** and enter your website's host with the path, like `www.brightdesk.app/blog`.
5. Add the rewrite to your TanStack Start app, as in [`hosts/tanstack-start`](../../hosts/tanstack-start), deploy it and click **Check**.

## Files

```text
blog.json          settings: name, logo, colors, fonts, navigation, layouts, authors
blog/              one .mdx file per post
changelog/         one .mdx file per release
public/images/     logo, favicon and cover image
```
