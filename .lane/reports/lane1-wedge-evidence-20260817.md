# Lane report — aiconverter-app lane 1, 2026-08-17: wedge evidence re-verification

Item: `554ff994b0` — "Wedge evidence: core-phrase SERP top-10 is 100%
free-positioned and the product is absent - feed the free-anchor q"

## Verdict

**Re-verified live on 2026-08-17: the wedge evidence claim is still true on
production SERPs, and the free-anchor question it feeds remains answered.**
The core-phrase SERP (`bank statement pdf to csv converter`) still shows a
100% free-positioned page-1 organic while aiconverter.app is absent — despite
being Google-indexed for that exact phrase — and the product page is still
pay-after-preview with no free full-conversion anchor (body literal "free"
does not appear). The rethink epic (E2) reached its explicit positioning
decision on 2026-08-14 (**paid-quality wedge**, option "B"); this run confirms
the SERP evidence that decision rests on is still live three days after the
2026-08-14 re-check, so no decision change is warranted.

## What was done

- Published lane claims (control-plane, `lane-1.json` `claims` field only)
  before editing — `ops/serp-wedge-evidence.md`,
  `.lane/reports/lane1-wedge-evidence-20260817.md`.
- Branched `lane1/serp-wedge-evidence-20260817` from fresh `origin/main`
  (`c333b14`).
- Live re-verification (fresh anti-detection browser session, Google
  English/US, unauthenticated; rendered DOM + body-text scan):
  - Core phrase page-1: 9/9 organic results free-positioned
    (bankstatementconverter.com, Reddit r/Bookkeeping, founderpath,
    statementconvert, re-cap, financefileconverter, zamzar,
    bankstatementwizard, razorextract). No sponsored slots in this session.
    AI Overview rendered (cites DocuClipper, Bank Statement Converter,
    Smallpdf, Reddit/Tabula — never aiconverter.app). "People also search
    for" is entirely free-anchored. `hasAiconverter: false`.
  - Exact-phrase variant `"bank statement pdf to csv converter"`: organic
    results are BankConv (free), Reddit r/Bookkeeping, bankstatementconverter,
    Smallpdf, DocuClipper, Koody, Apify ("Try for free"), Reddit
    r/SideProject ("...runs entirely in your browser"), bankstatementpdftocsv,
    Nomi, BankToBooks, LinkedIn (ExtractFast). Sponsored ad slots for
    DocuClipper, BankXLSX, Lido above and below the organic block.
    `hasAiconverter: false`.
  - `site:aiconverter.app bank statement`: ten indexed pages,
    `/bank-statement-pdf-to-csv/` first, followed by the other bank-statement
    variant pages plus `/formats/`, `/privacy/`, `/about/`, `/security/`,
    `/refund/`, `/terms/`, and the root. Indexed-but-absent still holds.
  - Product page HTTP 200, still "Preview before payment", ₹399/25 pages,
    body text contains zero occurrences of the literal word "free" — only
    preview-then-pay positioning is presented.
- Updated `ops/serp-wedge-evidence.md`: added the dated 2026-08-17
  re-verification snapshot (new section, the 2026-08-09 and 2026-08-14
  records are preserved untouched), updated the intro to note that the
  evidence is now re-verified live across three sessions
  (2026-08-09, 2026-08-14, 2026-08-17), appended the latest status note.

## Checks

- Live SERP reads from a fresh anti-detection browser session (2026-08-17) —
  all as recorded above.
- Live `https://aiconverter.app/bank-statement-pdf-to-csv/` HTTP 200, body
  literal "free" absent, pricing block intact at ₹399/25 / ₹799/100 /
  ₹1,399/500 — verified.
- Live `site:aiconverter.app bank statement` returns ten indexed pages with
  the exact-core-phrase page first — verified.
- No code, pricing, or payment behavior changed; docs only
  (`ops/serp-wedge-evidence.md`, this report).
