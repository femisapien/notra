To install dependencies:
```sh
bun install
```

To run:
```sh
bun run dev
```

open the local URL Bun prints on startup

The dev server runs with Bun so the `fetch` export is actually served.

## GEO routes

Public GEO HTTP handlers live under `src/routes/geo-*.ts`. They should stay thin:
OpenAPI wiring plus `runGeoEffect` or the remote helpers in `src/runtime/geo-remote.ts`.

Execution surfaces are documented in `src/runtime/geo.ts`:

- **Local** (`runGeoEffect`) — database reads/writes, workflow starters, entitlement checks on the API host via `geoCoreApiLayer`.
- **Remote** (`runRemoteGeoEffect` / `runConfiguredRemoteGeoEffect`) — paid synchronous work that only the dashboard can run (brief planning, sequence runs). Remote timeouts map to **409** with a no-retry message so clients do not double-bill in-flight work.

`geo-briefs.ts` and `geo-sequences.ts` are the only route modules that call the remote helpers; everything else uses `runGeoEffect` only.
