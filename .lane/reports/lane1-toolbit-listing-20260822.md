# Lane 1 evidence — 2026-08-22: Toolbit.ai listing + paid/verified decision (packet item c9b3592b7b, re-dispatch)

**Verdict: NOT EXECUTED — the Toolbit.ai venue re-verified live 2026-08-22 and the standing decision in `ops/launch-venues.md` still binds. The free community listing was not submitted: `agent-state/growth-loop/venue-policy.json` (updated 2026-08-08) has an empty `allowlist` and `toolbit.ai` is not in `reviewed_venues`, so `venue-claim claim` exits 4 and the agent must not drive a browser submission. The free flow is a human account action (sign-in wall at `/submit/tool?plan=free`) whose verification step (embedding the Launch Badge) is account-gated, and the Toolbit ToS still prohibits robot/spider/automated access. The paid $29 Launch Tool/One-time is a Nish-only spend decision and no authorization exists. The listing is not live (the `/ai-tool/ai-converter` slug is still a soft-404 and the search response contains no `aiconverter.app` result).**

## Live re-verification 2026-08-22

(all credential-free, plain HTTPS GETs from the VPS; `toolbit.ai` apex still 301s to `https://www.toolbit.ai/...`; the `www.` host serves curl without a Cloudflare challenge)

- `venue-claim claim` policy guard:
  - command: `venue-claim claim toolbit.ai aiconverter-app --account 'nish+toolbit@aiconverter.app' --policy-date '2026-08-22' --policy-url 'https://www.toolbit.ai/terms-and-conditions' --copy 'AI Converter — Bank statement PDFs to CSV you can review before paying. https://aiconverter.app' --evidence-path '.lane/reports/lane1-toolbit-listing-20260822.md' --removal-route 'https://www.toolbit.ai/contact' --verification-state pending`
  - observed output: exit code `4`; stderr: `ERROR: ALLOWLIST/POLICY BLOCK: venue toolbit.ai is unknown (not allowlisted, not reviewed). No current official policy evidence permits automated action. Route to NEEDS-NISH/research.`
- No duplicate / not listed:
  - site search `q=aiconverter` (`https://www.toolbit.ai/search?q=aiconverter`, HTTP 200) returns no `aiconverter.app` listing. The response contains zero occurrences of `aiconverter.app`.
  - `https://www.toolbit.ai/ai-tool/ai-converter` (HTTP 200) still serves the soft-404 page with title `Page Not Found - 404 Error | Toolbit.ai`.
- Exact-category competitors still live, HTTP 200:
  - StatementSheet (`https://www.toolbit.ai/ai-tool/statementsheet`, live tags: accounting-automation, excel, ocr).
  - Rocket Statements (`https://www.toolbit.ai/ai-tool/rocketstatements`, live tags: accounting, data-extraction, finance, ocr).
  - The product matches the categories: Data Extraction, OCR, Accounting, Finance, Accounting Automation, Excel.
- Submit center live, HTTP 200: `https://www.toolbit.ai/submit` still advertises the free community listing ("Launch Tool $0 / Forever") and the paid **Launch Tool $29 / One-time** plan.
- `/submit/tool?plan=free` (HTTP 200, final URL `https://www.toolbit.ai/login?redirect=%2Fsubmit%2Ftool%3Fplan%3Dfree`) still renders the sign-in wall with title `Sign In - Toolbit.ai` and a Google OAuth option. The free flow is account-gated and not automatable.
- `/launch-badge` (HTTP 404) is still not a public route — the badge snippet is account-gated and revealed only in the submission flow.
- ToS (`https://www.toolbit.ai/terms-and-conditions`, HTTP 200) still contains clause 0.2: "Use any robot, spider, or other automatic device, process, or means to access Service for any purpose, including monitoring or copying any of the material on Service."
- Kit reference pages all live HTTP 200 (2026-08-22): `https://aiconverter.app/`, `/llms.txt`, `/bank-statement-pdf-to-csv/`, `/sample-csv/`, `/trust/`, `/formats/`. Note: `/pricing/` and `/receipt-to-csv/` now also return HTTP 200, a change from the 2026-08-20 observation, with titles `Pricing - AI Converter one-time page packs` and `Receipt to Expense CSV - AI Converter`.

## Decision (dated 2026-08-10, re-verified 2026-08-22)

- **Toolbit.ai: SUBMIT — free community listing first ("Launch Tool $0 / Forever"), manual by Nish. The paid Launch Tool $29 / One-time is recorded and deferred to Nish's spend call.** The free listing's "verified" step — embedding Toolbit's Launch Badge snippet on aiconverter.app — is a follow-up owner action that needs a tiny deploy once Nish has the snippet from the submission flow. The kit in `ops/launch-venues.md` (Toolbit.ai section) remains copy-paste ready.

## Why the item cannot be closed from a lane (re-verified 2026-08-22)

1. `agent-state/growth-loop/venue-policy.json` has an empty `allowlist` and `toolbit.ai` is not in `reviewed_venues` — `automation_disposition: unknown`. Per the `venue-claim` contract, exit 4 blocks all browser work on this venue.
2. The free flow is a human account action (sign-in wall with Google OAuth) and the free listing's verification step (embedding the Launch Badge) is account-gated.
3. The paid Launch Tool $29 / One-time is a spend decision only Nish can make; `agent-state/authorizations/` has no toolbit.ai entry.
4. Toolbit ToS clause 0.2 still prohibits robot/spider/automated access.

## Checks on this lane

- Live HTTPS checks for Toolbit.ai search, `/ai-tool/ai-converter` soft-404, competitor pages, submit center, free-plan sign-in wall, ToS clause, badge route, and aiconverter.app kit reference pages — all as recorded above.
- No product code changed; docs only (this lane report).
