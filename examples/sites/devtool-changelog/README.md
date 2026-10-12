# Devtool changelog

A changelog-first site for a fictional developer tool, Forgekit (a CLI and SDK for building internal tools), with release notes as the main section and a small engineering blog next to it.

- **Live:** https://forgekit-changelog.notra.site
- **Setup:** the site's `notra.site` address, or a subdomain like `changelog.acme.dev` with a CNAME to `cname.notra.site`
- **Shows:** dark-only appearance, JetBrains Mono headings with Inter body text, a Shiki code theme (`vitesse-dark`), grid background, GitHub button in the navbar, logo linking to the changelog, timeline changelog with versions, `Update` for grouped patch releases, `Tabs` for npm/bun/pnpm, `Warning` for breaking changes, list blog index with narrow posts
- **Docs:** [Layouts](https://usenotra.com/docs/sites/customize/layouts), [Design and CSS](https://usenotra.com/docs/sites/customize/design), [Code](https://usenotra.com/docs/sites/components/code), [Badges and updates](https://usenotra.com/docs/sites/components/badges-and-updates), [Tabs](https://usenotra.com/docs/sites/components/tabs)

## Use it

1. Copy this folder into your repository.
2. In Notra, open **Sites → New site**, pick the repository and, if the folder isn't at the root, turn on **Site is in a subdirectory** and enter its path.
3. Keep the default mounts: the changelog at `/changelog` and the blog at `/blog`.
4. Add a new file to `changelog/` for every release, named by its date, with `version` and `tags` in the frontmatter.

## Files

```text
blog.json          settings: name, logo, dark appearance, fonts, code theme, navigation, authors
blog/              one .mdx file per post
changelog/         one .mdx file per release
public/images/     logo and favicon
```
