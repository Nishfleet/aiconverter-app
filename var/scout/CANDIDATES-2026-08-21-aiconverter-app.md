# Scout candidates — aiconverter-app — 2026-08-21T02:32:22.659Z

Workspace: /home/nish/workspaces/products/aiconverter-app
HEAD: 07ad709 ci: add Cloudflare Pages deploy lane so main reaches aiconverter.app
Repo: nish3451/aiconverter-app

## Product workspace audit

Product: AI Converter (aiconverter.app) — preview-first file conversion with paid AI extraction.

### Current revenue state

- **Pre-revenue**: zero paid customers, zero real-card drill proof (the ₹299 operator drill refund was written off 2026-08-10).
- **Pricing live**: ₹399/25 pages (Starter), ₹799/100 (Standard), ₹1,399/500 (Bulk) — INR one-time packs.
- **Checkout flow implemented**: Dodo Payments integration, signed webhook validation, paid finalize/download, batch checkout, refund drills, failover drills.
- **Deploy blocked**: `lane1/deploy-workflow-20260820` stalled on Cloudflare API token/account ID secrets. All code improvements on main are stranded.
- **FREE_DOWNLOADS_ENABLED=false** in production (per `/api/health`).
- **Dodo wallet: underfunded** — ₹299 drill refund unreachable, written off.
- **MERCHANT_NOT_LIVE** error path exists in checkout.js — suggests Dodo live payments may not be activated for this merchant.

### Key revenue-blocking items (urgent)

1. **Deploy pipeline blocked** — No Cloudflare API token/account ID in GitHub secrets. PR #135 stalled. Without deploy, every merged improvement (stale-dodo-event fix, landing intent preselect) is dead code. **Revenue impact**: blocks all live changes that drive conversion. **Evidence**: `.github/workflows/deploy.yml` requires `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`; `AGENTS.md` confirms these secrets are required and the lane fails closed without them. Path to unblock: `gh secret set CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`.

2. **No real paid card drill completed** — README explicitly states: "A real paid card/webhook/finalize/download drill is still required before scaling paid traffic." The ₹299 drill (2026-05-18) proved the checkout webhook → paid finalize → download legs, but the cash refund leg was written off. **Revenue impact**: cannot confidently take paying customers' money without proof the full paid path works end-to-end. **Evidence**: `README.md` product truth section, `ops/refund-writeoffs.md` decision 2026-08-10, `scripts/paid-drill-live.mjs`.

3. **Zero paid customers** — No organic acquisition, no paid path proven in production. Product is pre-revenue. **Revenue impact**: $0 revenue. **Evidence**: `README.md` ("One successful real-card drill through checkout, webhook, paid finalize, download, redo, and cash refund still needs operator proof"), no active paid jobs in any logs.

4. **SERP absence for core phrase** — aiconverter.app is Google-indexed but absent from page 1 for "bank statement pdf to csv converter". Page 1 is 100% free-positioned organic. Product's positioning is paid-quality wedge (decided 2026-08-14) but cannot enter SERP without a free anchor. **Revenue impact**: zero organic acquisition for the product's flagship conversion type. **Evidence**: `ops/serp-wedge-evidence.md` snapshots 2026-08-09 and 2026-08-14 (re-verified). aiconverter.app indexed but absent; free anchor question unresolved.

5. **Five observed customer trials not started** — Scout item from customer-trials: recruit 5 bookkeepers/SMB operators, grant free full export via per-job `paid_at` UPDATE in D1. Sessions require Nish's human network + observer presence. Without trials, product-market fit is untested. **Revenue impact**: cannot optimize conversion funnel or pricing without observed user behavior. **Evidence**: `ops/customer-trials.md` verdict 2026-08-11, trial kit prepared, free-export grant path verified.

---

## Revenue-ranked survivors (max 5, cited evidence)

### Survivor 1: Deploy pipeline unblock
**Slug tag:** [aiconverter-deploy-secrets]
**Revenue impact:** CRITICAL — blocks ALL live changes including checkout fix, pricing improvements, and any revenue-driving code. Every merged PR is dead code until deploy works.
**Evidence:**
- `.github/workflows/deploy.yml` — requires `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` secrets
- `AGENTS.md` — "Required repo secrets (the lane fails closed and red until both exist)"
- Commit 07ad709 "ci: add Cloudflare Pages deploy lane so main reaches aiconverter.app" — the deploy workflow was added but is non-functional without secrets
- Active branches (landing-intent-preselect, stale-unmatched-dodo-event) merged to main but never deployed
**Action:** Provision Cloudflare API token with Pages:Edit scope, set both secrets via `gh secret set`, trigger deploy. Needs Nish (API token creation at Cloudflare dashboard).

