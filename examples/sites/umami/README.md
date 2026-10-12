# Umami

A product blog and changelog for a fictional company, Kilnworks, that sends every visit to Umami.

- **Live:** https://kilnworks-umami.notra.site
- **Setup:** an Umami website and its Website ID under `integrations.umami` in `blog.json`. No script tag needed
- **Shows:** Umami analytics, clay red brand color, Space Grotesk headings, warm page background, grid blog without cover images but with reading time, cards changelog
- **Docs:** [Umami](https://usenotra.com/docs/sites/integrations/analytics/umami), [Analytics integrations](https://usenotra.com/docs/sites/integrations/analytics/overview)

## Use it

1. Copy this folder into your repository.
2. In Umami, edit your website, open **Tracking code** and copy the UUID from `data-website-id`.
3. Replace the placeholder `websiteId` in `blog.json` with it.
4. In Notra, open **Sites → New site**, pick the repository and, if the folder isn't at the root, turn on **Site is in a subdirectory** and enter its path.
5. After the production deployment finishes, open the live site and check that the visit shows up in Umami.

Analytics only run on the live production site, not on previews or local builds.

### Self-hosted Umami

For your own Umami instance, add `scriptUrl` with the full HTTPS script URL from your tracking code:

```json
"integrations": {
  "umami": {
    "websiteId": "00000000-0000-4000-8000-000000000000",
    "scriptUrl": "https://stats.kilnworks.example/script.js"
  }
}
```

If your tracking code sets `data-host-url` because events go to a different endpoint, add it as `hostUrl` too.

## Files

```text
blog.json          settings: name, logo, colors, fonts, authors, Umami integration
blog/              one .mdx file per post
changelog/         one .mdx file per release
public/images/     logo and favicon
```
