# Core-phrase SERP wedge evidence

Dated record of the core-phrase search results page (SERP) for the traction
rethink, feeding the free-anchor question into the rethink epic (E2 in the
improvement-loop `epics.md`). Live-production claims only: everything below was
re-observed live on 2026-08-09 (UTC) and re-verified live on 2026-08-14 (UTC).
This record carries no code or payment changes; it exists so the rethink epic
can decide positioning on evidence. The epic reached its explicit positioning
decision (paid-quality wedge, "B") on 2026-08-14 — the re-verification below
confirms the SERP evidence that decision rests on is still live.

## Snapshot (dated 2026-08-09T19:1xZ, live re-run)

- Engine/locale: Google, English, US (unauthenticated browser session).
- Query: `bank statement pdf to csv converter` (core phrase, unquoted).
- Capture: live rendered page in a fresh anti-detection browser session;
  organic positions, ad slots, and AI Overview read from the rendered DOM.

### Page-1 composition

| Slot | Result | Position |
| --- | --- | --- |
| Sponsored ad | DocuClipper - "Bank Statement to CSV File" (docuclipper.com/bank-statements/to-csv) | 1 paid slot above organic |
| 1 | "Accurately Convert PDF Bank Statements to CSV" - bankstatementconverter.com | organic 1 |
| 2 | "Converting pdf bank statements to csv" - Reddit r/Bookkeeping thread | organic 2 |
| 3 | "Free Bank Statement Converter — PDF to CSV" - founderpath.com | organic 3 |
| 4 | "How to convert PDF to CSV: 5 easy steps" - Adobe Acrobat blog (adobe.com) | organic 4 |
| 5 | "Bank Statement Converter PDF to CSV/Excel (100% FREE)" - bankstatementconverters.ai | organic 5 |
| 6 | "FinanceFileConverter – Convert Bank & Accounting Files" - financefileconverter.com | organic 6 |
| 7 | "Bank Statement Converter to CSV - Online and Free" - zamzar.com | organic 7 |
| 8 | "How to Convert Bank Statements to CSV, Excel 365 or Google..." - YouTube (Klippa) | organic 8 |
| 9 | "Convert PDF to CSV & Sheets™. PDF to Excel & XLS" - Google Workspace Marketplace app | organic 9 |