### Survivor 2: Real paid card drill completion
**Slug tag:** [aiconverter-paid-drill]
**Revenue impact:** CRITICAL — cannot take paying customers' money without end-to-end proof. The ₹299 drill proved the flow but the refund leg was written off; operator confidence is the blocker.
**Evidence:**
- `README.md` — "One successful real-card drill through checkout, webhook, paid finalize, download, redo, and cash refund still needs operator proof before scaling paid traffic."
- `ops/refund-writeoffs.md` — ₹299 drill refund written off 2026-08-10 after five failed Dodo wallet attempts
- `scripts/paid-drill-live.mjs` — drill script exists
**Action:** Fund Dodo wallet (~₹500), run `npm run drill:paid` from an environment with Dodo secrets. Needs Nish (Dodo wallet top-up, operator approval).

### Survivor 3: Customer trials (5 observed sessions)
**Slug tag:** [aiconverter-customer-trials]
**Revenue impact:** HIGH — first revenue signal is impossible without observing real users. Pricing validation, funnel optimization, and conversion rate data come from these sessions.
**Evidence:**
- `ops/customer-trials.md` — full trial kit prepared 2026-08-11, free export grant verified (Option A: per-job `paid_at` UPDATE in D1)
- Tests: `tests/download-gate.test.mjs` locks free-download semantics
- README: customer-facing claims (free preview, fail-closed extraction, private storage) all live
**Action:** Recruit 5 bookkeepers/SMB operators via Nish's network, observe sessions, grant per-job free exports. Needs Nish (human network, observer presence, consent).

### Survivor 4: SERP free anchor positioning
**Slug tag:** [aiconverter-serp-wedge]
**Revenue impact:** HIGH — zero organic acquisition for the core phrase. The paid-quality wedge decision (2026-08-14) needs execution: either offer a free full-conversion anchor (e.g., first 5 pages free) or differentiate on trust/quality hard enough to rank against free-positioned competitors.
**Evidence:**
- `ops/serp-wedge-evidence.md` — two live snapshots (2026-08-09, 2026-08-14) confirm aiconverter.app indexed but absent from page 1; 100% free-positioned organic
- Page-1 competitors: bankstatementconverter.com, founderpath.com, bankstatementconverters.ai, zamzar.com — all free-positioned
- AI Overview cites DocuClipper, Smallpdf, Tabula — never aiconverter.app
- Eg: `site:aiconverter.app bank statement` returns 10 indexed pages but none rank
**Action:** Implement free anchor (e.g., first 5 pages of every job free), or build trust/authority signals. Requires code change + deploy.

### Survivor 5: Dodo MERCHANT_NOT_LIVE status
**Slug tag:** [aiconverter-dodo-live]
**Revenue impact:** MEDIUM — if Dodo live payments are not activated, the checkout flow returns `MERCHANT_NOT_LIVE` errors. The error handler exists but produces a 503; users see "Dodo live payments are not enabled for this merchant yet."
**Evidence:**
- `functions/api/checkout.js:51-54` — `error?.code === "MERCHANT_NOT_LIVE"` error path returns a descriptive 503 with the message
- `functions/api/checkout.js:44-47` — Dodo checkout creation catches errors and checks for this code
- README: Dodo Payments listed as payment provider but no confirmation of live activation
- `ops/pricing-strategy.md` — Dodo pricing referenced (4% + $0.40 domestic card fee)
**Action:** Verify Dodo merchant is live (Dodo dashboard), or remove the MERCHANT_NOT_LIVE guard if already live. Needs Nish (Dodo dashboard access).

---

## Items needing Nish (pricing, brand, legal, delete)

These go to `var/scout/NEEDS-NISH.md`.

---

## Market-signal: competitor moves & pricing shifts

### Known competitor landscape (from ops/pricing-strategy.md, verified 2026-05-12)

