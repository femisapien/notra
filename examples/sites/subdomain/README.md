# Subdomain

A product blog and changelog for a fictional company, Ledgerly, served on its own subdomain.

- **Live:** https://ledgerly-subdomain.notra.site
- **Setup:** the site's `notra.site` address, or a subdomain like `blog.acme.com` with a CNAME to `cname.notra.site`
- **Shows:** logo, brand color, navbar with a call to action, footer columns, authors, grid blog index, timeline changelog
- **Docs:** [Set up a subdomain](https://usenotra.com/docs/sites/domains/subdomain)

## Use it

1. Copy this folder into your repository.
2. In Notra, open **Sites → New site**, pick the repository and, if the folder isn't at the root, turn on **Site is in a subdirectory** and enter its path.
3. Open **Domains**, add `blog.yourdomain.com` and add the records the dashboard shows.

## Files

```text
blog.json          settings: name, logo, colors, navigation, authors
blog/              one .mdx file per post
changelog/         one .mdx file per release
public/images/     logo and cover images
```
