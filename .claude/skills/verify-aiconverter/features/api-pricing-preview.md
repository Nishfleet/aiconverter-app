# Live `/api/pricing-preview` — Dodo adaptive-currency pricing

`GET /api/pricing-preview` returns the localized plan prices Dodo
produces for the caller's country, in the caller's currency when
adaptive checkout pricing is enabled. The React app reads it in a
`useEffect` and replaces the static `₹399 / ₹799 / ₹1,399` strings
on the workspace and the pricing card.

Only the Cloudflare Pages Functions runtime serves this endpoint; the
local Vite preview returns the SPA HTML on `/api/pricing-preview`, not
the JSON. The harness drives the live endpoint.

## How to drive it

1. `curl -fsS -m 30 https://aiconverter.app/api/pricing-preview -o /tmp/verify-aiconverter/pricing.json`
   → expect HTTP 200.
2. The body is JSON. Assert:
   - `available` is `true` (Dodo is configured and adaptive checkout
     pricing answered).
   - `provider` is `"dodo"`.
   - `prices.starter`, `prices.batch`, `prices.pro` are each an object
     with the plan ID matching the key (a self-consistency check the
     harness uses to catch a future plan-ID rename).
   - Each plan has `display` (a non-empty locale string), `amount`
     (a non-zero integer in minor units), and `currency` (a 3-letter
     ISO code).

```bash
curl -fsS -m 30 https://aiconverter.app/api/pricing-preview -o /tmp/verify-aiconverter/pricing.json
jq -e '.available == true and .provider == "dodo"' /tmp/verify-aiconverter/pricing.json
jq -e '.prices.starter.planId == "starter" and .prices.batch.planId == "batch" and .prices.pro.planId == "pro"' \
  /tmp/verify-aiconverter/pricing.json
jq -e '.prices.starter.display | length > 0' /tmp/verify-aiconverter/pricing.json
jq -e '.prices.starter.amount > 0 and (.prices.starter.currency | length == 3)' \
  /tmp/verify-aiconverter/pricing.json
```

The plan IDs (`starter`, `batch`, `pro`) match the IDs in
`src/data/converters.json` (`pricing[].id`). The pricing page
(`/pricing/`) renders the same three keys; a regression that renames a
plan ID will trip both `features/pricing-page.md` and this file, so
the harness catches it on the first run.

## What proves success

- HTTP 200, body is JSON.
- `available == true`, `provider == "dodo"`.
- All three plan IDs are present and self-consistent.
- Every plan has a non-empty `display`, a non-zero `amount`, and a
  3-letter `currency`.
- The endpoint is anonymous; one drive per harness run is enough.