- **BankParse**: $19/month for 500 pages — subscription model (aiconverter is one-time packs)
- **BankStatementConverter.org**: $29/month for 400 pages — subscription
- **Bank-statement-conversion.com**: $0.10-$0.20/page subscription tiers; $0.50/page pay-as-you-go
- **DocuClipper**: Paid ad slot on core-phrase SERP (2026-08-09 snapshot)

### Venue-listed competitors (from ops/launch-venues.md, verified 2026-08-10/11/14/15/16/17)

- **LedgerBox** — live on Product Hunt, Toolify.ai, and the core-category tag pages (listed 2023-11-11 on Toolify)
- **Bank Statement Engine** — free tier (10 pages/day anonymous, unlimited free registered) on WeLikeTools (published 2026-07-12)
- **Rocket Statements** — paid tool on Toolbit.ai ($20+), 4.8K monthly visits
- **StatementSheet** — paid from $20, 9.5K monthly visits, on both Toolbit.ai and Uneed.best
- **BankConv** — free-positioned on Uneed.best (launch records incl. 2026-08-08)
- **PdfBuddy** — listed on Uneed.best (launch records incl. 2026-08-09)
- **BankScanPro** — listed on Uneed.best (launch records incl. 2026-05-22)
- **Bank PDF Converter** — listed on Uneed.best (launched 2024-06-27)
- **Convert My Bank Statement**, **Docsumo** — live on Product Hunt in the bank-statement-category
- **BankStatementWizard** — organic slot on core-phrase SERP (2026-08-14)
- **Razor Extract** — organic slot on core-phrase SERP (2026-08-14)
- **Statement Convert** — organic slot on core-phrase SERP (2026-08-14)

### New competitor moves detected (since last scout scan)

1. **Bank Statement Engine free tier expanded** — WeLikeTools listing (2026-07-12) shows free anonymous use (10 pages/day) and free registered unlimited. This is the cheapest competitor entry point for price-sensitive users. **Pricing shift risk**: high — if Bank Statement Engine keeps improving quality, aiconverter's paid wedge becomes harder to justify.
2. **Rocket Statements moved slugs** — `/ai-tool/rocket-statements` → `/ai-tool/rocketstatements` (detected 2026-08-11). Product is actively maintained and iterating on its directory presence.
3. **BankConv active launch on Uneed** — launch records show active 2026-08-08 activity. New competitor entries continue.
4. **PdfBuddy active launch on Uneed** — launch records show active 2026-08-09 activity. Fresh competitor.
5. **LedgerBox dominates the tag pages** — sole featured tool on Toolify.ai "Best ai tools for Bank Statement to CSV" (updated 2026-08-11). This is the strongest positioned competitor across directories.

### Pricing shift risk

AI Converter's pricing (₹399/25=$4.77, ₹799/100=$9.55, ₹1,399/500=$16.72 at ~₹83.6/USD) is significantly below all known competitors. This is both a wedge advantage and a risk:
- **Advantage**: price-sensitive users may convert more easily
- **Risk**: per-page margins are thin (worst-case Mistral OCR at 500 pages = ~$1.00-$1.50; ₹1,399 ≈ $16.72; gross margin ~90% before Dodo fees, refunds, support)
- **Risk**: if competitors drop prices (e.g., Bank Statement Engine's free unlimited), the wedge narrows

---

## INBOX lines (survivors appended)

Each survivor is appended as an INBOX line with `priority=revenue` and the original slug tag.

- [2026-08-21] priority=revenue [aiconverter-deploy-secrets]: provision Cloudflare API token + account ID in GitHub secrets so the deploy workflow functions; all merged code is stranded until deploy works.
- [2026-08-21] priority=revenue [aiconverter-paid-drill]: complete one end-to-end real-card drill (checkout → webhook → paid finalize → download → redo → cash refund) to prove the paid path works before taking customer money.
- [2026-08-21] priority=revenue [aiconverter-customer-trials]: recruit 5 intent-matched bookkeepers/SMB operators, observe them using the product, and grant free full export via per-job D1 paid_at UPDATE.
- [2026-08-21] priority=revenue [aiconverter-serp-wedge]: implement a free anchor or trust/quality differentiation to enter core-phrase SERP page 1; product is indexed but absent from the 100% free-positioned organic results.
- [2026-08-21] priority=revenue [aiconverter-dodo-live]: verify Dodo merchant live status and either remove the MERCHANT_NOT_LIVE guard or activate live payments.

---
