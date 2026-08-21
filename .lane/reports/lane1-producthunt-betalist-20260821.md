# Lane 1 report — Product Hunt + BetaList (2026-08-21)

Packet item 7133745c8e: "List the product on Product Hunt and record a
submit-or-decline decision for BetaList — baseline launch venue never live".
Re-dispatch of the item previously run on 2026-08-14, 2026-08-15 and
2026-08-20.

## Outcome: NOT EXECUTED for both venues (policy-blocked / paid-only); decisions re-confirmed; venue guard verified LIVE for the first time

- **Product Hunt — submit declined by the fleet (NEEDS_NISH_STEP).**
  `venue-policy.json` (re-read 2026-08-21; still updated 2026-08-08, within
  the 90-day freshness window) marks `producthunt.com`
  `automation_disposition: prohibited`; allowlist empty. The `venue-claim`
  binary **is now installed** (prior runs recorded it absent), so this run
  verified the gate live:
  - `venue-claim claim producthunt.com aiconverter-app …` → **exit 4**,
    "ALLOWLIST/POLICY BLOCK … route to NEEDS-NISH/manual, never bypass";
    no ledger record created (`venue-claim list`: zero aiconverter records
    before and after).
  - Contract consequence: blocked exit = NO browser work. Publishing stays a
    human account action with Nish. Manual kit in `ops/launch-venues.md`
    remains copy-paste ready.
- **BetaList — DECLINE (SKIPPED_PAID, re-verified 2026-08-21).**
  - `venue-claim claim betalist.com aiconverter-app …` → **exit 4**, "unknown
    (not allowlisted, not reviewed)"; no ledger record created.
  - Support page re-fetched live 2026-08-21 (HTTP 200): "All submissions are
    paid. There is no free submission option."; FAQ verbatim "No. BetaList
    used to offer free submissions, but all submissions now require payment."
    Eligibility unchanged (own-domain rule).
  - The fleet declines the paid submission — spend decisions stay with Nish.
    No spend authorization exists in `agent-state/authorizations/` (still
    only the sol-xhigh worker grant, expired 2026-08-14).

## Live evidence (2026-08-21, credential-free)

| Check | Result |
| --- | --- |
| PH search `q=aiconverter` (plain HTTP) | HTTP 403 — Cloudflare bot wall, same as 2026-08-14/15/20; no JS renderer in this lane run, so the prior Camoufox finding ("no aiconverter.app result") carries forward |
| Wayback availability API, PH `/products/{aiconverter,ai-converter,aiconverter-app}` | zero archived snapshots for all three slugs |
| Wayback CDX domain query, any PH URL containing `aiconverter` | zero results |
| BetaList search `q=aiconverter` | HTTP 200, "No results found for aiconverter" |
| BetaList `/support` | HTTP 200, paid-only statements verbatim unchanged |
| BetaList `/submit` | HTTP 200, account-gated form (unchanged from 2026-08-20) |
| Kit pages `/`, `/llms.txt`, `/bank-statement-pdf-to-csv/`, `/sample-csv/`, `/trust/`, `/formats/` | all HTTP 200 |
| `/pricing/` | still 404 (regression first noted 2026-08-20, unchanged) |
| `/receipt-to-csv/` | still 404 (never claimed by kits) |

## Why the listing is not live

1. Product Hunt prohibits automated access (`prohibited`, verified exit-4 live
   this run); the launch flow is account-gated — only Nish can publish.
2. BetaList has no free submission path at all (paid-only), and paid spend is
   a Nish-only decision.

Unblock: Nish submits manually via the kits in `ops/launch-venues.md`
(Product Hunt: choose/confirm launch date and publish; BetaList: decide
whether to pay). After each submission update the doc with the public URL and
flip the status line to live.

## Files changed

- `ops/launch-venues.md` — appended the 2026-08-21 fleet-lane-attempt section
  to the Product Hunt block (covers both venues), updated the header
  verification line.
- `.lane/reports/lane1-producthunt-betalist-20260821.md` — this lane report.
