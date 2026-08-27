# Live `/api/health` — runtime capability snapshot

`GET /api/health` returns the live D1 / Dodo / Workers AI / Mistral /
CloudConvert / Convertio / Turnstile capability snapshot. The handler
lives at `functions/api/health.js`; it never touches D1 row data, only
binding presence and a `SELECT 1` round-trip.

This endpoint only runs in the Cloudflare Pages Functions runtime, so
the local Vite preview cannot drive it. The harness runs the live
endpoint and writes the JSON to evidence.

## How to drive it

1. `curl -fsS -m 30 https://aiconverter.app/api/health -o /tmp/verify-aiconverter/health.json`
   → expect HTTP 200.
2. The body is JSON. Assert the readiness shape:
   - `ok` is `true` — every required binding is configured.
   - `status` is `"ready"` (any other value, including `"attention"`,
     is a production config gap, not a harness bug).
   - `missing` is `[]`.
   - `capabilities.storage` is `true`.
   - `capabilities.database` is `"ready"` (the value is a string, not
     a boolean — see `functions/api/health.js`).
   - `capabilities.dodo.apiConfigured` is `true`.
   - `capabilities.dodo.webhookConfigured` is `true`.
   - `capabilities.dodo.products.starter`, `.batch`, `.pro` are all
     `true` (the three plan IDs from `src/data/converters.json`).
   - `capabilities.ai.workersAi` is `true` and the rest of the AI
     object reports the providers that are actually configured.

```bash
curl -fsS -m 30 https://aiconverter.app/api/health -o /tmp/verify-aiconverter/health.json
jq -e '.ok == true and .status == "ready" and (.missing | length) == 0' \
  /tmp/verify-aiconverter/health.json
jq -e '.capabilities.dodo.products.starter and .capabilities.dodo.products.batch and .capabilities.dodo.products.pro' \
  /tmp/verify-aiconverter/health.json
```

A `404` or `405` from `/api/health` is the wrong endpoint — `POST`
returns `405 Method Not Allowed` (see `onRequestPost` in
`functions/api/health.js`), only `GET` is the real shape.

## What proves success

- HTTP 200, body is JSON.
- `.ok == true`, `.status == "ready"`, `.missing == []`.
- `.capabilities.dodo.products` is `{ starter: true, batch: true, pro: true }`.
- The endpoint is anonymous and rate-limited at the edge; one drive
  per harness run is enough. Repeating it is a load test, not proof.
