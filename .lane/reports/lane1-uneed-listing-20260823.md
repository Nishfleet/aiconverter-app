# Lane 1 report — Uneed free waiting-line submit (2026-08-23)

## Packet item

12a5d614ce: "List the product on Uneed via free waiting-line submit (record paid skip-the-line decision) — exact-category peers"

## Outcome

**NOT EXECUTED — free waiting-line closed**

Uneed's launch-dates API returns `free_line_closed: true` with `free_next_available: null`. The official Agent Launch Guide (`launch.txt`) states the free queue is closed to new products and `tier: "free"` returns HTTP 400 `free_line_closed`. The packet's free waiting-line submit path is not available. No submission was attempted. Search (`mcp.uneed.best/v1/search?q=aiconverter`) returns no listing for `aiconverter.app` or `AI Converter`. Slug probes `/tool/ai-converter`, `/tool/aiconverter`, `/tool/ai-converter-app` all return HTTP 404.

## Live re-verification

| Check | Command | Result | Interpretation |
| --- | --- | --- | --- |
| Launch dates API | `curl -sSL -L 'https://www.uneed.best/api/v1/launch-dates'` | `{"free_line_closed":true,"free_next_available":null,"free_days_until":null,"stwl_dates":[...]}` | Free waiting-line is closed; only STWL paid dates are bookable. |
| Search API | `curl -sSL 'https://mcp.uneed.best/v1/search?q=aiconverter'` | 10 results (TailConverter, Heic Converter, Bank PDF Converter, …); none match `aiconverter.app` or `AI Converter` | Product is not listed on Uneed. |
| Slug probe | `curl -sSL -o /dev/null -w '%{http_code}' https://www.uneed.best/tool/ai-converter` | HTTP 404 | No listing at this slug. |
| Slug probe | `curl -sSL -o /dev/null -w '%{http_code}' https://www.uneed.best/tool/aiconverter` | HTTP 404 | No listing at this slug. |
| Slug probe | `curl -sSL -o /dev/null -w '%{http_code}' https://www.uneed.best/tool/ai-converter-app` | HTTP 404 | No listing at this slug. |
| Agent Launch Guide | `curl -sSL 'https://www.uneed.best/launch.txt'` | Document states free queue closed; `tier: "free"` returns 400 `free_line_closed`; auth via email OTP required for any submission | Free tier unavailable; account gate also blocks agent submission. |
| Venue-claim check | `venue-claim check uneed.best aiconverter-app` | exit 0; `policy disposition for uneed.best: unknown (not reviewed)` | Pre-flight safe; policy not reviewed. |
| Venue-claim claim | `venue-claim claim uneed.best aiconverter-app` | exit 2; missing required `--account`, `--policy-date`, `--policy-url`, `--evidence-path`, `--removal-route`, `--verification-state` | Claim subcommand requires full policy metadata; no executable allowlist entry for uneed.best. |

## Paid skip-the-line decision

Skip the Waiting Line $29.99, Fast-track $14.99, Relaunch $15, and Uneed Pro $99/year are declined. No Uneed spend authorization exists in agent-state/authorizations/ and no Uneed entry exists in any dispatch ledger.

## Exact-category peers

All five peers are in the Uneed Business category, returned by the public search API as non-premium listings, and were live HTTP 200 on the latest lane re-verify.

1. StatementSheet — `https://www.uneed.best/tool/statementsheet` (HTTP 200)
2. Bank PDF Converter — `https://www.uneed.best/tool/bank-pdf-converter` (HTTP 200)
3. BankConv — `https://www.uneed.best/tool/bankconv` (HTTP 200)
4. PdfBuddy — `https://www.uneed.best/tool/pdfbuddy` (HTTP 200)
5. BankScanPro — `https://www.uneed.best/tool/bankscanpro` (HTTP 200)

Source: `ops/launch-venues.md` § Uneed (lines 2231–2238) and re-verified in `.lane/reports/lane1-uneed-listing-20260820.md`.

## Changes made

- Created `.lane/reports/lane1-uneed-listing-20260823.md` (this file)
- Created `ops/uneed-listing-20260823.md` (durable repo record)
- Branch `lane1-uneed-listing-20260823` pushed; record-only PR opened

## Next action

Human-owned: Nish must decide whether to pursue Uneed via paid STWL ($29.99, soonest date 2026-08-30 per launch-dates API), free "Submit without scheduling" (requires email-OTP account), or defer until the free waiting-line reopens (currently `free_next_available: null`). No agent submission is possible without account creation or paid spend authorization.
