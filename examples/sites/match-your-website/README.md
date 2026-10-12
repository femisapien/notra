# Match your website

A blog and changelog for Orbitly, a made-up satellite imagery API. They use Orbitly's own header, footer and design tokens, so the blog looks like part of the marketing site.

- **Live:** https://orbitly-custom-header.notra.site
- **Setup:** none beyond the site's `notra.site` address. Add a domain like `blog.orbitly.dev` later if you want one.
- **Shows:** your own `header.mdx` and `footer.mdx` written in Tailwind, the built-in `<SiteAreas />` and `<ThemeToggle />` in that header, a custom blog hero (`slots/blog-hero.mdx`) and changelog hero (`slots/changelog-hero.mdx`), a newsletter signup under every post (`slots/after-post.mdx`), and brand tokens in `style.css` that change for light and dark mode. Also Google Fonts (Space Grotesk headings, Inter body), a code theme for each mode, and Steps, Tabs and Note in posts.
- **Docs:** [Match your website](https://usenotra.com/docs/sites/match-your-website), [Design and CSS](https://usenotra.com/docs/sites/customize/design)

## Use it

1. Copy this folder into your repository.
2. Replace the header and footer markup with your own. If you paste HTML from your landing page, change `class` to `className` and close empty tags like `<img />`.
3. Point the newsletter form's `action` in `slots/after-post.mdx` at your newsletter provider's signup endpoint.
4. In Notra, open **Sites → New site** and pick the repository. If the folder isn't at the root, turn on **Site is in a subdirectory** and enter its path.

## Dark mode

The header, footer and slots only use theme colors (`bg-background`, `text-foreground`, `text-muted-foreground`, `border-border`, `text-primary`) or the `--orbitly-*` and theme variables in `style.css`. That way they switch with the theme. `style.css` sets the navy palette under `html.dark` and a pale slate palette for light mode. `<ThemeToggle />` sits in the header because the custom footer replaces the theme footer, and the theme footer is where the toggle normally lives.

## Files

```text
blog.json                 settings: name, colors, fonts, appearance, authors
header.mdx                your header, replaces the theme's navbar
footer.mdx                your footer, replaces the theme's footer
style.css                 brand tokens and classes, loads after the theme
slots/blog-hero.mdx       top of the blog home
slots/changelog-hero.mdx  top of the changelog
slots/after-post.mdx      newsletter signup under every post
blog/                     one .mdx file per post
changelog/                one .mdx file per release
public/images/            logo, favicon and cover images
```
