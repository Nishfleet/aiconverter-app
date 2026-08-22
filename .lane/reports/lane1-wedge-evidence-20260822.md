# Lane report — aiconverter-app lane 1, 2026-08-22: wedge evidence re-verification

Item: `554ff994b0` — "Wedge evidence: core-phrase SERP top-10 is 100% free-positioned and the product is absent - feed the free-anchor q"

## Verdict

**Re-verified live on 2026-08-22: the wedge evidence claim is still true on
production SERPs.** The core-phrase SERP (`bank statement pdf to csv
converter`) still shows a 100% free-positioned page-1 organic while
aiconverter.app is absent — despite being Google-indexed for that exact
phrase — and the product page is still pay-after-preview with no free
full-conversion anchor. Rank order drifted vs 2026-08-20 (re-cap.com
returned; ocr.ac took slot 9; no traditional Sponsored slots this
session), which is expected session variance; the free-positioning
pattern and absence did not change. The rethink epic (E2) reached its
explicit positioning decision on 2026-08-14 (**paid-quality wedge**,
option "B"); this run confirms the SERP evidence that decision rests on
is still live, so no decision change is warranted.

## What was done

- Published lane claims (control-plane, `lane-1.json` `claims` field only)
  before editing: `ops/serp-wedge-evidence.md`,
  `.lane/reports/lane1-wedge-evidence-20260822.md`.
- Branched `lane1/wedge-evidence-20260822` from fresh `origin/main`
  (`0328713`).
- Live re-verification (fresh anti-detection browser session, Google
  English/US, unauthenticated; rendered DOM; footer locale 94103 San
  Francisco CA):
  - Core phrase page-1: 9/9 organic results free-positioned
    (bankstatementconverter.com, Reddit r/Bookkeeping, re-cap.com
    "Free Convert", founderpath "Free Bank Statement Converter",
    statementconvert, financefileconverter, zamzar "Online and Free",
    YouTube/Klippa, ocr.ac). No paid-after-preview product holds an
    organic slot. No traditional Sponsored result slots this session;
    advertiser-suggestion pills present under "Find related products
    & services". AI Overview rendered (cites Founderpath, Statement
    Conversion, Tabula, Hubdoc, Reddit, Bank Statement Converter,
    Finance File Converter, Smallpdf — never aiconverter.app).
    "People also ask" included "How can I convert a PDF bank statement
    to Excel for free?". "People also search for" suggestions all
    free-anchored. `hasAiconverter: false` (DOM check).
  - Exact-phrase variant: koody.com, bankstatementpdftocsv.com,
    bankconv.com ("Free bank statement PDF to CSV converter"),
    apify.com, Reddit r/SideProject, banktobooks.com, nomi.co.uk,
    quickbankconvert.com, TikTok — all free-positioned or
    free/community/how-to, aiconverter.app absent
    (`hasAiconverter: false`).
  - `site:aiconverter.app bank statement`: ten indexed pages
    (`10 results`), `/bank-statement-pdf-to-csv/` first —
    indexed-but-absent still holds.
  - Product page HTTP 200, still "Preview before payment", "Pricing
    starts at ₹399 for up to 25 pages" (₹399/25, ₹799/100, ₹1,399/500)
    — no free full-conversion anchor.
- Updated `ops/serp-wedge-evidence.md`: appended the dated 2026-08-22
  re-verification snapshot (original 2026-08-09/14/20 records
  preserved), updated the intro to note the 2026-08-22 re-verification.

## Checks

- Live SERP reads from a fresh anti-detection browser session (2026-08-22) —
  all as recorded above.
- No code, pricing, or payment behavior changed; docs only
  (`ops/serp-wedge-evidence.md`, this report).
