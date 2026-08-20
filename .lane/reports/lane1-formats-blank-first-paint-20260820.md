# Lane evidence — aiconverter-app lane 1 — Formats blank first paint (2026-08-20)

**Item:** Eliminate the blank first paint on the Formats route
(research-desk 2026-08-06, risk: amber, authorized-by-nish)
**Branch:** `lane1/formats-blank-first-paint` (this re-verification run)
**Run date:** 2026-08-20

## Verdict

**The source fix is complete, already merged on `origin/main` (PR #20,
`0f1392e`, plus drift guard `3efd78b` and live gate `7310424` — all
verified ancestors of HEAD), all local gates are green, but the blank
first paint is STILL LIVE on production because the fixed bundle has
never been deployed.** Re-verified today (2026-08-20, cache-busted):
production still serves the pre-fix 8,301-byte page with no inline
`<style>`; ETag `0201e52a74fc5b07991fcddd1d592e38` is byte-identical to
the 2026-08-12, 2026-08-14, and 2026-08-15 lane evidence. The fleet live
stress gate fails 12/12 rounds on `formats-blank-first-paint`. No deploy
path exists from a lane today: the fleet release policy for this product
is still `off` (disarmed), and the fleet Cloudflare token still 403s
every Pages endpoint (re-verified live below). This is the same
conclusion the 2026-08-12, 2026-08-14, and 2026-08-15 lane runs reached;
nothing has changed in the deploy gap.

## Re-verification 2026-08-20 (this run, branch `lane1/formats-blank-first-paint`)

- Worktree: `/home/nish/workspaces/agent-worktrees/aiconverter-app-lane1-20260820-163034`
- Branched from `origin/main` at `75909de` (fresh).
- `git merge-base --is-ancestor` for `0f1392e`, `3efd78b`, `7310424` —
  **all PASS**.
- `public/formats/index.html` (13,967 bytes): inline critical `<style>`
  in the head, no `<link rel="stylesheet">` in the head (the `/legal.css`
  link lives at line 382, after `</head>` at line 268), byte-identical
  to `origin/main`.
- `node --test tests/*.test.mjs` — **220 pass, 0 fail**
  (includes the drift-guard test and the structural test).
- `node scripts/check-pricing.mjs` — "Pricing is consistent."
- `node_modules/.bin/vite build` (npm not on PATH on this VPS) — green;
  `dist/formats/index.html` (13,967 bytes) has inline critical styles,
  no render-blocking stylesheet in head, `/legal.css` after content.
- Live `curl -s "https://aiconverter.app/formats/?cb=20260820-lane1-verify2"`
  — body exactly **8,301 bytes**, `grep -c "<style>"` = 0,
  `grep -c "legal.css"` = 0. ETag `0201e52a74fc5b07991fcddd1d592e38`
  (unchanged from 2026-08-12, 2026-08-14, 2026-08-15 evidence).
- `node scripts/stress-live.mjs` — **fails 12/12 rounds** on
  `formats-blank-first-paint` for `/formats` (elapsed 46-67ms each).
- Cloudflare Pages probe: `GET /accounts/<acct>/pages/projects/aiconverter`
  with fleet token from `~/.config/fleet-console/cf.env` returns
  **HTTP 403** (same Workers-only scope as 2026-08-15; no Pages:Edit).

## Live verification 2026-08-20 (credential-free)

- `https://aiconverter.app/formats/?cb=20260820-lane1` (cache-busted):
  HTTP 200, body exactly **8,301 bytes** — the pre-`0f1392e` page. Zero
  `<style>` tags in the head; no `/legal.css` reference at all in the
  pre-fix bundle; ETag `0201e52a74fc5b07991fcddd1d592e38` unchanged from
  the 2026-08-12, 2026-08-14, and 2026-08-15 closeout evidence.
- `node scripts/stress-live.mjs` against production: **12/12 rounds
  fail** with `formats-blank-first-paint` on `/formats` (elapsed
  46-67ms each); every other checked route passes
  (/, /api/config, /api/health, /llms.txt, /about, /security, /privacy,
  /data-retention; negative checks 400 as expected).

## Local source verification 2026-08-20 (this worktree, base `origin/main` 75909de)

- `public/formats/index.html` (13,967 bytes): inline critical `<style>`
  present in the head, no stylesheet link in the head, `/legal.css`
  loaded after content. Byte-identical to `origin/main` (clean `git
  status`).
