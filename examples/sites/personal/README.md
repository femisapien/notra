# Personal

The smallest useful Notra site: a personal blog for a fictional engineer, Ada Brennan, with only a blog section and the posts at the root of the domain.

- **Live:** https://ada-personal.notra.site
- **Setup:** blog section only, at `/`, with the changelog section turned off
- **Shows:** a short `blog.json` (name, description, logo, one color, one font), list index, narrow posts with no table of contents, author card, reading time or post actions
- **Docs:** [Domains and section paths](https://usenotra.com/docs/sites/domains/overview#section-paths), [Layouts](https://usenotra.com/docs/sites/customize/layouts), [blog.json reference](https://usenotra.com/docs/sites/reference/blog-json)

## Use it

1. Copy this folder into your repository.
2. In Notra, open **Sites → New site**, pick the repository and, if the folder isn't at the root, turn on **Site is in a subdirectory** and enter its path.
3. Set the blog path to `/` and leave the changelog path empty. On an existing site, do the same under **Settings → Content → Sections**: set the blog path to `/` and turn the changelog section off with its switch. A site needs at least one section on, so a blog on its own is fine.

Posts then live at `/<file-name>`, for example `blog/partial-indexes.mdx` is served at `/partial-indexes`. Section paths are set in the dashboard, not in `blog.json`.

## Files

```text
blog.json          settings: name, logo, color, font, layout
blog/              one .mdx file per post
public/images/     logo and favicon
```
