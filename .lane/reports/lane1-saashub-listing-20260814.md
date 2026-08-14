# Lane 1 evidence — 2026-08-14: SaaSHub alternatives-directory listing + decision (packet item cb5bc34efc)

**Verdict: NOT EXECUTED — the SaaSHub venue re-verified live 2026-08-14 and
the standing decision in `ops/launch-venues.md` still binds. The free listing
was not submitted, for the same reason as the prior attempt (2026-08-12): the
fleet venue policy ledger (`agent-state/growth-loop/venue-policy.json`,
updated 2026-08-08) has no saashub.com entry — `automation_disposition:
unknown`, allowlist EMPTY — so `venue-claim claim` exits 4 and the agent must
not drive the submission, including not triggering the `/services/new` crawl
with aiconverter.app's URL. The optional $99/month featured promo is a
recurring spend decision only Nish can make (money boundary; no spend
authorization exists in `agent-state/authorizations/` — only the
sol-xhigh worker grant). The dated decision line (SUBMIT — free listing,
manual by Nish; paid promo deferred) stands as the record the packet asked
for. No venue policy change occurred since 2026-08-12.**

## Live re-verification 2026-08-14 (all credential-free, plain HTTP)

- No duplicate: `GET https://www.saashub.com/list?q=aiconverter` (HTTP 200,
  "Top 20 products relevant to aiconverter", "Showing 20 of 370+ results")
  contains zero aiconverter.app hits (the string `aiconverter` on the page is
  only the query echo); slug probes /aiconverter, /aiconverter-app,
  /ai-converter-app, /aiconverter-alternatives all 404. The unrelated generic
  product "AI converter" (/ai-converter-alternatives, "Not approved", File
  Management / File Converter) is a different tool, not a duplicate.
- Submit page live, HTTP 200: https://www.saashub.com/services/submit —
  "Submit a Product", single Website URL field (form action `/services/new`,
  GET), acceptance rules and submission advice unchanged (add categories,
  list competitors to avoid the bottom-of-queue slowdown, optional domain
  verification with an email on the product's domain; dev agencies, waiting-
  list landing pages, unreleased products, free subdomains, and non-English
  products rejected).
- Paid promo live, HTTP 200: https://www.saashub.com/featured-products —
  "$99 / Month · cancel anytime", "Shown on your competitors' pages and in
  your exact categories", estimated 10–18 targeted referrals/month (FAQ dated
  14 Aug 2026), Stripe checkout, cancel in one click, no contract. Small
  drift vs 2026-08-12 record: "Join **109+** products already featured" (was
  111+ on 2026-08-12) — the recurring monthly promo is otherwise unchanged.
- Category hosted (the reason the listing matters): `q=bank statement to csv`
  returns 1,000+ results including BankScanPro
  (https://www.saashub.com/bankscanpro-alternatives), Bank Statement
  Converter, AI Bank Statement, Bank-Statement-Conversion, Convert My Bank
  Statement, Bank Statement Sheet, Import Bank Statement, and — new in the
  top results this run — ConvertMyStatement AI
  (https://www.saashub.com/convertmystatement-ai-alternatives, "AI-powered
  bank statement converter. Transform PDF to Excel or CSV in seconds."). The
  venue hosts the category; only this product's listing is missing.
- Kit reference pages all live HTTP 200 (2026-08-14): `/`, `/llms.txt`,
  `/bank-statement-pdf-to-csv/`, `/sample-csv/`, `/trust/`, `/formats/`;
  `/pricing/` and `/receipt-to-csv/` still 404 (unchanged; the kit claims
  none of those routes).
- Policy ledger unchanged (re-read 2026-08-14): `venue-policy.json` updated
  2026-08-08; allowlist EMPTY; `reviewed_venues` holds only producthunt.com
  (prohibited), g2.com, capterra.com, getapp.com, alternativeto.net,
  startupsubmit.app (all `unknown`) — saashub.com is in neither list.

## Decision (dated 2026-08-12, re-verified 2026-08-14)

- **SaaSHub: SUBMIT — free listing at
  https://www.saashub.com/services/submit, manual by Nish. The paid promo
  (featured listing at $99/month, recurring) is recorded and deferred to
  Nish's spend call — not required for the free listing.** Kit copy-paste
  ready in `ops/launch-venues.md` (SaaSHub section). Lane attempt
  2026-08-14: NOT EXECUTED (policy guard exit 4; no policy or authorization
  change since 2026-08-12).

## Why the item cannot be closed from a lane (re-verified 2026-08-14)

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
4. The `venue-claim` binary is not installed in the lane environment, but
   the policy JSON is the authoritative guard and is unchanged; this record
   is the honest NOT-EXECUTED lane outcome the packet requires.

## Checks on this lane

- Live HTTP checks for SaaSHub search (no-duplicate), submit page, featured-
  products page, slug probes, and the aiconverter.app kit reference pages
  (2026-08-14) — all as recorded above.
- No code changed; docs only (`ops/launch-venues.md` SaaSHub section updated
  with this run's re-verification, this report).