Google also rendered an AI Overview (cites FinanceFileConverter, DocuClipper,
Smallpdf, Tabula - never aiconverter.app) and a "People also search for" block
("Bank statement pdf to csv converter online free", "PDF bank statement to
Excel free", ...).

## Findings

### 1. Page-1 organic is 100% free-positioned

All nine organic results lead with free positioning, free how-to content, or a
free/community entry point: "Accurately Convert...", "Free Bank Statement
Converter", "100% FREE", "Online and Free", Reddit thread, Adobe how-to,
YouTube how-to, and a free Workspace Marketplace app. The only non-free entry
on page 1 is the single DocuClipper paid ad - no paid-after-preview product
holds any organic position on this query.

### 2. aiconverter.app is absent from the top 10 despite being indexed

`site:aiconverter.app bank statement` (2026-08-09T19:1xZ) returns ten indexed
pages with `https://aiconverter.app/bank-statement-pdf-to-csv/` first - the
product's exact-core-phrase page is Google-indexed (confirmed HTTP 200), yet it
appears nowhere on page 1 for the core phrase itself. Absence is a positioning
problem, not an indexation problem.

### 3. The product's only public position is pay-after-preview

Live `https://aiconverter.app/bank-statement-pdf-to-csv/` and `/llms.txt`
(2026-08-09T19:1xZ) state: free preview and sample CSV download; Starter ₹399
for 25 pages or images; Standard ₹799 for 100; Bulk ₹1,399 for 500. There is no
free full-conversion anchor to enter this SERP. (The public `/pricing/` route
still 404s until PR #21 lands.)

### 4. Exact-phrase variant is even thinner

The quoted query `"bank statement pdf to csv converter"` (same session) returns
only two exact-match pages: BankConv ("Free bank statement PDF to CSV
converter") and bankstatementpdftocsv.com ("Convert PDF bank statements into
clean CSV files...") - both free-positioned, neither is aiconverter.app.

## Question for the rethink epic (E2)

This record feeds the free-anchor question into the traction rethink epic:

> The core phrase's page-1 organic is 100% free-positioned and the product is
> absent from it while indexed. A paid-after-preview wedge cannot enter this
> SERP unless it differentiates on trust/quality at that exact query. The
> rethink epic must reach an explicit positioning decision: **honest free
> anchor vs paid-quality wedge vs another wedge.**

## Verification notes

- Snapshot method: live rendered Google page captured 2026-08-09T19:1xZ UTC
  (unauthenticated, US/English); positions read from the DOM. SERPs are
  personalized, so absolute ranks can drift by session and locale; the
  free-positioning pattern and aiconverter.app absence are consistent with the
  earlier 2026-08-08T22:30Z snapshot and the improvement-loop evidence trail.
- Previous snapshot (2026-08-08 ~22:30Z, from the loop backlog): same query was
  "entirely free-anchored" - "Accurately Convert PDF Bank Statements to CSV",
  "Free Bank Statement Converter — PDF to CSV", "Bank Statement Converter PDF
  to CSV/Excel (100% FREE)", "Free Convert PDF Bank Statements to CSV", "Bank
  Statement Converter to CSV - Online and Free", FinanceFileConverter, Razor
  Extract - and aiconverter.app was nowhere in the top 10.
- This file is evidence only: no code, pricing, or payment behavior was
  changed to produce it.

## Re-verification 2026-08-14 (live, fresh anti-detection session)

The full claim was re-observed live on 2026-08-14 (UTC) in a fresh
anti-detection browser session, Google English/US (unauthenticated). The
free-positioning pattern and aiconverter.app absence are unchanged from
2026-08-09.

### Core phrase — `bank statement pdf to csv converter` (unquoted)

Page-1 organic composition, read from the rendered DOM (`gbv=2` variant):

| Slot | Result | Position |
| --- | --- | --- |
| 1 | "Accurately Convert PDF Bank Statements to CSV" - bankstatementconverter.com | organic 1 |
| 2 | "Converting pdf bank statements to csv" - Reddit r/Bookkeeping thread | organic 2 |
| 3 | "Free Bank Statement Converter — PDF to CSV" - founderpath.com | organic 3 |
| 4 | "Convert PDF Bank Statements to CSV or Excel" - statementconvert.com | organic 4 |
| 5 | "Free Convert PDF Bank Statements to CSV" - re-cap.com | organic 5 |
| 6 | "Razor Extract - Convert PDF Statements to Excel or CSV" - razorextract.com | organic 6 |
| 7 | "Bank Statement Converter to CSV - Online and Free" - zamzar.com | organic 7 |
| 8 | "BankStatementWizard: Bank Statement Converter" - bankstatementwizard.com | organic 8 |
| 9 | "PDF to CSV Converter Bank Statement or Credit Card" - YouTube | organic 9 |

- No sponsored/ad slots rendered on this page; the 2026-08-09 DocuClipper ad
  slot was not present in this session (SERPs are session-variable; the
  organic free-positioning claim is what matters).
- AI Overview rendered (vision-confirmed: sources Reddit, Microsoft Learn,
  Tabula, DocuClipper, Smallpdf, Microsoft Excel — never aiconverter.app).
- "People also ask" rendered; "Is there a free online converter that can
  convert PDF bank statements to CSV?" remains the third question.
- `aiconverter.app` appears nowhere in the page body (`hasAiconverter: false`
  from the rendered DOM).

### Exact-phrase variant — `"bank statement pdf to csv converter"` (quoted)

Nine results, all free-positioned, neither aiconverter.app nor any
paid-after-preview product holds a slot: BankConv, koody.com, Apify (input
schema), Reddit r/SideProject, bankstatementpdftocsv.com, Nomi, banktobooks,
LinkedIn (ExtractFast), Rocket Statements. `aiconverter.app` absent
(`hasAiconverter: false`).

### Indexed-but-absent still holds

`site:aiconverter.app bank statement` (2026-08-14) returns ten indexed pages
with `https://aiconverter.app/bank-statement-pdf-to-csv/` first — the product's
exact-core-phrase page is still Google-indexed, yet still appears nowhere on
page 1 for the core phrase. Absence is still a positioning problem, not an
indexation problem.

### Product position unchanged

Live `https://aiconverter.app/bank-statement-pdf-to-csv/` (2026-08-14, HTTP
200) still leads with "Pricing starts at ₹399 for up to 25 pages" and
"Preview before payment" — free preview and sample CSV download, paid full
export (₹399/25, ₹799/100, ₹1,399/500). There is still no free full-conversion
anchor to enter this SERP.

### Status of the question the record feeds

The rethink epic (E2) reached its explicit positioning decision on 2026-08-14:
**paid-quality wedge** (option "B", per the improvement-loop `epics.md`
POSITIONING DECISION entry) — aiconverter.app leads as a professional
converter at a real price, free tier only as a taste. This re-verification
confirms the SERP evidence supporting that decision is still live as of
2026-08-14; no decision change is warranted by this run.
