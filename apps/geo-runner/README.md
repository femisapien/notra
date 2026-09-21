# geo-runner

Effect service that runs one-off GEO scans: one prompt against up to five
models, judged exactly like a scheduled scan (`runGeoCheckAttempt` in
`@notra/geo-core`). Results go to `geo_adhoc_scans`, never to
`geo_mention_checks`, and the project's scheduled-scan claim is not touched.

Deployed on Railway from `apps/geo-runner/Dockerfile` (see `railway.json`).

## Endpoints

All but `/health` and `/ready` need
`Authorization: Bearer $GEO_RUNNER_SECRET`. The secret must be at least 32
characters. Generate one with `openssl rand -hex 32`.

| Route | Purpose |
| --- | --- |
| `GET /health` | Liveness |
| `GET /ready` | Deployment readiness: validates configuration and Postgres |
| `GET /models?organizationId=&projectId=` | Models currently available to the project |
| `POST /scans` | Validate, store, and queue a scan. `202 { id }` |
| `POST /scans/:scanId/run` | Queue a scan another host already stored as `queued` |
| `GET /scans/:scanId?organizationId=&projectId=` | Status and results |

```sh
curl -X POST localhost:3000/scans \
  -H "authorization: Bearer $GEO_RUNNER_SECRET" -H "content-type: application/json" \
  -H "idempotency-key: $(uuidgen)" \
  -d '{"organizationId":"…","projectId":"…","prompt":"best geo tools","engines":["openai/gpt-5.4-mini"],"webSearch":true,"language":"English"}'
```

`Idempotency-Key` is required, scoped to the organization, and may contain up
to 128 characters. Retrying the same request with the same key returns the
original scan; reusing it for a different request returns `409`.

`engines` accepts one to five IDs returned by `GET /models`. `webSearch`
defaults to `true`, and `language` defaults to `English`.

## Environment

`GEO_RUNNER_SECRET`, `DATABASE_URL`, `AI_GATEWAY_API_KEY` (no Vercel OIDC
outside Vercel), `OPENROUTER_API_KEY`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`,
`PERPLEXITY_API_KEY`, `AUTUMN_SECRET_KEY`, `UPSTASH_REDIS_REST_URL`,
`UPSTASH_REDIS_REST_TOKEN`.
