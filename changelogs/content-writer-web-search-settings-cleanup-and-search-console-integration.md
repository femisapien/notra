# Content Writer Web Search, Settings Cleanup, and Search Console Integration

This release adds web search to the content writer agent, giving it a way to pull in current information while drafting. Alongside that, we cleaned up the settings navigation, fixed a dashboard theming issue with brand logos, and added a new integration page for Google Search Console. A handful of smaller fixes round out the update, covering automation scheduling and color handling in Kiwi.

## Highlights

**Web search in the content writer.** The content writer agent now runs live web search mid-draft, pulling in current info instead of leaning solely on its existing context window. Content stays anchored to what's actually happening right now, not just what the agent knew when it started.

**Settings navigation cleanup.** Settings navigation is reorganized into logical groups, and danger zone sections now share a consistent layout across every page. Predictable placement means destructive actions are easier to find and harder to hit by accident.

**Google Search Console integration page.** A new dashboard page connects and manages a Google Search Console integration directly from Notra. It's the foundation for surfacing real search performance data next to the content you publish.

**Dashboard theming fix.** Brand logos in the dashboard now render as themed engine marks instead of static assets, so they automatically match whichever theme is active. No more mismatched logos in light or dark mode.

## More Updates

- Fixed scheduled automations failing when a continuation token was missing.
- Fixed Kiwi to preserve named black colors instead of altering them.
- Unblocked GitHub settings and updated billing so product AI is billed like chat.