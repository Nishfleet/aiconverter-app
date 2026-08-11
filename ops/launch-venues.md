# Launch Venue Notes

Durable record of launch-venue decisions and submission kits for aiconverter.app.
Live-production claims only: everything below is grounded in live pages and
`/llms.txt` (verified 2026-08-09 for Product Hunt and BetaList, re-verified
2026-08-10; WeLikeTools and xix.ai verified 2026-08-10 and re-verified
2026-08-11; Toolbit.ai verified 2026-08-10 and re-verified 2026-08-11;
Toolify.ai verified 2026-08-11).
Automated submission is blocked for all six venues by the fleet venue policy
ledger (`agent-state/growth-loop/venue-policy.json` and the `venue-claim`
guard): Product Hunt is reviewed as prohibiting automation; BetaList,
WeLikeTools, xix.ai, Toolbit.ai, and Toolify.ai are not yet reviewed
(`automation_disposition: unknown`). Account actions (and the xix.ai $9.90
and Toolify.ai $99 spend decisions) stay with Nish. The kits below make each
manual submission a copy-paste job.

## Status ledger (fleet re-verification 2026-08-10)

Both baseline venues are still NOT live as of 2026-08-10 — the decisions below
stand unchanged and both kits remain valid and copy-paste ready:

- Product Hunt search `q=aiconverter` (2026-08-10): still zero aiconverter.app
  result; unrelated tools only (Coval, Wingman City Guide, Sibyl AI, ...).
  Launches search `q=bank statement csv` shows exact-category competitors live
  (LedgerBox, BankStatementLab, Convert My Bank Statement, Docsumo) and still no
  AI Converter listing. The category is hosted; the listing is missing.
- BetaList search `q=aiconverter` (2026-08-10): still "No results found for
  aiconverter"; `Submit Startup` still redirects to `/sign_in` (account-gated).
- Kit reference pages all live HTTP 200 (2026-08-10): `/`, `/llms.txt`,
  `/bank-statement-pdf-to-csv/`, `/sample-csv/`, `/trust/`, `/formats/`.
  `/pricing/` still returns 404, so the no-pricing-link note below still holds.
- **Blocked on a human account action:** Nish owns the manual submissions for
  both venues. After each submission, update this file with the public URL and
  flip the venue's status line to live.

### Fleet re-verification 2026-08-11 (WeLikeTools + xix.ai)

Both venue sections below were added on 2026-08-10 and re-verified live on
2026-08-11 — the decisions stand unchanged and both kits remain valid and
copy-paste ready:

- WeLikeTools search `q=aiconverter` (2026-08-11): still "Found 0 results / No
  tools found" — no duplicate, no aiconverter.app listing. The exact-category
  competitor Bank Statement Engine is still live
  (https://weliketools.com/tool/bankstatementengine, published 2026-07-12,
  Category: Business & Finance, Pricing: Free), so the venue hosts the category
  — only this product's listing is missing. `https://weliketools.com/submit`
  still gates behind Google sign-in ("Log in to Submit", free, no fee or paid
  tier mentioned).
- xix.ai site search `q=aiconverter` (2026-08-11): still "No results found in
  the search"; `https://xix.ai/tool/ai-converter.html` still 404. The
  exact-term category page is still live and still occupied by a competitor —
  "PDF Bank Statements Converter"
  (https://xix.ai/tool/pdf-bank-statements-converter.html, listed 2025-09-08,
  current tool aibankparser.com, tags pdf-csv-converter /
  bank-statement-parser / financial-data-processing-tool). `https://xix.ai/submit`
  still shows the $9.90 paid listing with "no queue, listed within 48 hours".
- Kit reference pages all live HTTP 200 (2026-08-11): `/`, `/llms.txt`,
  `/bank-statement-pdf-to-csv/`, `/sample-csv/`, `/trust/`, `/formats/`.
  `/pricing/` and `/receipt-to-csv/` still return 404, so the no-pricing-link
  note below still holds and no kit claims those routes.
- **Blocked on a human account action (and one $9.90 spend decision):** Nish
  owns the WeLikeTools submission and the xix.ai paid/decline decision. After
  each action, update this file with the public URL and flip the venue's status
  line to live.

