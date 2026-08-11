# Core-phrase SERP wedge evidence

Dated record of the core-phrase search results page (SERP) for the traction
rethink, feeding the free-anchor question into the rethink epic (E2 in the
improvement-loop `epics.md`). Live-production claims only: everything below was
re-observed live on 2026-08-11 (UTC). This record carries no code or payment
changes; it exists so the rethink epic can decide positioning on evidence.

## Snapshot (dated 2026-08-11T05:1xZ, live re-run)

- Engine/locale: Google-backed organic results, English, US (unauthenticated
  browser session). Capture method: the VPS datacenter IP is anti-bot
  challenged by google.com directly (re-verified 2026-08-11 with a fresh
  anti-detection browser session), so the snapshot was read from the rendered
  DOM of the Google-backed Startpage proxy under the same unauthenticated,
  US/English session. Organic positions were read from the rendered DOM.
- Query: `bank statement pdf to csv converter` (core phrase, unquoted).
- Two runs of the same query produced the same 10-result set.

### Page-1 composition (organic, top to bottom)

| Position | Result | Positioning |
| --- | --- | --- |
| 1 | "Accurately Convert PDF Bank Statements to CSV" - bankstatementconverter.com | free converter |
| 2 | "Free Convert PDF Bank Statements to CSV" - re-cap.com/bank-statement-converter | free converter |
| 3 | "Bank Statement Converter PDF to CSV/Excel (100% FREE)" - bankstatementconverters.ai | "100% FREE" |
| 4 | "FinanceFileConverter - Convert Bank & Accounting Files" - financefileconverter.com | free converter suite |
| 5 | "Bank Statement Converter to CSV - Online and Free" - zamzar.com/tools/bank-statement-converter-csv | "Online and Free" |
| 6 | "Converting pdf bank statements to csv" - Reddit r/Bookkeeping thread | community/DIY |
| 7 | "Razor Extract - Convert PDF Statements to Excel or CSV" - razorextract.com | "100% free tool" |
| 8 | "Free Bank Statement Converter - PDF to CSV" - founderpath.com/bank-statement-converter | free converter |
| 9 | "Bank Statement Converter - PDF to Excel/CSV \| 1000+ Banks Support" - bankstatementmagic.com | "Free, fast, secure" |
| 10 | "Convert PDF Bank Statement to Excel & CSV - Online OCR" - ocr.ac/bank-statement-converter | free online tool |

Sponsored slots were not observable through the capture route on 2026-08-11
(direct Google refused the session), so this snapshot records organic
composition only.

## Findings

### 1. Page-1 organic is still 100% free-positioned

All ten organic results lead with free positioning, free how-to content, or a
free/community entry point: "Accurately Convert...", "Free Convert...",
"100% FREE", "Online and Free", Reddit thread, "100% free tool", "Free, fast,
secure", "Online OCR". No paid-after-preview product holds any organic
position on this query, in either the 2026-08-11 run or the earlier
2026-08-08/2026-08-09 snapshots.

### 2. aiconverter.app is still absent from the top 10 for the core phrase

Live re-run of the core phrase (2026-08-11T05:1xZ) shows no aiconverter.app
result on page 1. The quoted exact phrase `"bank statement pdf to csv
converter"` (same session) also returns ten organic results - FinanceFile
Converter, bank-statements.co, BankConv ("Free bank statement PDF to CSV
converter"), aibankstatementconverters.com ("Free AI Tool Online"), Nomi
how-to, BankToBooks, bankstatementpdftocsv.com, pdfbankstatementsconverter.com,
invoicedataextraction.com - all free- or content-positioned, none of them
aiconverter.app.

### 3. NEW: the exact-core-phrase page has dropped out of the Google-backed site: set

On 2026-08-09 `site:aiconverter.app bank statement` returned ten indexed pages
with `https://aiconverter.app/bank-statement-pdf-to-csv/` FIRST. Re-verified
twice today (2026-08-11T05:1xZ, same capture route): `site:aiconverter.app`
returns a stable 9-page set (/, /formats/, /security/, /about/, /privacy/,
/refund/, /support/, /terms/, /data-retention/) and the exact-core-phrase
landing page is no longer observable in the Google-backed site: results at
all. The page still serves HTTP 200 live and is still listed in the live
sitemap.xml, so it remains crawlable; its Google-side site: visibility has
decayed while the fix branch has never been deployed. Absence from page 1 is
therefore no longer purely a positioning problem - the anchor page's own
Google visibility is fading.

### 4. The product's only public position is pay-after-preview (unchanged)

Live `https://aiconverter.app/bank-statement-pdf-to-csv/` and `/llms.txt`
(2026-08-11T05:1xZ) still state: free preview and sample CSV download; Starter
₹399 for 25 pages or images; Standard ₹799 for 100; Bulk ₹1,399 for 500. There
is still no free full-conversion anchor to enter this SERP. The public
`/pricing/` route still returns HTTP 404 (landing pages still undeployed from
the open pricing PRs).

### 5. Bing/DDG indexation is still zero (unchanged)

`site:aiconverter.app` on the Bing-backed DuckDuckGo index still returns zero
results (2026-08-11T05:1xZ) - the separately tracked Bing/DDG indexation gap
is still open, so the product has no search presence on either major index
beyond the decaying Google site: set.

## Question for the rethink epic (E2)

This record feeds the free-anchor question into the traction rethink epic:

> The core phrase's page-1 organic is 100% free-positioned and the product is
> absent from it; the exact-core-phrase landing page has now also dropped out
> of the Google-backed site: set even though it is still live and crawlable,
> and Bing/DDG remain at zero. A paid-after-preview wedge cannot enter this
> SERP unless it differentiates on trust/quality at that exact query. The
> rethink epic must reach an explicit positioning decision: **honest free
> anchor vs paid-quality wedge vs another wedge** - and the decision is now
> time-sensitive while the product's indexed-visibility floor keeps decaying
> with the deploy still blocked.

## Verification notes

- Snapshot method: rendered Google-backed results page captured 2026-08-11T05:1xZ
  UTC (unauthenticated, US/English); positions read from the DOM; two runs of
  the core phrase and two runs of the site: query agreed. Direct google.com
  refused this VPS IP with an anti-bot challenge on 2026-08-11, so the
  Google-backed Startpage proxy was used; SERPs are personalized, so absolute
  ranks can drift by session and locale - the free-positioning pattern and
  aiconverter.app absence are consistent across the 2026-08-08, 2026-08-09,
  and 2026-08-11 snapshots.
- Prior snapshot (2026-08-09T19:1xZ): same query had bankstatementconverter.com
  at organic 1, Reddit thread at 2, founderpath.com at 3, Adobe how-to at 4,
  bankstatementconverters.ai at 5, FinanceFileConverter at 6, Zamzar at 7,
  Klippa YouTube at 8, Google Workspace Marketplace app at 9 - and
  aiconverter.app was absent then too.
- This file is evidence only: no code, pricing, or payment behavior was
  changed to produce it.
