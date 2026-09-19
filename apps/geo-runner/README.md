# geo-runner

Effect service that runs one-off GEO scans: one prompt against up to five
models, judged exactly like a scheduled scan (`runGeoCheckAttempt` in
`@notra/geo-core`). Results go to `geo_adhoc_scans`, never to
`geo_mention_checks`, and the project's scheduled-scan claim is not touched.

Deployed on Railway from `apps/geo-runner/Dockerfile` (see `railway.json`).

## Endpoints

All but `/health` need `Authorization: Bearer $GEO_RUNNER_SECRET`.

| Route | Purpose |
| --- | --- |
| `GET /health` | Liveness |
| `POST /scans` | Validate, store, and queue a scan. `202 { id }` |
| `POST /scans/:scanId/run` | Queue a scan another host already stored as `queued` |
| `GET /scans/:scanId?organizationId=&projectId=` | Status and results |

```sh
curl -X POST localhost:3000/scans \
  -H "authorization: Bearer $GEO_RUNNER_SECRET" -H "content-type: application/json" \
  -d '{"organizationId":"…","projectId":"…","prompt":"best geo tools","engines":["openai/gpt-5.4-mini"]}'
```

## Environment

`GEO_RUNNER_SECRET`, `DATABASE_URL`, `AI_GATEWAY_API_KEY` (no Vercel OIDC
outside Vercel), `OPENROUTER_API_KEY`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`,
`PERPLEXITY_API_KEY`, `AUTUMN_SECRET_KEY`, `UPSTASH_REDIS_REST_URL`,
`UPSTASH_REDIS_REST_TOKEN`.
