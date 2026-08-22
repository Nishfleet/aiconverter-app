# Lane 1 evidence — 2026-08-22: SaaSHub alternatives-directory listing + decision (packet item cb5bc34efc)

**Verdict: NOT EXECUTED — the SaaSHub venue re-verified live 2026-08-22 and
the standing decision in `ops/launch-venues.md` still binds. The free
listing was not submitted, for the same reason as the prior attempts
(2026-08-12, 2026-08-14, 2026-08-20): the fleet venue policy ledger
(`agent-state/growth-loop/venue-policy.json`, updated 2026-08-08) has no
saashub.com entry — `automation_disposition: unknown`, allowlist EMPTY — so
`venue-claim claim` exits 4 and the agent must not drive the submission,
including not triggering the `/services/new` crawl with aiconverter.app's
URL. The optional $99/month featured promo is a recurring spend decision
only Nish can make (money boundary; no spend authorization exists in
`agent-state/authorizations/`). The dated decision line (SUBMIT — free
listing, manual by Nish; paid promo deferred) stands as the record the
packet asked for. No venue policy change occurred since 2026-08-20.**

## Live re-verification 2026-08-22 (all credential-free, plain HTTP)

- No duplicate: `GET https://www.saashub.com/list?q=aiconverter` (HTTP 200,
  "Top 20 products relevant to *aiconverter*", "Showing 20 of 380+ results")
  contains zero aiconverter.app hits (the string `aiconverter` on the page
  is only the query echo); slug probes /aiconverter, /aiconverter-app,
  /ai-converter-app, /aiconverter-alternatives,
  /aiconverter-app-alternatives, /ai-converter-app-alternatives all 404, and
  /ai-converter 302s to the unrelated generic product "AI converter" (File
  Management / File Converter, marked "Not approved") — a different tool,
  not a duplicate. Result count drift: 380+ now (was 379+ on 2026-08-20).
- Submit page live, HTTP 200: https://www.saashub.com/services/submit —
  "Submit a Product", single Website URL field (form action `/services/new`,
  GET), acceptance rules and submission advice unchanged (add categories,
  list competitors to avoid the bottom-of-queue slowdown, optional domain
  verification with an email on the product's domain; software development
  agencies, waiting-list landing pages, unreleased products, free
  subdomains, and non-English products rejected). The `/services/new` crawl
  was NOT triggered (submit page documented from GET `/services/submit`
  only). The free Startup Directory surface
  (https://www.saashub.com/startups) also remains available.
- Paid promo live, HTTP 200: https://www.saashub.com/featured-products —
  "$99 / Month · cancel anytime", "Shown on your competitors' pages and in
  your exact categories", estimated 11–20 targeted referrals/month (FAQ
  dated 22 Aug 2026; was 10–18 on 2026-08-20), Stripe checkout, cancel in
  one click, no contract. Drift vs 2026-08-20 record: "Join **114+**
  products already featured" (was 110+ on 2026-08-20, 109+ on 2026-08-14,
  111+ on 2026-08-12) — the recurring monthly promo is otherwise unchanged.
  SaaSHub reports 564,000+ page views/month.
- Category hosted (the reason the listing matters): `q=bank statement to csv`
  returns 1,000+ results including BankScanPro
  (https://www.saashub.com/bankscanpro-alternatives), Bank Statement
  Converter, AI Bank Statement, Bank-Statement-Conversion, Convert My Bank
  Statement, Bank Statement Sheet, and Import Bank Statement.
  ConvertMyStatement AI did not appear in this run's top-result HTML (it
  did on 2026-08-20). The venue hosts the category; only this product's
  listing is missing. The `q=aiconverter` category facets confirm exact
  relevant categories exist: Bank Statements (15), Accounting & Finance
  (20), File Converter (47; was 48 on 2026-08-20), PDF Converter (57), OCR
  (41).
- Kit reference pages all live HTTP 200 (2026-08-22): `/`, `/llms.txt`,
  `/bank-statement-pdf-to-csv/`, `/sample-csv/`, `/trust/`, `/formats/`.
  Change vs prior SaaSHub runs: `/pricing/` and `/receipt-to-csv/` are now
  HTTP 200 (real pages — titles "Pricing - AI Converter one-time page packs"
  and "Receipt to Expense CSV - AI Converter"; a non-existent path still
  404s). The SaaSHub kit still claims none of those routes.
- Policy ledger unchanged (re-read 2026-08-22): `venue-policy.json` updated
  2026-08-08; allowlist EMPTY; `reviewed_venues` holds only producthunt.com
  (prohibited), g2.com, capterra.com, getapp.com, alternativeto.net,
  startupsubmit.app (all `unknown`) — saashub.com is in neither list.
  `venue-claim check saashub.com aiconverter-app` printed "policy
  disposition for saashub.com: unknown (not reviewed)". `venue-claim claim`
  was not invoked (it writes the ledger).

## Decision (dated 2026-08-12, re-verified 2026-08-14, 2026-08-20 and 2026-08-22)

- **SaaSHub: SUBMIT — free listing at
  https://www.saashub.com/services/submit, manual by Nish. The paid promo
  (featured listing at $99/month, recurring) is recorded and deferred to
  Nish's spend call — not required for the free listing.** Kit copy-paste
  ready in `ops/launch-venues.md` (SaaSHub section). Lane attempt
  2026-08-22: NOT EXECUTED (policy guard exit 4; no policy or authorization
  change since 2026-08-20).

## Why the item cannot be closed from a lane (re-verified 2026-08-22)

1. `venue-policy.json` allowlist is EMPTY and saashub.com is not in
   `reviewed_venues` either — `automation_disposition: unknown`. Per the
   venue-claim contract, exit 4 blocks ALL browser work, including not
   triggering the `/services/new` crawl with aiconverter.app's URL (the lane
   documented the flow from the public submit page only and did NOT start a
   submission).
2. The optional verification step needs an email address on the product's
   domain (aiconverter.app) — a mailbox decision that stays with Nish.
3. The $99/month featured promo is a recurring spend decision only Nish can
   make; `agent-state/authorizations/` holds only
   `sol-xhigh-worker-grant-20260811.json`, no saashub.com entry.
4. The `venue-claim` binary is installed at `/home/nish/.local/bin/venue-claim`
   in this lane environment (prior SaaSHub reports said it was not). A
   policy-only `check` confirmed disposition unknown; `claim` was not run
   because it writes the ledger. The policy JSON is the authoritative guard
   and is unchanged; this record is the honest NOT-EXECUTED lane outcome the
   packet requires.

## Checks on this lane

- Live HTTP checks for SaaSHub search (no-duplicate), submit page,
  featured-products page, slug probes, category facets, and kit reference
  pages (2026-08-22) — all as recorded above. The `/services/new` crawl was
  not triggered.
- No code changed; docs only (`ops/launch-venues.md` SaaSHub section updated
  with this run's re-verification, this report).
