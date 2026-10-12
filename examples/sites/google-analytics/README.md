# Google Analytics

A blog and changelog for a fictional freight booking service, Harborline, that sends every visit to Google Analytics 4.

- **Live:** https://harborline-ga4.notra.site
- **Setup:** `integrations.ga4.measurementId` in `blog.json`, or **Integrations → Add Google Analytics 4** in the dashboard
- **Shows:** Google Analytics 4 without a script tag, a dismissible banner, a `wash` hero with an eyebrow, grid blog with cover images and reading time, page background colors, timeline changelog
- **Docs:** [Google Analytics 4](https://usenotra.com/docs/sites/integrations/analytics/google-analytics), [Analytics integrations](https://usenotra.com/docs/sites/integrations/analytics/overview)

## The Measurement ID

`G-XXXXXXXXXX` in `blog.json` is a placeholder. It passes validation, so the site builds, but Google drops events for a property that doesn't exist. Replace it with the **Measurement ID** of your own web stream (**Admin → Data streams** in Google Analytics). It starts with `G-`. A Universal Analytics `UA-` ID or an API secret is rejected by the build.

```json
"integrations": {
  "ga4": { "measurementId": "G-XXXXXXXXXX" }
}
```

## What Notra does for you

- Loads Google's `gtag.js` and configures your Measurement ID on every page. Don't add another Google tag in `script.js` or a slot, or visits count twice.
- Adds Google's script and collection hosts to the site's Content-Security-Policy. You don't need `security.allowedOrigins` for GA4.
- Runs the script only on the live production site, after the change is published and deployed. PR previews, branch previews and local development never load it, so test on the live URL with [Google Tag Assistant](https://tagassistant.google.com/).

## Use it

1. Copy this folder into your repository and put your Measurement ID in `blog.json`.
2. In Notra, open **Sites → New site**, pick the repository and, if the folder isn't at the root, turn on **Site is in a subdirectory** and enter its path.
3. Wait for the production deployment, open the live site and check **Reports → Realtime** in Google Analytics.

## Files

```text
blog.json          settings: name, logo, colors, banner, hero, authors, GA4 integration
blog/              one .mdx file per post
changelog/         one .mdx file per release
public/images/     logo, favicon and cover images
```
