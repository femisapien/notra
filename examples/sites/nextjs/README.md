# Next.js

A blog and changelog for a fictional company, Pathway (route planning for delivery fleets), served under `/blog` and `/changelog` of its Next.js marketing site.

- **Live:** https://pathway-nextjs.notra.site
- **Setup:** section paths `/blog` and `/changelog`, forwarded by `rewrites` in the host app's `next.config.ts`. The host app is in [`examples/hosts/nextjs`](../../hosts/nextjs)
- **Shows:** logo that links back to the host's homepage, blue brand color, `wash` hero with an eyebrow, `magazine` blog index with cover images and reading time, `cards` changelog with images, two authors, footer columns, `Steps`, `Tabs`, `CardGroup`, `Note` and `Tip`
- **Docs:** [Serve your site under a path](https://usenotra.com/docs/sites/domains/subpath), [Next.js](https://usenotra.com/docs/sites/domains/nextjs), [Layouts](https://usenotra.com/docs/sites/customize/layouts)

## Use it

1. Copy this folder into your repository.
2. In Notra, open **Sites → New site**, pick the repository and, if the folder isn't at the root, turn on **Site is in a subdirectory** and enter its path.
3. Under **Settings → Content → Sections**, set the paths to `/blog` and `/changelog`.
4. Add the rewrites from [`examples/hosts/nextjs`](../../hosts/nextjs) to your Next.js app, deploy it, then open **Domains → Add domain**, enter `www.yourdomain.com/blog` and click **Check**.

## Files

```text
blog.json          settings: name, logo, colors, navigation, layouts, authors
blog/              one .mdx file per post
changelog/         one .mdx file per release
public/images/     logo, favicon and cover images
```
