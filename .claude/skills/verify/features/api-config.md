# Live `/api/config` — public client config

`GET /api/config` returns the public-facing config the React app reads
in `useEffect` on mount: the Turnstile site key, the Dodo payment
provider and mode, and the CloudConvert / Convertio / universalProvider
capability flags. The handler is at `functions/api/config.js`; it is
deliberately public so the SPA can render without a session.

Only the Cloudflare Pages Functions runtime serves this endpoint — the
local Vite preview returns the SPA HTML on `/api/config`, not the JSON.
The harness drives the live endpoint.

## How to drive it

1. `curl -fsS -m 30 https://aiconverter.app/api/config -o /tmp/verify-aiconverter/config.json`
   → expect HTTP 200.
2. The body is JSON. Assert:
   - `turnstileSiteKey` is a non-empty string (the Turnstile site key
     is public; its presence is the proof the Turnstile widget will
     render when one is configured).
   - `payments.provider` is `"dodo"`.
   - `payments.mode` is `"live"` or `"test"` (a string; the value is
     derived from `DODO_ENVIRONMENT` / `DODO_MODE` in
     `functions/api/config.js`).
   - `capabilities.cloudConvert`, `.convertioBackup`, and
     `.universalProvider` are booleans. `universalProvider` is true
     when at least one of `cloudConvert` or `convertioBackup` is true.

```bash
curl -fsS -m 30 https://aiconverter.app/api/config -o /tmp/verify-aiconverter/config.json
jq -e '.turnstileSiteKey | length > 0' /tmp/verify-aiconverter/config.json
jq -e '.payments.provider == "dodo"' /tmp/verify-aiconverter/config.json
jq -e '.payments.mode | type == "string"' /tmp/verify-aiconverter/config.json
jq -e '.capabilities.universalProvider == (.capabilities.cloudConvert or .capabilities.convertioBackup)' \
  /tmp/verify-aiconverter/config.json
```

A `405` from `POST /api/config` is the wrong method — only `GET` is
the real shape (the `onRequestPost` handler in `functions/api/config.js`
returns `405 Method Not Allowed`).

## What proves success

- HTTP 200, body is JSON.
- `turnstileSiteKey` is a non-empty string.
- `payments.provider == "dodo"`.
- `payments.mode` is `"live"` or `"test"`.
- The `capabilities.universalProvider` invariant above holds.
- The endpoint is anonymous; one drive per harness run is enough.
