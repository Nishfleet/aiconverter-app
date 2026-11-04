# Bank-statement and other SEO landing pages

Long-tail SEO pages that pre-select a converter in the workspace and
pre-fill the output format. Each is a real pre-rendered HTML page in
`dist/<route>/index.html` and links back to the converter with a
`?converter=…&output=…` query that the React app's
`converterIntentFromUrl()` reads on load.

## How users reach it

Open any of these URLs at `https://aiconverter.app/<route>/` (or
`http://127.0.0.1:4180/<route>/` for the local harness):

| Route | Pre-selects | `<h1>` in the pre-rendered HTML |
| --- | --- | --- |
| `/bank-statement-pdf-to-csv/` | `bank` / `csv` | `Turn bank statement PDFs into spreadsheet-ready CSV.` |
| `/convert-bank-statement-to-csv/` | `bank` / `csv` | `From statement PDF to rows you can actually inspect.` |
| `/credit-card-statement-pdf-to-csv/` | `bank` / `csv` | `Extract credit card statement rows into a reviewable CSV.` |
| `/scanned-bank-statement-to-excel/` | `bank` / `csv` | `Turn scanned bank statements into rows you can open in Excel.` |
| `/pdf-bank-statement-to-quickbooks-csv/` | `bank` / `quickbooks-csv` | `Turn bank statement PDFs into CSV rows for QuickBooks cleanup.` |
| `/pdf-bank-statement-to-xero-csv/` | `bank` / `xero-csv` | `Convert bank statement PDFs into CSV rows for Xero review.` |
| `/pdf-bank-statement-to-wave-csv/` | `bank` / `wave-csv` | `Make bank statement PDFs easier to review for Wave.` |
| `/bank-statement-converter-for-bookkeepers/` | `bank` / `csv` | `Convert statement PDFs into rows your team can review.` |
| `/receipt-to-csv/` | `receipt` / `csv` | `Turn receipt photos and PDFs into expense CSV rows.` |
| `/screenshot-to-csv/` | `screenshot` / `csv` | `Turn screenshot tables into spreadsheet-ready CSV.` |

All ten routes are wired in `src/main.jsx`'s
`LANDING_PAGES` regression test (see
`tests/landing-intent-regression.test.mjs`).

## How to drive it (local)

1. `npm ci && npm run build` — emits `dist/<route>/index.html` for each
   of the ten routes.
2. `npx vite preview --host 127.0.0.1 --port 4180 --strictPort`.
3. For each route in the table above:
   - `GET /<route>/` → expect 200.
   - The body must contain the exact `<h1>` string from the table.
   - The body must contain a `?converter=…&output=…` link back to `/`
     so the React workspace can pick up the intent.
   - `rel="canonical"` must be `https://aiconverter.app/<route>/`, not
     the loopback origin.

```bash
ROUTES=(
  "bank-statement-pdf-to-csv"
  "convert-bank-statement-to-csv"
  "credit-card-statement-pdf-to-csv"
  "scanned-bank-statement-to-excel"
  "pdf-bank-statement-to-quickbooks-csv"
  "pdf-bank-statement-to-xero-csv"
  "pdf-bank-statement-to-wave-csv"
  "bank-statement-converter-for-bookkeepers"
  "receipt-to-csv"
  "screenshot-to-csv"
)
for route in "${ROUTES[@]}"; do
  status="$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:4180/${route}/)"
  echo "${route} -> HTTP ${status}"
  if [ "${status}" != "200" ]; then
    echo "FAIL: ${route} returned ${status}, expected 200"
  fi
done
```

## How to drive it (live, for the intent pickup)

1. Open any of the ten live URLs above. The pre-rendered HTML returns
   the SEO copy; the React app's `converterIntentFromUrl()` reads the
   `?converter=…&output=…` query and pre-selects the workspace.
2. Use Playwright to confirm the workspace's `Converter` dropdown shows
   the matched converter and the `Output` dropdown shows the matched
   format. The `funnel-telemetry.test.mjs` regression asserts the
   `page_view` event fires with `intentConverter` and `intentOutput`
   fields, so a regression in this pickup is a real bug.

## What proves success

- All ten routes return HTTP 200.
- The `<h1>` for each route matches the table exactly.
- Each route has a `rel="canonical"` pointing at the live `aiconverter.app`
  origin (never the loopback).
- The `?converter=…&output=…` deep-link is present in the body, and the
  converter + output IDs match the table.
