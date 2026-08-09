# Launch Venue Notes

Durable record of launch-venue decisions and submission kits for aiconverter.app.
Live-production claims only: everything below is grounded in live pages and
`/llms.txt` (verified 2026-08-09 for Product Hunt and BetaList, 2026-08-10 for
WeLikeTools and xix.ai). Automated submission is blocked for all venues by the
fleet venue policy ledger (`agent-state/growth-loop/venue-policy.json`
and the `venue-claim` guard): Product Hunt is reviewed as prohibiting automation;
BetaList, WeLikeTools, and xix.ai are not yet reviewed
(`automation_disposition: unknown`). Account actions (and xix.ai's $9.90 spend)
stay with Nish. The kits below make each manual submission a copy-paste job.

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

## WeLikeTools

### Decision (dated 2026-08-10)

- **Decision: SUBMIT — manual submission by Nish (free, no fee).**
- Reason: WeLikeTools is a free, live, category-relevant tools directory with
  Business & Finance, Personal Finance, Productivity & Management, and AI
  Assistants categories that all fit. Search `q=aiconverter` returns "Found 0
  results" / "No tools found", so there is no duplicate. An exact-category
  competitor is already listed — Bank Statement Engine
  (https://weliketools.com/tool/bankstatementengine, published 2026-07-12,
  Business & Finance, Free) — so the venue hosts the category; only this
  product's listing is missing. No fee or paid tier is mentioned on either
  submission page.
- Constraint: both https://weliketools.com/submit and /get-started gate behind
  Google sign-in ("Log in to Submit" / "Log in to Get Started"). WeLikeTools is
  not in the venue policy allowlist (`automation_disposition: unknown`), so
  `venue-claim claim` exits 4 — the agent must not drive a browser submission.
  Submission is a human account action, same as BetaList.
- Next action: Nish signs in with Google and submits using the kit below, then
  this file should be updated with the public tool URL.

### Manual submission kit (copy-paste ready)

- Name: **AI Converter**
- Tagline: **Bank statement PDFs to CSV you can review before paying**
- Description:

  > AI Converter turns bank statement PDFs into spreadsheet-ready CSV in your
  > browser. Review sample rows free, then unlock the full extraction only when
  > the preview looks right. OCR fallback handles scanned statements; low
  > confidence fails closed with no charge. No bank logins and no human review
  > queue; source files are deleted after 24 hours.

- Category suggestions: Business & Finance, Personal Finance, Productivity &
  Management
- Pricing: Free preview; paid per-page plans
- Website: https://aiconverter.app
- Key features (3-5 bullets for the listing):
  - Bank statement PDF to CSV with a built-in parser first, OCR fallback for scans.
  - Free preview: review sample rows and download a sample CSV before paying.
  - Fail-closed extraction: low-confidence conversions are not charged.
  - No bank login and no human review queue; source files deleted after 24 hours.
  - Paid jobs get one automatic stronger redo.

## xix.ai

### Decision (dated 2026-08-10)

- **Decision: PAID listing at $9.90 recommended; declined for agent-executed
  submission. The $9.90 spend and the submission are Nish's human actions — the
  kit below is ready, and this line becomes SUBMITTED (or DECLINED) once Nish
  decides on the spend.**
- Reason: xix.ai hosts a dedicated, exact-term category page for this product's
  core job — "PDF Bank Statements Converter"
  (https://xix.ai/tool/pdf-bank-statements-converter.html, tool listed
  2025-09-08, currently occupied by competitor aibankparser.com, tagged
  pdf-csv-converter / bank-statement-parser / financial-data-processing-tool) —
  and aiconverter.app is absent (site search returns no hit;
  /tool/ai-converter.html is 404). The submit page (live 2026-08-10) is
  payment-gated: "$9.90, no queue, listed within 48 hours", account sign-in
  required, graphic captcha at the payment step (scout-verified 2026-08-09).
  At $9.90 with no queue and an exact-term page already indexed, the listing is
  cheap enough to be worth testing; if Nish declines the spend, this paragraph
  is the dated decline record.
- Money boundary: $9.90 is a spend decision only Nish can make; the agent
  cannot pay or create the account. xix.ai is not in the venue policy allowlist
  (`automation_disposition: unknown`), so `venue-claim claim` exits 4 — no
  agent-driven browser submission.
- Next action: Nish signs in, pays $9.90, and submits using the kit below, then
  this file should be updated with the public tool URL.

### Manual submission kit (copy-paste ready)

- Name (50 char max): **AI Converter**
- Website: https://aiconverter.app
- Description (rich-text, word-counted):

  > AI Converter turns bank statement PDFs into spreadsheet-ready CSV in your
  > browser. Review sample rows free, then unlock the full extraction only when
  > the preview looks right. OCR fallback handles scanned statements; low
  > confidence fails closed with no charge. No bank logins and no human review
  > queue; source files are deleted after 24 hours.

- Product type/category: pick the Finance/Productivity tool category in the
  form's category selector.
- Contact email: use the fleet plus-address for this venue.

## Verification notes

- All copy claims only live production behavior (bank-statement PDF to CSV,
  preview-first, fail-closed) as verified on 2026-08-09. No blanket accuracy
  claims, no official accounting-platform import claims, no pricing-page link
  (https://aiconverter.app/pricing/ returns 404 until PR #21 lands).
- WeLikeTools and xix.ai sections re-verified live on 2026-08-10: both submit
  pages, both search results, the WeLikeTools competitor listing, the xix.ai
  exact-term category page, and the four canonical product links
  (/bank-statement-pdf-to-csv/, /sample-csv/, /trust/, /formats/ — all HTTP 200;
  /pricing/ and /receipt-to-csv/ remain 404 and are not claimed in any kit).
- Per fleet policy, submissions stay manual-only (account actions are human).