### Fleet re-verification 2026-08-11 (Toolbit.ai)

The Toolbit.ai section below was added on 2026-08-10 and re-verified live on
2026-08-11 — the decision stands unchanged and the kit remains valid and
copy-paste ready:

- Toolbit.ai search `q=aiconverter` (2026-08-11): still no aiconverter.app
  result — unrelated tools only (ConvertFiles.ai, ipic.ai, AICoverGen, and a
  different product named "AI Convert" under Creative Tools).
  `https://toolbit.ai/ai-tool/ai-converter` still 404. The exact-category
  competitors are still live — StatementSheet
  (https://toolbit.ai/ai-tool/statementsheet, "Convert PDF bank statements to
  Excel or CSV", Data Extraction, 9.5K monthly visits, Paid from $20) and
  Rocket Statements (https://toolbit.ai/ai-tool/rocketstatements, "Convert
  Bank Statements to Excel, CSV & JSON", Document Analysis / OCR, 4.8K monthly
  visits, Paid) — so the venue hosts the category; only this product's listing
  is missing. Note: Rocket Statements moved from `/ai-tool/rocket-statements`
  (now 404) to `/ai-tool/rocketstatements`; the kit uses the current URL.
- Plans (https://toolbit.ai/submit, re-verified 2026-08-11): paid **Launch
  Tool $29 / One-time** (listed within 24h, blue verified badge, sidebar
  featured 1 day, permanent directory listing, one X post) unchanged; FAQ
  still: "Free community listings require embedding our Launch Badge on your
  website and are reviewed in up to 3 days." `/submit/tool?plan=free` still
  renders the sign-in wall, and `/launch-badge` still 404 — the badge snippet
  stays account-gated.
- ToS (https://toolbit.ai/terms-and-conditions, last updated 2026-07-20,
  re-read live 2026-08-11): section 7 "Prohibited Uses" still prohibits "any
  robot, spider, or other automatic device, process, or means to access
  Service for any purpose" — same class of language as Product Hunt's
  prohibition; flag for the venue research desk.
- Kit reference pages all live HTTP 200 (2026-08-11): `/`, `/llms.txt`,
  `/bank-statement-pdf-to-csv/`, `/sample-csv/`, `/trust/`, `/formats/`.
  `/pricing/` and `/receipt-to-csv/` still return 404, so the kit claims none
  of those routes.
- **Blocked on a human account action:** Nish owns the free submission and the
  $29 paid decision. After each action, update this file with the public URL
  and flip the venue's status line to live.

### Fleet re-verification 2026-08-11 (Toolify.ai)

The Toolify.ai section below was added on 2026-08-11 and verified live on
2026-08-11 — the decision stands as recorded and the kit remains valid and
copy-paste ready:

- Toolify search `q=aiconverter` (2026-08-11, JS-rendered): "Sorry, there are
  no tools containing your keywords at the moment" — no aiconverter.app
  result, no duplicate. `https://www.toolify.ai/tool/ai-converter` returns
  404.
- The exact-category tag pages are still competitor-occupied: "The best ai
  tools for Bank Statement to CSV are: LedgerBox"
  (https://www.toolify.ai/tag/Bank%20Statement%20to%20CSV, 2 AIs, updated
  2026-08-11) and the same verdict on /tag/Bank%20Statement%20to%20Excel —
  LedgerBox is live at https://www.toolify.ai/tool/ledgerbox ("AI-powered
  bank statement converter from PDF to Excel and CSV", added 2023-11-11). The
  venue hosts the category; only this product's listing is missing.
- Submit page (live 2026-08-11, matching Wayback capture 2026-07-04): paid
  path only — **$99 one-time**, "No queue, listed within 48 hours", "Pay
  $99". Form: Name + Website URL + content mode ("Generated by Toolify" —
  Toolify AI writes all copy and translations from the site; "Do it myself" —
  submitter provides English, Toolify translates). Benefits listed: listing
  and "Just Launched" within 48 hours, border highlight, no less than 6
  quality dofollow links, listing & traffic forever, Toolify AI Launch
  embeds + AI certification.
- Fulfillment Policy (https://www.toolify.ai/fulfillment-policy, last
  updated 2024-08-30, archived copy re-read 2026-07-02): one-time payment
  program; account registration required; "Toolify may reject your
  application for an Account for any reason, in our sole discretion"; **the
  payment fee is non-refundable** ("The payment fee is non-refundable, even
  if you cancel or do not use any of the benefits"). No robot/spider/
  automated-access prohibition found in the policy (unlike Product Hunt's ToS
  and Toolbit.ai's ToS §7) — no separate ToS page exists beyond Fulfillment
  Policy and Privacy Policy.
- Kit reference pages all live HTTP 200 (2026-08-11): `/`, `/llms.txt`,
  `/bank-statement-pdf-to-csv/`, `/sample-csv/`, `/trust/`, `/formats/`.
  `/pricing/` and `/receipt-to-csv/` still return 404, so the kit claims none
  of those routes.
- **Blocked on a human account action and a $99 spend decision:** Nish owns
  the paid submission (account creation, payment, form). After the action,
  update this file with the public URL and flip the venue's status line to
  live.

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

### Decision (dated 2026-08-10, re-verified 2026-08-11)

- **Decision: SUBMIT — manual submission by Nish (free, no fee).**
- Reason: WeLikeTools is a free, live, category-relevant tools directory with
  Business & Finance, Personal Finance, Productivity & Management, and AI
  Assistants categories that all fit. Search `q=aiconverter` returns "Found 0
  results" / "No tools found", so there is no duplicate. An exact-category
  competitor is already listed — Bank Statement Engine
  (https://weliketools.com/tool/bankstatementengine, published 2026-07-12,
  Category: Business & Finance, Pricing: Free) — so the venue hosts the
  category; only this product's listing is missing. No fee or paid tier is
  mentioned on either submission page.
- Constraint: https://weliketools.com/submit gates behind Google sign-in
  ("Log in to Submit" / "Log in to Get Started"). WeLikeTools is not in the
  venue policy allowlist (`automation_disposition: unknown`), so
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

### Decision (dated 2026-08-10, re-verified 2026-08-11)

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
  /tool/ai-converter.html is 404). The submit page (live 2026-08-10, re-verified
  2026-08-11) is payment-gated: "$9.90, no queue, listed within 48 hours",
  account sign-in required, graphic captcha at the payment step (scout-verified
  2026-08-09). At $9.90 with no queue and an exact-term page already indexed,
  the listing is cheap enough to be worth testing; if Nish declines the spend,
  this paragraph is the dated decline record.
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

## Toolbit.ai

### Decision (dated 2026-08-10, re-verified 2026-08-11)

- **Decision: SUBMIT — free community listing first ("Launch Tool $0"),
  manual by Nish. Paid plan recorded and deferred.**
- Reason: Toolbit.ai is a live, category-relevant AI tools directory (homepage:
  "search 10,000+ AI tools") that already lists exact-category competitors:
  StatementSheet (https://toolbit.ai/ai-tool/statementsheet — "Convert PDF
  bank statements to Excel or CSV", Data Extraction, 9.5K monthly visits,
  paid) and Rocket Statements
  (https://toolbit.ai/ai-tool/rocketstatements — "Convert Bank Statements to
  Excel, CSV & JSON", Document Analysis / OCR, 4.8K monthly visits, paid).
  Search `q=aiconverter` returns no aiconverter.app result (unrelated tools
  only: ConvertFiles.ai, ipic.ai, AICoverGen, and a different product named
  "AI Convert" under Creative Tools), so there is no duplicate — the category
  is hosted, only this listing is missing.
- Free plan first (plans verified live on https://toolbit.ai/submit,
  2026-08-10, re-verified 2026-08-11): the free community listing is **Launch
  Tool $0 / Forever** — free with Launch Badge verification, do-follow SEO
  backlink, reviewed up to 3 days, permanent directory listing. FAQ (submit
  center, 2026-08-11): "Free community listings require embedding our Launch
  Badge on your website and are reviewed in up to 3 days."
- Paid option recorded (deferred): **Launch Tool $29 / One-time** — listed
  within 24h, blue verified badge, sidebar featured (1 day), permanent
  directory listing, one social media (X) post. ToS section 5: paid
  submissions are charged at checkout before review; full refund (minus
  processing fees) if rejected. Decision: the $29 paid launch is an optional
  commercial call by Nish, not required for the free listing.
- Verified requirement: the free listing's verification step is embedding
  Toolbit's Launch Badge on aiconverter.app. The badge snippet is
  account-gated (only revealed in the submission flow; /launch-badge, /badge
  and /submit/launch-badge all 404, re-verified 2026-08-11), so embedding is a
  follow-up owner action that needs a tiny deploy once Nish has the snippet.
- Constraint: `/submit/tool?plan=free` renders the sign-in wall
  (re-verified 2026-08-11; signup at /signup) — account-gated. toolbit.ai is
  not in the venue policy allowlist (`automation_disposition: unknown`, not
  yet reviewed in `venue-policy.json` as of 2026-08-11), so the agent must not
  drive a browser submission. ToS review lead
  (https://toolbit.ai/terms-and-conditions, last updated 2026-07-20, re-read
  live 2026-08-11): section 7 "Prohibited Uses" prohibits "any robot, spider,
  or other automatic device, process, or means to access Service for any
  purpose" — same class of language as Product Hunt's prohibition; flag for
  the venue research desk (the guard stays exit-4 either way). Submission
  (create account, submit via the account-gated flow, embed the Launch Badge)
  is a human account action, same as the other venues.
- Next action: Nish signs in (Google or email) and submits using the kit
  below, embeds the Launch Badge snippet on aiconverter.app (tiny deploy) to
  complete the free-verified listing, then this file should be updated with
  the public tool URL.

### Manual submission kit (copy-paste ready)

- Name: **AI Converter**
- Tagline: **Bank statement PDFs to CSV you can review before paying**
- Description:

  > AI Converter turns bank statement PDFs into spreadsheet-ready CSV in your
  > browser. Review sample rows free, then unlock the full extraction only when
  > the preview looks right. OCR fallback handles scanned statements; low
  > confidence fails closed with no charge. No bank logins and no human review
  > queue; source files are deleted after 24 hours.

- Category suggestions: Data Extraction, Document Automation, OCR / Document
  Analysis (all live Toolbit categories 2026-08-10; exact-category peers sit
  under Data Extraction and Document Analysis).
- Pricing tag suggestion: Freemium (free preview + paid extraction, matching
  live checkout behavior).
- Website: https://aiconverter.app
- Canonical links for the listing (all verified live HTTP 200 on 2026-08-10
  and re-verified 2026-08-11):
  - https://aiconverter.app/bank-statement-pdf-to-csv/
  - https://aiconverter.app/sample-csv/
  - https://aiconverter.app/trust/
  - https://aiconverter.app/formats/

## Toolify.ai

### Decision (dated 2026-08-11)

- **Decision: PAID listing at $99 recommended for evaluation; declined for
  agent-executed submission. The $99 spend and the submission are Nish's
  human actions — the kit below is ready, and this line becomes SUBMITTED (or
  DECLINED) once Nish decides on the spend.**
- Reason: Toolify is a live, category-relevant AI tools directory (homepage:
  "30237 AIs and 459 categories", submit page claims 5.1M+ monthly visits)
  that already hosts the exact-category tag pages — "Bank Statement to CSV"
  and "Bank Statement to Excel" both lead with LedgerBox
  (https://www.toolify.ai/tool/ledgerbox, "AI-powered bank statement
  converter from PDF to Excel and CSV", added 2023-11-11) — while site search
  `q=aiconverter` returns no aiconverter.app result ("Sorry, there are no
  tools containing your keywords at the moment") and `/tool/ai-converter` is
  404. No duplicate exists; the category is hosted; only this listing is
  missing.
- The submit path is payment-gated (live 2026-08-11): "Total: $99", "No
  queue, listed within 48 hours", "Pay $99" — a one-time payment per the
  Fulfillment Policy, which also states the fee is non-refundable ("even if
  you cancel or do not use any of the benefits") and that Toolify "may reject
  your application for an Account for any reason, in our sole discretion".
  There is no free tier on the submit page. At $99 with no queue and an
  exact-term tag page already live and updated daily, the listing is a real
  but non-trivial spend; if Nish declines, this paragraph is the dated
  decline record.
- Money boundary: $99 is a spend decision only Nish can make; the agent
  cannot pay or create the account. toolify.ai is not in the venue policy
  allowlist (`automation_disposition: unknown`, not yet reviewed in
  `venue-policy.json` as of 2026-08-11), so `venue-claim claim` exits 4 — no
  agent-driven browser submission. Unlike Product Hunt's ToS and Toolbit.ai's
  ToS §7, the Fulfillment Policy contains no robot/spider/automated-access
  prohibition, but the guard stays exit-4 either way (policy not yet
  reviewed). Submission (create account, pay, submit the form) is a human
  account action, same as the other venues.
- Next action: Nish signs in, pays $99, and submits using the kit below, then
  this file should be updated with the public tool URL.

### Manual submission kit (copy-paste ready)

- Name: **AI Converter**
- Website URL: https://aiconverter.app
- Content mode: **"Do it myself"** (submitter provides English; Toolify
  translates) — with the description below. The alternative "Generated by
  Toolify" mode has Toolify AI write all copy and translations from the site
  and is the lower-effort option if the manual copy is declined.
- Description (English, for "Do it myself"):

  > AI Converter turns bank statement PDFs into spreadsheet-ready CSV in your
  > browser. Review sample rows free, then unlock the full extraction only when
  > the preview looks right. OCR fallback handles scanned statements; low
  > confidence fails closed with no charge. No bank logins and no human review
  > queue; source files are deleted after 24 hours.

- Tags to confirm after listing (the tags LedgerBox carries that surface the
  exact-category pages): Bank Statement to CSV, Bank Statement to Excel, PDF
  to CSV, Convert Documents, Document Processing.
- Canonical links for the listing (all verified live HTTP 200 on 2026-08-11):
  - https://aiconverter.app/bank-statement-pdf-to-csv/
  - https://aiconverter.app/sample-csv/
  - https://aiconverter.app/trust/
  - https://aiconverter.app/formats/
- Post-listing check: confirm the tool appears on
  https://www.toolify.ai/tag/Bank%20Statement%20to%20CSV and that search
  `q=aiconverter` returns the listing; update this file with the public URL.

## Verification notes

- All copy claims only live production behavior (bank-statement PDF to CSV,
  preview-first, fail-closed) as verified on 2026-08-09. No blanket accuracy
  claims, no official accounting-platform import claims, no pricing-page link
  (https://aiconverter.app/pricing/ returns 404 until PR #21 lands).
- WeLikeTools and xix.ai sections verified live on 2026-08-10 and re-verified
  on 2026-08-11: both submit pages, both site searches, the WeLikeTools
  competitor listing, the xix.ai exact-term category page, and the four
  canonical product links (/bank-statement-pdf-to-csv/, /sample-csv/, /trust/,
  /formats/ — all HTTP 200 on 2026-08-11; /pricing/ and /receipt-to-csv/ remain
  404 and are not claimed in any kit).
- Toolbit.ai section verified live on 2026-08-10 and re-verified on
  2026-08-11: the site search, both competitor listings (StatementSheet and
  Rocket Statements at its current /ai-tool/rocketstatements slug), the submit
  center (paid plans + free FAQ), the sign-in wall on /submit/tool?plan=free,
  the ToS section 7 prohibition, and the four canonical product links (all
  HTTP 200 on 2026-08-11; /pricing/ and /receipt-to-csv/ remain 404 and are
  not claimed in the kit).
- Toolify.ai section verified live on 2026-08-11: the site search
  (`q=aiconverter` → no results), the `/tool/ai-converter` 404, both
  exact-category tag pages (/tag/Bank%20Statement%20to%20CSV and
  /tag/Bank%20Statement%20to%20Excel, both leading with LedgerBox), the live
  LedgerBox tool page, the live submit page ($99 one-time, no queue, 48h), the
  Fulfillment Policy (non-refundable one-time fee, account registration,
  no automation prohibition), and the four canonical product links (all HTTP
  200 on 2026-08-11; /pricing/ and /receipt-to-csv/ remain 404 and are not
  claimed in the kit).
- Per fleet policy, submissions stay manual-only (account actions are human).
