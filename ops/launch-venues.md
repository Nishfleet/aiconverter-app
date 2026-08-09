# Launch Venue Notes

Durable record of launch-venue decisions and submission kits for aiconverter.app.
Live-production claims only: everything below is grounded in live pages and
`/llms.txt` (verified 2026-08-09; SaaSHub section checked 2026-08-10). Automated
submission is blocked for all three venues by the fleet venue policy ledger
(`agent-state/growth-loop/venue-policy.json` and the `venue-claim` guard): Product
Hunt is reviewed as prohibiting automation, BetaList is not yet reviewed, and
SaaSHub is not allowlisted (fleet disposition: ambiguous/manual-only). Account
actions stay with Nish. The kits below make each manual submission a copy-paste job.

## Product Hunt

### Decision (dated 2026-08-09)

- **Outcome: declined for automated submission. Manual kit prepared below.**
- Reason: Product Hunt ToS (reviewed live 2026-08-09 from
  https://www.producthunt.com/legal) prohibit crawling/scraping "through use of
  manual or automated means" and any "processes that run or are activated while
  you are not logged into the Services". Venue policy ledger marks
  `producthunt.com` as `automation_disposition: prohibited`; `venue-claim claim`
  exits 4 (policy block). An account already exists for the fleet
  (`nishant345+producthunt@gmail.com`, plus-address) but submission is a human
  account action.
- Live evidence (2026-08-09): Product Hunt search `q=aiconverter` returns no
  aiconverter.app result (unrelated tools only: Coval, Wingman City Guide, Sibyl
  AI, ...). Exact-category competitors are listed (receipt-ai, ledgerbox), so the
  venue hosts the category — the listing itself is missing.
- Next action: Nish submits manually using the kit below, then this file should
  be updated with the public product URL.

### Manual submission kit (copy-paste ready)

- Name: **AI Converter**
- Tagline (55/60 chars): **Bank statement PDFs to CSV you can review before paying**
- Description (231/260 chars): **Turn bank statement PDFs into spreadsheet-ready
  CSV in your browser. Check sample rows free, then unlock the full extraction
  only when the preview looks right. OCR fallback for scans; low-confidence jobs
  fail closed with no charge.**
- Topics: Artificial Intelligence, Productivity, Finance
- Website: https://aiconverter.app
- First comment (maker story, draft):

  > I built AI Converter because bank statement cleanup was eating my
  > bookkeeping hours. It takes a bank statement PDF, parses it in the browser,
  > and shows you sample rows before you pay anything — you only unlock the full
  > CSV when the preview actually looks right. Scanned statements fall back to
  > OCR, and when confidence is too low the job fails closed instead of charging
  > you for garbage. No bank logins, no human review queue, and source files are
  > deleted after 24 hours. Preview first, pay only for what you can see.

- Key features (3-5 bullets for the listing):
  - Bank statement PDF to CSV with a built-in parser first, OCR fallback for scans.
  - Free preview: review sample rows and download a sample CSV before paying.
  - Fail-closed extraction: low-confidence conversions are not charged.
  - No bank login and no human review queue; source files deleted after 24 hours.
  - Paid jobs get one automatic stronger redo.

- Canonical links for the listing (all verified live HTTP 200 on 2026-08-09):
  - https://aiconverter.app/bank-statement-pdf-to-csv/
  - https://aiconverter.app/sample-csv/
  - https://aiconverter.app/trust/
  - https://aiconverter.app/formats/

## BetaList

### Decision (dated 2026-08-09)

- **Decision: SUBMIT — manual submission by Nish.**
- Reason: BetaList is a free, live, category-relevant launch directory (AI Tools,
  Personal Finance, Productivity categories all fit; daily startup posts confirm
  activity). Search `q=aiconverter` returns "No results found", so there is no
  duplicate. aiconverter.app meets eligibility: working website on its own domain
  (own-domain rule satisfied; app-store/free-subdomain links are rejected).
- Constraint: `Submit Startup` redirects to `/sign_in` (account-gated). BetaList
  is not in the venue policy allowlist (`automation_disposition: unknown`), so
  `venue-claim claim` exits 4 — the agent must not drive a browser submission.
  Submission is a human account action, same as Product Hunt.
- Standard submission is free; "Priority listing" is an optional paid upsell
  (faster review queue, no acceptance guarantee). Editorial discretion applies:
  featuring is not guaranteed.
- Next action: Nish signs in and submits using the kit below, then this file
  should be updated with the public startup URL.

### Manual submission kit (copy-paste ready)

- Name: **AI Converter**
- Tagline: **Bank statement PDFs to CSV you can review before paying**
- Description:

  > AI Converter turns bank statement PDFs into spreadsheet-ready CSV in your
  > browser. Review sample rows free, then unlock the full extraction only when
  > the preview looks right. OCR fallback handles scanned statements; low
  > confidence fails closed with no charge. No bank logins and no human review
  > queue; source files are deleted after 24 hours.

- Category suggestions: AI Tools, Personal Finance, Productivity
- Website: https://aiconverter.app

## SaaSHub

### Decision (dated 2026-08-10)

- **Decision: SUBMIT — free submission, manual by Nish. Paid promo optional, deferred.**
- Reason: SaaSHub is a free, live, category-relevant software marketplace (running since
  2014). Its official submit page (https://saashub.com/submit, checked 2026-08-10) states
  "This is our free marketing tool that helps you to promote your product" and describes
  the flow: "You need to submit and verify your product on SaaSHub. Then, from within the
  management page, click on the 'Submit' tab and post your product to all relevant
  directories." SaaSHub search `q=aiconverter` returns no aiconverter.app result
  (unrelated tools only: ExcelDashboard.ai, AIHumanizer.ai, Aiconvert/aiconvert.online,
  ...), so there is no duplicate — but the exact category is hosted (AI Bank Statement,
  ConvertMyStatement AI), so the venue fits the product.
- Constraint: saashub.com is not in the venue policy allowlist and not yet reviewed in
  `venue-policy.json` (fleet disposition for SaaSHub, seo-fix-kit packet 2026-08-09:
  `ambiguous` / `manual-only` — the official page describes a user-facing submit/promotion
  flow without explicit unattended-automation permission; the SaaSHub public API is
  read-only, /site/api has only two lookup endpoints and no submission route). Verified
  live `venue-claim claim saashub.com aiconverter` exits 4 (ALLOWLIST/POLICY BLOCK: "venue
  saashub.com is unknown (not allowlisted, not reviewed)") on 2026-08-10, so the agent
  must not drive a browser submission. Submission (register, verify the product, submit
  from the management page) is a human account action, same as Product Hunt and BetaList.
- Standard submission is free. Paid promo exists ("Feature My Product" — "Get a premium
  placement and more clicks", https://saashub.com/featured-products) but is optional and
  not required for the free listing; treat it as a separate commercial call by Nish.
- Verification note: the flow says "submit and verify your product" — SaaSHub verification
  may require a verification step (e.g. meta-tag) on the product domain, which is an owner
  action that can need a tiny deploy of the verification tag.
- Next action: Nish registers/signs in and submits using the kit below, then this file
  should be updated with the public product URL.

### Manual submission kit (copy-paste ready)

- Name: **AI Converter**
- Tagline: **Bank statement PDFs to CSV you can review before paying**
- Description:

  > AI Converter turns bank statement PDFs into spreadsheet-ready CSV in your browser.
  > Review sample rows free, then unlock the full extraction only when the preview looks
  > right. OCR fallback handles scanned statements; low confidence fails closed with no
  > charge. No bank logins and no human review queue; source files are deleted after
  > 24 hours.

- Category suggestions: Bank Statements, PDF Converter, Data Extraction, Accounting &
  Finance, AI Tools (all five facets live on SaaSHub search 2026-08-10).
- Website: https://aiconverter.app
- Canonical links for the listing (all verified live HTTP 200 on 2026-08-10):
  - https://aiconverter.app/bank-statement-pdf-to-csv/
  - https://aiconverter.app/sample-csv/
  - https://aiconverter.app/trust/
  - https://aiconverter.app/formats/

## Verification notes

- All copy claims only live production behavior (bank-statement PDF to CSV,
  preview-first, fail-closed) as verified on 2026-08-09. No blanket accuracy
  claims, no official accounting-platform import claims, no pricing-page link
  (https://aiconverter.app/pricing/ returns 404 until PR #21 lands).
- Per fleet policy, submissions stay manual-only (account actions are human).
