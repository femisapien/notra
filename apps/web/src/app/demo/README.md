# Public dashboard demo

The marketing `/demo` page embeds the dashboard's public `/demo/geo` route.
Run both apps from the repository root:

```sh
bun run --cwd apps/dashboard dev --port 3002
bun run --cwd apps/web dev
```

Open http://localhost:3001/demo. In production the iframe uses the existing
`APP_URL` (`https://app.usenotra.com`). Deploy both applications together.

## Shared UI

`apps/dashboard/src/components/demo/demo-pages.tsx` imports the original dashboard
page clients. The demo also mounts the original DashboardShell, sidebar, header,
search and settings overlays. There is no separate dashboard stylesheet or replica.
Future changes to these components apply to the demo automatically.

## Data boundary

Fixtures in `apps/dashboard/src/constants/demo` describe an illustrative Neon
workspace. Metrics, posts and model responses are synthetic, not Neon customer
data or actual measurements. The workspace includes 28 days of visibility and
traffic history, 12 prompts across four engines, three personas, content gaps,
source placements, readiness results, 12 posts, social analytics, schedules,
feedback and completed Iris runs. Overview totals derive from the same fixtures
as the charts and detail views. Credentials and notifications remain empty.

The demo has its own query cache and organization snapshot. Its RPC adapter uses
an explicit read allowlist, returns cloned fixtures, and rejects every other
procedure locally. Before dashboard components mount, a fetch boundary supplies
the demo session and blocks live API calls and server actions. The public route
also rejects non-GET/HEAD requests in the proxy. Authenticated routes keep their
normal authentication and authorization.

Only the demo route permits framing by the marketing origins. Other dashboard
routes retain their frame restriction. A later landing-page section can embed
that same dashboard URL in an iframe of the desired size.

The demo supports navigation, filters, tabs and detail dialogs. Saving, generating,
scanning, publishing and connecting accounts are unavailable in this read-only
workspace. It is not a simulation of live AI generation.
