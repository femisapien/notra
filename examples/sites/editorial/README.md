# Editorial

A long-form magazine for a fictional transit-mapping company, Meridian Cartographic: essays on urban design, plus release notes for its map editor, Meridian Atlas.

- **Live:** https://meridian-editorial.notra.site
- **Setup:** the site's `notra.site` address, or any domain from the Domains tab
- **Shows:** serif heading and body fonts (Instrument Serif, Source Serif 4), warm page color in light and dark mode, `layout.width` 80, `image` hero with an eyebrow, `magazine` blog layout with two pinned posts and card images, narrow reading column, multiple authors with avatars and bios, pull quotes from blockquotes, figures with captions in `Frame`, `Steps`, `Tabs`, `Tip`, `Note`, tables, a `style.css` that turns blockquotes into pull quotes, timeline changelog with a cover image
- **Docs:** [Design and CSS](https://usenotra.com/docs/sites/customize/design), [Layouts](https://usenotra.com/docs/sites/customize/layouts), [Posts and authors](https://usenotra.com/docs/sites/posts), [Media](https://usenotra.com/docs/sites/components/media)

## Use it

1. Copy this folder into your repository.
2. In Notra, open **Sites → New site**, pick the repository and, if the folder isn't at the root, turn on **Site is in a subdirectory** and enter its path.
3. Swap the fonts, colors and authors in `blog.json` for your own, and keep or drop `style.css`.

## Files

```text
blog.json                 settings: fonts, colors, hero, featured posts, authors
style.css                 pull quotes, single-weight serif headings, two-column grid
blog/                     four essays
changelog/                three Meridian Atlas releases
public/images/            logo, favicon, hero and cover images
public/images/authors/    author avatars
public/images/figures/    figures used inside posts
```