- Fix commits verified as ancestors of HEAD: `0f1392e`, `3efd78b`,
  `7310424` all `IS ancestor`.
- `node --test tests/*.test.mjs` — **220 pass, 0 fail** (includes the
  drift-guard test: inline critical styles cover every class the body
  uses, and the structural test: inline styles present, no
  render-blocking stylesheet in head, `/legal.css` after content).
- `node scripts/check-pricing.mjs` — "Pricing is consistent."
- `node_modules/.bin/vite build` — green; `dist/formats/index.html`
  (13,967 bytes) has inline critical styles, no render-blocking
  stylesheet in the head, and `/legal.css` after content.

## Why the item cannot be closed from a lane (re-verified 2026-08-20)

1. **Nothing left to change in the repo.** The source fix is merged on
   main with guards; the live gap is purely the stale production bundle.
2. **Fleet Cloudflare token still lacks Pages access.** Token from
   `~/.config/fleet-console/cf.env` (CLOUDFLARE_API_TOKEN,
   CLOUDFLARE_ACCOUNT_ID) is unchanged from the 2026-08-15 run; this run
   re-verified `GET /accounts/<acct>/pages/projects/aiconverter` returns
   **HTTP 403** — same Workers-only scope, no Pages:Edit.
3. **Fleet release policy for this product is still `off`
   (disarmed).** `/home/nish/workspaces/agent-state/lanes/release-policy-aiconverter-app.txt`
   = `off`;
   `/home/nish/workspaces/agent-state/lanes/fleet-release-last-run.json`
   (2026-08-17T17:37:00) =
   `{"aiconverter-app": {"action": "disarmed"}}` — a real release run
   would do nothing for this product even with a capable token.
4. **No other deploy path.** `wrangler` is not installed on this VPS
   (`which wrangler` empty); no OAuth session exists; no deploy
   workflow in `.github/workflows/` (only `ci.yml`, `review-gate.yml`,
   `secret-scan.yml` — `review-gate.yml` only mentions "deploy" as a
   review-scope keyword); GitHub Pages integration not connected. The
   fleet `auto-deploy` machinery targets other products; enabling or
   re-pointing it is a control-plane decision outside a lane's scope.
   `npm` is also not on PATH on this VPS; `node_modules/.bin/vite`
   builds correctly, but the deploy step cannot be run from a lane.

## Remaining step to close the item (Nish-held)

One Cloudflare Pages deploy of a clean `origin/main` build with a
Pages:Edit-capable credential, then rerun the gate and confirm green:

```bash
# from a clean origin/main checkout, with a Pages:Edit credential
npm run build
SAFE_DEPLOY_APPROVED='pages deploy dist --project-name aiconverter --branch main' \
  wrangler pages deploy dist --project-name aiconverter --branch main
npm run stress:live   # expect: no formats-blank-first-paint failure
```

Expected post-deploy check: `/formats/` body >=13,967 bytes with inline
critical styles in the head and `/legal.css` moved after the content.
Alternatives: grant the fleet token Account > Cloudflare Pages > Edit
and flip `release-policy-aiconverter-app.txt` to `on`
(Nish/control-plane action) — the fleet release dry runs already report
all required checks green, so an armed run would deploy the fix
automatically.

## Checks on this lane (2026-08-20)

- `node scripts/check-pricing.mjs` — Pricing is consistent.
- `node --test tests/*.test.mjs` — 220 pass, 0 fail.
- `node_modules/.bin/vite build` — green; fixed `dist/formats/index.html`
  verified.
- Live `/formats/` (cache-busted) — still the pre-fix 8,301-byte page;
  `node scripts/stress-live.mjs` fails on `formats-blank-first-paint`
  12/12 rounds.
- ETag `0201e52a74fc5b07991fcddd1d592e38` byte-identical to 2026-08-12,
  2026-08-14, and 2026-08-15 lane evidence.
- Cloudflare Pages probe with fleet token — HTTP 403 (no Pages:Edit).

## Files touched

Only this evidence report at
`.lane/reports/lane1-formats-blank-first-paint-20260820.md`. No source
file in the repo was modified — the source fix is already on
`origin/main` and the deploy gap is Nish-held. The branch
`lane1/formats-blank-first-paint` carries this docs-only commit so the
re-verification has a permanent record.
