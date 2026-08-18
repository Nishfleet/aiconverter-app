# Lane evidence — aiconverter-app lane 1 — Landing-page converter intent into preselected upload flow (2026-08-15)

**Item:** Carry landing-page converter intent into a preselected upload flow (scout 2026-08-09, risk: amber, traction, unr)
**Branch:** `lane1/landing-intent-preselect-20260815` (from fresh `origin/main` 3b28dcd)
**Run date:** 2026-08-15

## Verdict

**The feature is complete, already merged on `origin/main` (PR #56, commit `76014ef`, 2026-08-11, plus PR #70 `3ec9230` making homepage popular-request chips actionable intent links, 2026-08-12), and all local gates are green — but production still runs the pre-feature bundle because no deploy path exists from a lane.** Re-verified live today (2026-08-15): production serves bundle `index-Dqg0j7kd.js`, which does NOT contain the intent-preselect logic (`converterIntentFromUrl` / `URLSearchParams ... converter/output` param reads), and landing pages still deep-link to plain `/` (`class="top-link" href="/"` with no `converter`/`output` params). The repo's own closeout records for 2026-08-14/15 (formats blank first paint, home rendered load, stale unmatched Dodo event) establish the same deploy gap: the fleet release policy for this product is `off` (disarmed), no `release-policy-aiconverter-app.txt` exists, no Cloudflare Pages credential exists on this VPS, and the repo has no Pages deploy workflow. This lane therefore lands the point-in-time verification report via PR, mirroring the 2026-08-15 Capterra closeout pattern (PR #114).

## The deliverable is already on main

- Commit `76014ef` ("feat: carry landing-page converter intent into a preselected upload flow (#56)") is an ancestor of `origin/main` (merged 2026-08-11).
- Commit `3ec9230` ("ux: make homepage popular-request chips actionable intent links (#70)") is also on main (merged 2026-08-12).
- Regression coverage shipped with the feature: `tests/landing-intent-regression.test.mjs` (6 tests) and `tests/popular-requests-links.test.mjs` (5 tests).
- Scope: `src/main.jsx` reads `?converter=&output=` via `converterIntentFromUrl()` (only live converters, output validated against `capableOutputFormats`, bank advanced formats auto-expand details), preseeds `selectedId`/`outputFormat` state, rewrites the upload target copy via `uploadTargetCopyFor()`, and carries `intentConverter`/`intentOutput` into the funnel `page_view` event. Nine converter landing pages under `public/` deep-link `?converter=<id>&output=<format>`, plus the receipt page inline CTA.

## Live re-verification 2026-08-15 (this run, credential-free)

- `https://aiconverter.app/` → still serves bundle `assets/index-Dqg0j7kd.js`; that bundle contains **zero** intent-preselect logic (no `URLSearchParams` read of `converter`/`output` for preselect, no `converterIntentFromUrl`).
- `https://aiconverter.app/bank-statement-pdf-to-csv/` → the `top-link` "Open converter" still points to plain `/` (no `?converter=bank&output=csv`).
- `https://aiconverter.app/receipt-to-csv/` → the inline CTA carries no `converter=receipt` intent either.
- `https://aiconverter.app/?converter=receipt&output=csv` → HTTP 200, no redirect, no preselect (production ignores the intent params).

## Local source verification 2026-08-15 (this worktree, base `origin/main` 3b28dcd)

- `node --test tests/landing-intent-regression.test.mjs tests/popular-requests-links.test.mjs` → **11/11 pass** (6 intent + 5 chips), 0 fail.
- `npm run build` → green; the freshly built bundle `dist/assets/index-DCc9mPt9.js` (282.87 kB, gzip 85.64 kB) DOES contain the intent logic (`nt()` reading `converter`/`output` via `URLSearchParams`), unlike production's `index-Dqg0j7kd.js`.

## Why the feature stays undeployed (deploy gate, re-verified this run)

- No `.github/workflows` Pages deploy workflow exists in the repo (only `ci.yml`, `review-gate.yml`, `secret-scan.yml`).
- No Cloudflare/Wrangler credentials on this VPS (`~/.cloudflare` absent, no `CLOUDFLARE_*`/`WRANGLER_*` env vars).
- Fleet release policy for aiconverter-app is `off` (disarmed); prior 2026-08-14/15 lane records confirm no `release-policy-aiconverter-app.txt` and no Pages:Edit-capable credential.
- Deploying requires one Cloudflare Pages deploy of a clean `origin/main` build — outside what a lane can perform today.

## Files touched by this lane

- `.lane/reports/lane1-landing-intent-preselect-20260815.md` — point-in-time re-verification evidence (this file).

## COMPLETED
