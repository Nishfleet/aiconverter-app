# Lane report — aiconverter-app lane 1, 2026-08-20: wedge evidence re-verification

Item: `554ff994b0` — "Wedge evidence: core-phrase SERP top-10 is 100%
free-positioned and the product is absent - feed the free-anchor q"

## Verdict

**Re-verified live on 2026-08-20: the wedge evidence claim is still true on
production SERPs.** The core-phrase SERP (`bank statement pdf to csv
converter`) still shows a 100% free-positioned page-1 organic while
aiconverter.app is absent — despite being Google-indexed for that exact
phrase — and the product page is still pay-after-preview with no free
full-conversion anchor. The rethink epic (E2) reached its explicit
positioning decision on 2026-08-14 (**paid-quality wedge**, option "B");
this run confirms the SERP evidence that decision rests on is still live, so
no decision change is warranted. The free-anchor question the record feeds
remains answered: the decision stands.

## What was done

- Published lane claims (control-plane, `lane-1.json` `claims` field only)
  before editing: `ops/serp-wedge-evidence.md`,
  `.lane/reports/lane1-wedge-evidence-20260820.md`.
- Branched `lane1/wedge-evidence-20260820` from fresh `origin/main`
  (`141ab98`).
- Live re-verification (fresh anti-detection browser session, Google
  English/US, unauthenticated; rendered DOM + vision-confirmed screenshots):
  - Core phrase page-1: 9/9 organic results free-positioned
    (bankstatementconverter.com, Reddit r/Bookkeeping, founderpath,
    statementconvert, financefileconverter, bankstatementconverters.ai
    "100% FREE", zamzar "Online and Free", YouTube/Klippa, razorextract).
    No paid-after-preview product holds an organic slot. Sponsored ads in
    this session: DocuClipper, SendItSheets, Lido — paid only.
    AI Overview rendered (cites Microsoft Excel, Tabula, DocuClipper, Reddit
    — never aiconverter.app). "People also search for" suggestions all
    free-anchored. `hasAiconverter: false` (DOM check).
  - Exact-phrase variant: koody.com, bankstatementpdftocsv.com, apify.com,
    bankconv.com, Reddit r/SideProject — all free-positioned,
    aiconverter.app absent (`hasAiconverter: false`).
  - `site:aiconverter.app bank statement`: ten indexed pages,
    `/bank-statement-pdf-to-csv/` first — indexed-but-absent still holds.
  - Product page HTTP 200, still "Preview before payment", ₹399/25 pages —
    no free full-conversion anchor.
- Updated `ops/serp-wedge-evidence.md`: appended the dated 2026-08-20
  re-verification snapshot (original 2026-08-09/14 records preserved),
  updated the intro to note the 2026-08-20 re-verification and the epic's
  standing positioning decision.

## Context notes

- The 2026-08-17 re-verification branch
  (`origin/lane1/serp-wedge-evidence-20260817`) was never merged; the last
  merged evidence on main was 2026-08-14 (#100). This run's snapshot is the
  freshest authoritative record.
- The 2026-08-20 improvement-loop cycle evidence (agent-state
  `aiconverter-app-improvement-loop/epics.md`) notes the paid-quality
  positioning decision is still NOT implemented on the live product
  (no pricing nav, /pricing/ 404, deploy stale). Not this lane's file to
  change; flagged for the loop.

## Checks

- Live SERP reads from a fresh anti-detection browser session (2026-08-20) —
  all as recorded above.
- No code, pricing, or payment behavior changed; docs only
  (`ops/serp-wedge-evidence.md`, this report).
