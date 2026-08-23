# Uneed listing decision — aiconverter.app — 2026-08-23

## Decision

Free waiting-line not available; paid skip-the-line declined.

Uneed API (`GET /api/v1/launch-dates`) returns `free_line_closed: true` and `free_next_available: null` as of 2026-08-23. The packet's free waiting-line submit cannot be executed.

## Paid-skip decline

Skip the Waiting Line $29.99, Fast-track $14.99, Relaunch $15, and Uneed Pro $99/year are declined. No Uneed spend authorization exists in agent-state/authorizations/ and no Uneed entry exists in any dispatch ledger.

## Exact-category peers

All five peers are in the Uneed Business category, returned by the public search API as non-premium listings, and were live HTTP 200 on the latest lane re-verify.

1. StatementSheet — `https://www.uneed.best/tool/statementsheet` (HTTP 200)
2. Bank PDF Converter — `https://www.uneed.best/tool/bank-pdf-converter` (HTTP 200)
3. BankConv — `https://www.uneed.best/tool/bankconv` (HTTP 200)
4. PdfBuddy — `https://www.uneed.best/tool/pdfbuddy` (HTTP 200)
5. BankScanPro — `https://www.uneed.best/tool/bankscanpro` (HTTP 200)

Source: `ops/launch-venues.md` § Uneed (lines 2231–2238) and re-verified in `.lane/reports/lane1-uneed-listing-20260820.md`.

## Live verification

Date: 2026-08-23

| Check | Result |
| --- | --- |
| `GET https://www.uneed.best/api/v1/launch-dates` | `free_line_closed: true`, `free_next_available: null`; STWL dates from 2026-08-30 |
| `GET https://mcp.uneed.best/v1/search?q=aiconverter` | No `aiconverter.app` or `AI Converter` in results |
| Slug probes `/tool/ai-converter`, `/tool/aiconverter`, `/tool/ai-converter-app` | All HTTP 404 |
| `GET https://www.uneed.best/launch.txt` | Free queue closed; email-OTP auth required for submission |
| `venue-claim check uneed.best aiconverter-app` | exit 0; disposition unknown (not reviewed) |
| `venue-claim claim uneed.best aiconverter-app` | exit 2; missing required policy metadata |
| `GET https://aiconverter.app/` | HTTP 200 |
| `GET https://aiconverter.app/llms.txt` | HTTP 200 |
| `GET https://aiconverter.app/bank-statement-pdf-to-csv/` | HTTP 200 |
| `GET https://aiconverter.app/sample-csv/` | HTTP 200 |
| `GET https://aiconverter.app/trust/` | HTTP 200 |
| `GET https://aiconverter.app/formats/` | HTTP 200 |
| Peer pages (all five) | All HTTP 200 |

## Submission record

**Not submitted.** Blocker: Uneed free waiting-line is closed (`free_line_closed: true`). Paid skip-the-line options declined per fleet spend policy. Account creation (email-OTP) is Nish-reserved and was not attempted.
