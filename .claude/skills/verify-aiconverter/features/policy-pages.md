# Policy pages — `/privacy/`, `/terms/`, `/refund/`, `/security/`, `/trust/`, `/data-retention/`, `/about/`, `/support/`

Public markdown-first policy and about pages, served as pre-rendered
HTML for crawlers and as the markdown body (`Content-Type:
text/markdown`) when the `Accept` header includes `text/markdown` (see
`functions/_middleware.js`). All eight routes are real, none is a stub.

## How users reach it

Open any of these URLs at `https://aiconverter.app/<route>/` (or
`http://127.0.0.1:4180/<route>/` for the local harness), or follow the
footer link from any other page.

## How to drive it (local)

1. `GET /<route>/` → expect 200 for every route in the table.
2. The body must contain the exact `<h1>` and `<title>` strings from
   the table below.
3. The `rel="canonical"` href must point at the live `aiconverter.app`
   origin (never the loopback).

| Route | `<h1>` |
| --- | --- |
| `/privacy/` | `Your files are handled for the job you start.` |
| `/terms/` | `A conversion tool, not professional advice.` |
| `/refund/` | `Preview first. Redo once. Resolve failures.` |
| `/security/` | `Private by default. Closed when unsure.` |
| `/trust/` | `Private file conversion with visible limits.` |
| `/data-retention/` | `Short windows for sensitive files.` |
| `/about/` | `Private conversion for files that deserve a second look.` |
| `/support/` | `Get help without sending sensitive files.` |

```bash
ROUTES=(
  "privacy"
  "terms"
  "refund"
  "security"
  "trust"
  "data-retention"
  "about"
  "support"
)
for route in "${ROUTES[@]}"; do
  status="$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:4180/${route}/)"
  echo "${route} -> HTTP ${status}"
done
```

## How to drive it (live, for the markdown view)

The `_middleware.js` route returns the markdown body to requests that
ask for it. The harness should NOT depend on this for the local run
(it is exercised at the unit-test level in
`tests/custom-404.test.mjs` and the middleware itself), but a real
crawler-style check is part of the SEO proof:

```bash
curl -fsS -H 'Accept: text/markdown' https://aiconverter.app/privacy/ | head -20
# Expect: front-matter block ending in '---', then '# Your files are handled for the job you start.'
curl -fsS -H 'Accept: text/markdown' https://aiconverter.app/refund/ | head -20
# Expect: '# Preview first. Redo once. Resolve failures.'
```

The 404 markdown handler is exercised separately by
`tests/custom-404.test.mjs`; the harness stays on the eight real
routes above.

## What proves success

- All eight routes return HTTP 200 on the local Vite preview.
- The `<h1>` for each route matches the table exactly.
- `rel="canonical"` is the live `aiconverter.app` origin (not the
  loopback).
- The pre-rendered HTML was emitted by `npm run build` (i.e. it is
  present in `dist/<route>/index.html`), not produced on the fly by
  the Cloudflare middleware — the middleware covers the markdown view
  for crawlers, the static build is what the local harness serves.
