# PostHog

A product blog and changelog for a fictional company, Cadence, that sends pageviews to PostHog's EU Cloud.

- **Live:** https://cadence-posthog.notra.site
- **Setup:** the PostHog integration in `blog.json`, with the EU host and session recording turned off
- **Shows:** PostHog analytics via `integrations.posthog`, violet brand color, magazine blog index with a post pinned by path, wash hero, card images, cards changelog
- **Docs:** [PostHog](https://usenotra.com/docs/sites/integrations/analytics/posthog), [Analytics integrations](https://usenotra.com/docs/sites/integrations/analytics/overview), [Layouts](https://usenotra.com/docs/sites/customize/layouts)

```json blog.json
"integrations": {
  "posthog": {
    "apiKey": "phc_REPLACEWITHYOURPROJECTAPIKEY0000",
    "apiHost": "https://eu.i.posthog.com",
    "sessionRecording": false
  }
}
```

The `apiKey` is a placeholder. It has the right format, so the build passes, but no PostHog project will receive its events. Swap in your own key before you rely on the numbers.

## Use it

1. Copy this folder into your repository.
2. In Notra, open **Sites → New site**, pick the repository and, if the folder isn't at the root, turn on **Site is in a subdirectory** and enter its path.
3. Copy your public project API key, which starts with `phc_`, from your PostHog project settings. Don't use a personal API key.
4. Put in your key, either way:
   - **In the repository:** replace `apiKey` in `blog.json`. If your project is on US Cloud, change `apiHost` to `https://us.i.posthog.com` or remove it.
   - **In the dashboard:** open **Integrations**, choose **Edit** in PostHog's options menu, paste the key into **Project API key**, then click **Create PR** and merge it.
5. Wait for the production deployment, open the live site and check **Activity** in PostHog for the pageview.

The PostHog script only runs on the live production site. Drafts, PR previews, branch previews and local development don't load it, so they won't show up in PostHog.

To record sessions too, set `sessionRecording` to `true` and allow your site's domain in the PostHog project settings.

## Files

```text
blog.json          settings: name, logo, colors, navigation, authors, PostHog
blog/              one .mdx file per post
changelog/         one .mdx file per release
public/images/     logo, favicon and cover images
```
