# Custom components

A blog and changelog for a fictional icon library, Pixelmint, built around its own React components, a custom script and CSS, next to every built-in component.

- **Live:** https://pixelmint-components.notra.site
- **Setup:** the site's `notra.site` address, no domain or env vars needed
- **Shows:** interactive React components in `snippets/` (icon search, pricing toggle, before/after slider), a static component with `client:static`, a component exported inside a post, reusable MDX snippets with props, `script.js` for copy-to-clipboard, component CSS, and every built-in component: callouts, cards, tabs, steps, accordions, code blocks and `CodeGroup`, `Frame` and `Video`, `Badge` and `Update`. Grid blog with card images, mint colors, Fredoka and Nunito fonts
- **Docs:** [Your own components](https://usenotra.com/docs/sites/custom-components), [Custom scripts](https://usenotra.com/docs/sites/custom-scripts), [Components](https://usenotra.com/docs/sites/components/overview), [Design and CSS](https://usenotra.com/docs/sites/customize/design)

## Where each piece is used

| File | Used in |
| --- | --- |
| `snippets/icon-search.jsx` | `blog/icon-search-in-the-docs.mdx` |
| `snippets/pricing-toggle.jsx` | `blog/yearly-plans.mdx` |
| `snippets/before-after.jsx` | `blog/redrawing-on-one-grid.mdx` |
| `snippets/icon-name.jsx` (`client:static`) | two posts and `changelog/2026-10-06.mdx` |
| `snippets/install.mdx`, `snippets/license.mdx` | MDX snippets with props, in the first two posts |
| `script.js` | Copies any element with `data-copy` and shows a toast, on every page |
| `components.css`, `style.css` | Styles for the snippets, and rounder built-in components |

`IconName` shows how the pieces fit: React renders the button at build time without shipping JavaScript, and `script.js` handles the click. The changelog page that uses it loads no React at all.

## Use it

1. Copy this folder into your repository.
2. In Notra, open **Sites → New site**, pick the repository and, if the folder isn't at the root, turn on **Site is in a subdirectory** and enter its path.
3. Edit or replace the components in `snippets/`. Anyone with write access to the repository can run JavaScript on your site, so keep that list short.

## Files

```text
blog.json                 settings: name, logo, colors, fonts, navigation, authors
blog/                     one .mdx file per post
changelog/                one .mdx file per release
snippets/*.jsx            React components, imported by name
snippets/*.mdx            reusable MDX content with props
script.js                 runs on every page
components.css, style.css loaded on every page after the theme
public/images/            logo, covers and post images
public/videos/            the video in the redraw post
```
