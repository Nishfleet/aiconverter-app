# TinyLaunch listing decision — aiconverter.app — 2026-08-23

## Decision

SUBMIT — manual submission by Nish (free tier, email-OTP account). Free launch
slots are bookable (`GET /api/v1/launch-dates` returns earliest free window
2026-09-21 with `bookable_free: true`); submission requires email-OTP account
creation that the lane cannot perform.

## Paid/free disposition

Free tier is available: earliest bookable free launch date is **2026-09-21**
(100 slots, `bookable_free: true`, `premium_only: false` as of 2026-08-23).
Dates 2026-08-24 through 2026-09-14 are full and `premium_only: true`.
Premium/paid launch windows were not pursued — no TinyLaunch spend authorization
exists in `agent-state/authorizations/` and no TinyLaunch entry exists in any
dispatch ledger. The email-OTP account step is Nish-reserved.

## Exact-category peers

All three peers are bank-statement-PDF-to-spreadsheet tools launched on
TinyLaunch within the last 30 days (verified live HTTP 200 on 2026-08-23).

1. Bank Statement Engine — `https://www.tinylaunch.com/launch/16986-bank-statement-engine` (HTTP 200, launched 2026-07-27)
2. Statement Flow — `https://www.tinylaunch.com/launch/16996-statement-flow` (HTTP 200, launched 2026-07-27)
3. Clearly Ledger — `https://www.tinylaunch.com/launch/17071-clearly-ledger` (HTTP 200, launched 2026-08-03)

Source: `.lane/reports/lane1-tinylaunch-listing-20260823.md` (this run).

## Live verification

Date: 2026-08-23

| Check | Result |
| --- | --- |
| `sitemap.xml` enumeration | 14,732 unique `/launch/` URLs; grep `aiconverter\|ai-converter` returns one false-positive slug (`8592-audio-to-text-ai-converter`); zero aiconverter.app product hits |
| Wayback CDX `urlkey:.*aiconverter.*` | Zero rows |
| Slug probes `/launch/aiconverter`, `/launch/ai-converter`, `/launch/aiconverter-app`, `/launch/ai-converter-app` | All HTTP 404 |
| `GET /search?q=aiconverter` | HTTP 307 → `/login` (dead end; auth-gated) |
| `GET /api/v1/startups` | `{"error":"missing_bearer_token"}` (dead end; Bearer required) |
| `GET /api/v1/launch-dates` | Earliest free slot 2026-09-21 (`bookable_free: true`); 2026-08-24–2026-09-14 `premium_only: true` |
| `GET /api/v1/categories` | Finance & FinTech `id: 5` |
| `GET /llms.txt` | HTTP 200; eight-endpoint agent submission flow documented |
| `venue-claim check tinylaunch.com aiconverter-app` | exit 0; disposition unknown (not reviewed) |
| `venue-claim claim tinylaunch.com aiconverter-app` | exit 2; missing required policy metadata |
| `GET https://aiconverter.app/` | HTTP 200 |
| `GET https://aiconverter.app/llms.txt` | HTTP 200 |
| `GET https://aiconverter.app/bank-statement-pdf-to-csv/` | HTTP 200 |
| `GET https://aiconverter.app/sample-csv/` | HTTP 200 |
| `GET https://aiconverter.app/trust/` | HTTP 200 |
| `GET https://aiconverter.app/formats/` | HTTP 200 |
| Peer pages (all three) | All HTTP 200 |

## Submission record

**Not submitted.** Blocker: tinylaunch.com is unreviewed in the venue policy
ledger (`venue-claim claim` exit 2) and submission requires email-OTP account
creation — Nish-reserved, not attempted. Evidence PR: pending.
