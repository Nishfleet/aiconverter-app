# Lane evidence — aiconverter-app lane 1 — Landing-page converter intent into preselected upload flow (2026-08-20)

**Item:** Carry landing-page converter intent into a preselected upload flow
(scout 2026-08-09, risk: amber, traction, unr)
**Branch:** `lane1/landing-intent-preselect-20260820` (from fresh `origin/main` 75909de)
**Run date:** 2026-08-20

## Verdict

**The source fix is complete, already merged on `origin/main` (PR #56,
commit `76014ef`, plus PR #70 `3ec9230` making the homepage popular-request
chips actionable intent links), and all local gates are green — but
production still runs the pre-feature bundle.** Re-verified live today
(2026-08-20, cache-busted): production serves bundle
`assets/index-Dqg0j7kd.js`, which contains ZERO intent-preselect logic
(no `URLSearchParams({converter:...output:...})` URL builder, no
`searchParams.toString` call), and every static landing-page CTA still
points to plain `/` with no `?converter=&output=` intent. A Pages deploy
lane (`.github/workflows/deploy.yml`, commit `07ad709`) now lives on
`origin/lane1/deploy-workflow-20260820` (one commit ahead of
`origin/main`), but it is NOT merged into main, and even when merged it
will stay red until `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID` are
provisioned as repo secrets. This lane therefore lands the point-in-time
re-verification report via PR, mirroring the
2026-08-15 closeout for this same item (PR #120 / commit `0fbdfde`) and
the 2026-08-20 formats-blank-first-paint / Product Hunt / BetaList /
Capterra / Toolify / SaaSHub / Futurepedia-TAAFT / Uneed re-verification
pattern.

## The deliverable is still on main (unchanged since 2026-08-11)

- Commit `76014ef` ("feat: carry landing-page converter intent into a
  preselected upload flow (#56)") is an ancestor of `origin/main`
  (merged 2026-08-11).
- Commit `3ec9230` ("ux: make homepage popular-request chips
  actionable intent links (#70)") is also on main (merged 2026-08-12).
- Regression coverage: `tests/landing-intent-regression.test.mjs`
  (6 tests) + `tests/popular-requests-links.test.mjs` (5 tests).
- Scope: `src/main.jsx` reads `?converter=&output=` via
  `converterIntentFromUrl()` (only live converters, output validated
  against `capableOutputFormats`, bank advanced formats auto-expand
  details), preseeds `selectedId`/`outputFormat` state, rewrites the
  upload target copy via `uploadTargetCopyFor()`, and carries
  `intentConverter`/`intentOutput` into the funnel `page_view` event.
  Nine converter landing pages under `public/` deep-link
  `?converter=<id>&output=<format>`, and
  `src/conversion-catalog.js`'s `conversionRequestHref()` builds
  `/?converter=<id>&output=<format>` for the homepage's popular-request
  chip row.

## Live re-verification 2026-08-20 (this run, credential-free)

- `https://aiconverter.app/?cb=20260820-lane1-intent` → still serves
  bundle `assets/index-Dqg0j7kd.js` (pre-PR-#56). ETag
  `7b52352fa8fb63ac2dd99a42be59e9a1`.
- Live bundle diff (downloaded `index-Dqg0j7kd.js`, 280,475 bytes):
  - Contains only ONE `URLSearchParams(window.location.search)` site
    (the funnel-event capture, present on every app build).
  - Does NOT contain `URLSearchParams({converter:...output:...})` (the
    `conversionRequestHref` builder).
  - Does NOT contain any `searchParams.toString(` call (the URL
    serialization used by the chip href).
  - Conclusion: production cannot preselect a converter from URL params
    and cannot build intent-bearing chip hrefs — the runtime is
    pre-PR-#56 and pre-PR-#70.
- `https://aiconverter.app/bank-statement-pdf-to-csv/?cb=20260820-lane1`
  → the `top-link` "Open converter" still points to plain `/` (no
  `?converter=bank&output=csv`).
- `https://aiconverter.app/pdf-bank-statement-to-quickbooks-csv/?cb=...`
  → still `<a class="top-link" href="/">Open converter</a>` (no
  `?converter=bank&output=quickbooks-csv`).
- `https://aiconverter.app/pdf-bank-statement-to-wave-csv/`, `/xero/`,
  `/convert-bank-statement-to-csv/`, `/scanned-bank-statement-to-excel/`,
  `/credit-card-statement-pdf-to-csv/`,
  `/bank-statement-converter-for-bookkeepers/` → all still point to
  plain `/`.
- `https://aiconverter.app/receipt-to-csv/?cb=20260820-lane1` → the
  inline CTA "try a real receipt in the converter" is MISSING (the
  local copy carries `<a href="/?converter=receipt&amp;output=csv">try
  a real receipt in the converter</a>` per PR #64 / `eb2eeca`, but the
  SSR HTML served from production shows zero matches for that phrase).
- Intent-param probe: `GET /?converter=receipt&output=csv&cb=...` →
  HTTP 200 (no redirect), but production ignores the params because the
  served bundle has no `converterIntentFromUrl` read.

## Local source verification 2026-08-20 (this worktree, base `origin/main` 75909de)

- `git merge-base --is-ancestor 76014ef HEAD` → **true**
  (PR #56 is on main).
- `git merge-base --is-ancestor 3ec9230 HEAD` → **true**
  (PR #70 is on main).
- `node --test tests/landing-intent-regression.test.mjs tests/popular-requests-links.test.mjs`
  → **11/11 pass**, 0 fail.
- Local static landing pages, intent-link counts (text grep):
  - `bank-statement-pdf-to-csv`: `<a class="top-link" href="/?converter=bank&amp;output=csv">`
  - `pdf-bank-statement-to-quickbooks-csv`: `<a class="top-link" href="/?converter=bank&amp;output=quickbooks-csv">`
  - `pdf-bank-statement-to-wave-csv`: `<a class="top-link" href="/?converter=bank&amp;output=wave-csv">`
  - `pdf-bank-statement-to-xero-csv`, `convert-bank-statement-to-csv`,
    `scanned-bank-statement-to-excel`, `credit-card-statement-pdf-to-csv`,
    `bank-statement-converter-for-bookkeepers`: each has the matching
    `<a class="top-link" href="/?converter=bank&amp;output=...">` link.
  - `receipt-to-csv`: 2 `converter=` occurrences (top-link
    `/?converter=receipt&amp;output=csv` + the PR #64 inline
    "try a real receipt" CTA).
- `node node_modules/vite/bin/vite.js build` → green; the freshly built
  bundle `dist/assets/index-CH-6KOMP.js` (283.10 kB, gzip 85.72 kB)
  DOES contain:
  - `URLSearchParams(window.location.search)` (the `converterIntentFromUrl`
    read).
  - `URLSearchParams({converter:e.converterId,output:e.outputId||\`\`})`
    (the `conversionRequestHref` builder for the homepage chip row).

## Why the feature stays undeployed (deploy gate, re-verified this run)

- `origin/main` is at `75909de`; the Pages deploy workflow lives on
  `origin/lane1/deploy-workflow-20260820` (one commit ahead,
  `07ad709 ci: add Cloudflare Pages deploy lane so main reaches
  aiconverter.app`) and is NOT yet merged to `origin/main`:
  ```text
  $ git diff --stat origin/main..origin/lane1/deploy-workflow-20260820
   .github/workflows/deploy.yml | 111 +++++++++++++++++++++++++++++++++++++++++++
   AGENTS.md                    |  21 ++++++++
   2 files changed, 132 insertions(+)
  ```
- Even when `deploy.yml` is merged into main, it will stay red (per
  the workflow's own `Required Pages secrets not provisioned - fail
  loudly` step) until `CLOUDFLARE_API_TOKEN` (Cloudflare Pages:Edit
  template, scoped to the `aiconverter` Pages project's account) and
  `CLOUDFLARE_ACCOUNT_ID` are set as repo secrets; provisioning steps
  are printed by the workflow itself:
  ```text
  gh secret set CLOUDFLARE_API_TOKEN      -R nish3451/aiconverter-app
  gh secret set CLOUDFLARE_ACCOUNT_ID     -R nish3451/aiconverter-app -b <account-id>
  ```
- No other deploy path remains: no `wrangler`/`CLOUDFLARE_*` env on
  this VPS; no GitHub Pages integration connected; the parallel
  re-verification records for 2026-08-20 (formats-blank-first-paint,
  Product Hunt / BetaList, Toolify, SaaSHub, Capterra,
  Futurepedia/TAAFT/Dang.ai, Uneed, WeLikeTools/xix.ai) all confirm
  the same deploy gap and the same GitHub-Actions-as-the-only-publish-
  path conclusion.
- Daily schedule (`cron: "17 3 * * *"`) and `workflow_dispatch` make
  this a self-heal net: once Nish provisions both secrets, the lane
  redeploys on its own within a day — no further code change needed,
  and the 2026-08-14/15/17 closeouts already proved all offline gates
  are green.

## Files touched by this lane

- `.lane/reports/lane1-landing-intent-preselect-20260820.md` — this
  point-in-time re-verification evidence (new file, this lane).

## COMPLETED
