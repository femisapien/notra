# Netlify

A blog and changelog for a fictional swim school scheduling tool, Tidepool, served under `/blog` and `/changelog` on its main website, which runs on Netlify.

- **Live:** https://tidepool-netlify.notra.site
- **Setup:** a static site on Netlify forwards `/blog` and `/changelog` to the Notra address with proxy rules (status `200`) in `netlify.toml`. The host config is in [`examples/hosts/netlify`](../../hosts/netlify).
- **Shows:** Google Font (Nunito), `gradient` background, `wash` blog hero with an eyebrow, grid blog with card images and reading time, `cards` changelog, rounder callouts, cards, tabs and code blocks through `style.css`, a pill navbar button, logo and links that point back to the host's `/`, Steps, Tabs, CodeGroup and callouts in posts
- **Docs:** [Serve your site under a path on Netlify](https://usenotra.com/docs/sites/domains/netlify), [Serve your site under a path](https://usenotra.com/docs/sites/domains/subpath), [Design and CSS](https://usenotra.com/docs/sites/customize/design)

## Use it

1. Copy this folder into your repository.
2. In Notra, open **Sites → New site**, pick the repository and, if the folder isn't at the root, turn on **Site is in a subdirectory** and enter its path.
3. Under **Settings → Content → Sections**, set the paths to `/blog` and `/changelog`.
4. Add the proxy rules from [`examples/hosts/netlify/netlify.toml`](../../hosts/netlify/netlify.toml) to your Netlify site, with your own Notra address.
5. Open **Domains → Add domain**, enter `www.yourdomain.com/blog`, deploy the Netlify site and click **Check**.

The logo and the **Home** links use `/`, so they lead back to your website's home page once the site runs under your domain.

## Files

```text
blog.json          settings: name, logo, colors, font, background, navigation, authors
style.css          rounder corners on callouts, cards, tabs, code blocks and the navbar button
blog/              one .mdx file per post
changelog/         one .mdx file per release
public/images/     logo, favicon and cover images
```
