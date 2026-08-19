# Lane report — aiconverter-app lane 1, 2026-08-14: wedge evidence re-verification

Item: `554ff994b0` — "Wedge evidence: core-phrase SERP top-10 is 100%
free-positioned and the product is absent - feed the free-anchor q"

## Verdict

**Re-verified live on 2026-08-14: the wedge evidence claim is still true on
production SERPs, and the free-anchor question it feeds is already decided.**
The core-phrase SERP (`bank statement pdf to csv converter`) still shows a
100% free-positioned page-1 organic while aiconverter.app is absent — despite
being Google-indexed for that exact phrase — and the product page is still
pay-after-preview with no free full-conversion anchor. The rethink epic (E2)
reached its explicit positioning decision on 2026-08-14 (**paid-quality wedge**,
option "B"); this run confirms the SERP evidence that decision rests on is
still live, so no decision change is warranted.

## What was done

- Published lane claims (control-plane, `lane-1.json` `claims` field only)
  before editing.
- Branched `lane1/wedge-evidence-20260814` from fresh `origin/main`
  (`f835203`).
- Live re-verification (fresh anti-detection browser session, Google
  English/US, unauthenticated; rendered DOM + vision):
  - Core phrase page-1: 9/9 organic results free-positioned
    (bankstatementconverter.com, Reddit r/Bookkeeping, founderpath,
    statementconvert, re-cap, razorextract, zamzar, bankstatementwizard,
    YouTube). No paid-after-preview product holds an organic slot. AI
    Overview rendered (never cites aiconverter.app). `hasAiconverter: false`.
  - Exact-phrase variant: 9 results, all free-positioned, aiconverter.app
    absent.
  - `site:aiconverter.app bank statement`: ten indexed pages,
    `/bank-statement-pdf-to-csv/` first — indexed-but-absent still holds.
  - Product page HTTP 200, still "Preview before payment", ₹399/25 pages —
    no free full-conversion anchor.
- Updated `ops/serp-wedge-evidence.md`: added the dated 2026-08-14
  re-verification snapshot (new section, original 2026-08-09 record
  preserved), updated the intro to note the epic's 2026-08-14 positioning
  decision, appended verification notes.

## Note on a citation gap (flagged, not fixed here)

The improvement-loop `epics.md` POSITIONING DECISION entry cites evidence refs
`#29/#45/#79` and names `ops/wedge-evidence.md` — but that exact filename is
NOT on main. The files that actually merged are `ops/serp-wedge-evidence.md`
(#29) plus `.lane/report.md` entries; no `ops/wedge-evidence.md` exists in the
main tree. The decision text is otherwise sound and the underlying evidence is
on main, but the epic's filename reference should be corrected to
`ops/serp-wedge-evidence.md` (or refs #45/#79 should be checked for what they
shipped). Left to the improvement-loop desk; outside this lane's owned files.

## Checks

- Live SERP reads from a fresh anti-detection browser session (2026-08-14) —
  all as recorded above.
- No code, pricing, or payment behavior changed; docs only
  (`ops/serp-wedge-evidence.md`, this report).
