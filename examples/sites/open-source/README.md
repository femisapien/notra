# Open source

A blog and release notes for a fictional open-source project, DriftDB, an embedded time-series database.

- **Live:** https://driftdb-oss.notra.site
- **Setup:** the site's `notra.site` address, or your own domain from **Domains**
- **Shows:** content variables in posts, banner and descriptions, redirects for old release-note URLs, SEO metatags and organization, `markdown.instructions` for AI agents in `llms.txt` and every Markdown page, GitHub button plus Discord and X links in the navbar, footer socials, versioned release notes with Breaking, Feature and Fix tags, a benchmark table, Tabs, Steps, callouts and cards, `dots` background, amber brand color with a separate dark-mode shade, list blog, timeline changelog
- **Docs:** [Posts and variables](https://usenotra.com/docs/sites/posts#variables), [SEO and redirects](https://usenotra.com/docs/sites/customize/seo), [AI agents and search](https://usenotra.com/docs/sites/agents), [Navigation](https://usenotra.com/docs/sites/customize/navigation), [blog.json reference](https://usenotra.com/docs/sites/reference/blog-json)

## Use it

1. Copy this folder into your repository.
2. In Notra, open **Sites → New site**, pick the repository and, if the folder isn't at the root, turn on **Site is in a subdirectory** and enter its path.
3. On each release, change `version` and `install` under `variables` in `blog.json`, or in **Settings → Content variables**, and add a file to `changelog/`. The banner, descriptions and posts pick up the new values.

Variables aren't replaced inside code, so the posts show `{{ install }}` in bold text instead of inline code. They do work in `markdown.instructions`.

## Files

```text
blog.json          settings: brand, variables, redirects, SEO, agent instructions
blog/              one .mdx file per post
changelog/         one .mdx file per release, with version and tags
public/images/     logo and favicon
```
