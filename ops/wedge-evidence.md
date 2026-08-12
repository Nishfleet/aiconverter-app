# Wedge Evidence — core-phrase SERP is 100% free-positioned and aiconverter.app is absent

Durable record for the loop's rethink epic (E2 "Traction reset" in
`agent-state/aiconverter-app-improvement-loop/epics.md`). This file feeds the
free-anchor question with a fresh, dated SERP snapshot and the surrounding
evidence. **No code or payment change is made by this file** — it is the
evidence item, deliberately, per the backlog item's accept:

> the loop's rethink epic records this evidence (with the dated SERP snapshot)
> and reaches an explicit positioning decision (honest free anchor vs
> paid-quality wedge vs another wedge); no code or payment changes in this
> item.

Snapshot method: real rendered browser (camofox anti-detection browser —
Firefox-based engine, the same browser class the 2026-08-08 scout evidence
used), Google `hl=en`, logged 2026-08-12 ~12:02Z. Every result below is the
resolved destination URL (followed through Google's `/goto` redirect), not a
redirect token.

## Fresh snapshot (2026-08-12, ~12:02Z) — core phrase, page 1

Query: `bank statement pdf to csv converter` (unquoted; 9 organic results on
page 1 — Google served 9, not 10, for this query).

| # | Destination | Title (as rendered) | Positioning |
|---|-------------|---------------------|-------------|
| 1 | https://bankstatementconverter.com/ | Accurately Convert PDF Bank Statements to CSV | free |
| 2 | https://www.re-cap.com/bank-statement-converter | Free Convert PDF Bank Statements to CSV | free |
| 3 | https://bankstatementconverters.ai/ | Bank Statement Converter PDF to CSV/Excel (100% FREE) | free |
| 4 | https://financefileconverter.com/ | FinanceFileConverter – Convert Bank & Accounting Files | free |
| 5 | https://www.zamzar.com/tools/bank-statement-converter-csv/ | Bank Statement Converter to CSV - Online and Free | free |
| 6 | https://razorextract.com/ | Razor Extract - Convert PDF Statements to Excel or CSV ("100% free") | free |
| 7 | https://founderpath.com/bank-statement-converter | Free Bank Statement Converter — PDF to CSV | free |
| 8 | https://www.reddit.com/r/Bookkeeping/comments/17k718p/converting_pdf_bank_statements_to_csv/ | Converting pdf bank statements to csv | forum advice (points at a free tool) |
| 9 | https://ocr.ac/bank-statement-converter | Convert PDF Bank Statement to Excel & CSV - Online OCR | free |

**Free-positioned share of page 1: 9/9 (100%).** Whole-SERP HTML scan:
zero occurrences of `aiconverter` (page 1 AND page 2, see below) — the product
is not merely unranked, it is entirely absent from the results, related
searches, and news/featured slots.

## Fresh snapshot (2026-08-12) — page 2 (`start=10`)

10 more organic results, all free-positioned ("Convert Bank Statements to CSV
in Seconds", "Free & Fast - PDF to CSV Bank Statement Converter", "How to
Convert PDF Bank Statement to CSV [FREE]", "Convert PDF Bank Statements to CSV
- Instant", "BankStatementWizard: ... Convert - Convert ...", ...).
Zero `aiconverter` occurrences. Absence holds across 19 organic results on the
first two pages.

## Fresh snapshot (2026-08-12) — quoted variant

Query: `"bank statement pdf to csv converter"` (quoted; 9 results): bankconv.com
("#1 Bank Statement Converter" — free), banktobooks.com/bank-statement-to-csv,
reddit.com/r/SideProject (in-browser, nothing uploaded), bankstatementpdftocsv.com,
nomi.co.uk blog, bank-statements.co/convert/pdf-to-csv, apify.com (OCR actor,
"Try for free"), quickbankconvert.com, invoicedataextraction.com. Zero
aiconverter occurrences. Same shape: free-entry dominates; no paid-first
product holds an organic top-10 slot.

## The product's indexed presence (2026-08-12)

`site:aiconverter.app` — 10 indexed pages, confirmed live:

1. https://aiconverter.app/ (homepage)
2. /security/
3. /refund/
4. /terms/
5. /privacy/
6. /support/
7. /formats/
8. /about/
9. /data-retention/
10. **https://aiconverter.app/convert-bank-statement-to-csv/** — the exact-topic
    landing page ("Convert Bank Statement to CSV - AI Converter", HTTP 200)

So the exact-topic page Google indexes does not rank anywhere in pages 1–2 for
the core phrase (checked 2026-08-12). Also live: / (200), /bank-statement-pdf-to-csv/
(200). Indexed ≠ visible on the money query.

## Product's current public position (unchanged since scout 2026-08-08)

Pay-after-preview: ₹399 / 25 pages, ₹799 / 100 pages, ₹1,399 / 500 pages
(ops/pricing-strategy.md), free preview + downloadable sample CSV before
payment, no free full-conversion anchor anywhere in the funnel. Every one of
the 19 results above gives full conversion free (or a free tier) — the product
has no shape that this SERP rewards.

## Free-anchor question for the rethink epic (E2)

The evidence is now snapshotted twice, four days apart (2026-08-08 ~22:30Z and
2026-08-12 ~12:02Z), and page 1 is a near-verbatim match across the two runs —
the free-anchored SERP is stable, not a sampling artifact. The question the
epic must answer explicitly, with the dated snapshot recorded:

1. **Honest free anchor** — give the core job a genuinely free full-conversion
   tier (e.g., first N pages of a statement free, or a size-capped free path)
   to enter a SERP where 100% of entrants are free. Monetize the trust earned
   at scale. This is the only wedge shape present in the top-10.
2. **Paid-quality wedge** — stay pay-after-preview and differentiate on
   trust/accuracy at the query. No top-10 precedent for this shape on the core
   phrase (the only paid-shaped results are guide/roundup pages, which also
   lead with free tools), and every free competitor claims accuracy —
   StatementSift even ships free row-by-row balance reconciliation.
3. **Another wedge** — e.g., privacy-local (browser-local parsing, the
   StatementSift/microapp shape), bookkeeping workflow lock-in (the
   ReceiptsAI/Exact Statement shape), or proof-backed entry (Bankstatemently's
   public accuracy benchmark). These are adjacent shapes present in the
   category but not (yet) the core-phrase top-10.

Recommendation for the epic to weigh: the free anchor is the only wedge with
top-10 occupancy on the exact query; the five-observed-trials item
(ops/customer-trials.md) and pricing-strategy are the other inputs the epic
should weigh before the decision line is written. This file deliberately takes
no position that changes product behavior — the decision belongs to the epic /
Nish.

## Verify (as filed)

Decision line exists in the rethink epic (epics.md E2) within the next loop
pass, referencing this dated snapshot; re-running the SERP snapshot should
confirm the record matches reality.

## Checks on this lane

- Live product: /, /convert-bank-statement-to-csv/, /bank-statement-pdf-to-csv/
  all HTTP 200 (2026-08-12).
- `git diff --check` clean; doc-only change (ops/wedge-evidence.md,
  ops/wedge-evidence-core-phrase-screenshot-20260812.png, .lane/report.md).
- Raw artifacts (not committed): /tmp/opencode/serp-google-quoted.json,
  serp-unquoted.json, serp-p2.json, site-aiconverter.json, serp-dest.json,
  serp-unquoted-dest.json, serp-core-phrase.png.
