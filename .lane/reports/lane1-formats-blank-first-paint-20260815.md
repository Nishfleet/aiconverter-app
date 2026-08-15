# Lane evidence — aiconverter-app lane 1 — Formats blank first paint (2026-08-15)

**Item:** Eliminate the blank first paint on the Formats route
(research-desk 2026-08-06, risk: amber, authorized-by-nish)
**Branch:** none created — no code change exists to ship (see verdict)
**Run date:** 2026-08-15

## Verdict

**The source fix is complete, already merged on `origin/main` (PR #20,
`0f1392e`, plus drift guard `3efd78b` and live gate `7310424` — all verified
ancestors of HEAD), and all local gates are green, but the blank first paint
is STILL LIVE on production because the fixed bundle has never been
deployed.** Re-verified today (2026-08-15, cache-busted): production still
serves the pre-fix 8,301-byte page with no inline `<style>`; ETag
`0201e52a74fc5b07991fcddd1d592e38` is byte-identical to the 2026-08-12 and
2026-08-14 closeout evidence. The fleet live stress gate fails on
`formats-blank-first-paint` (1/1 round, only failure). No deploy path exists
from a lane today: the fleet release policy for this product is still `off`
(disarmed), and the fleet Cloudflare token still 403s every Pages endpoint
(re-verified live below). This is the same conclusion the 2026-08-12 and
2026-08-14 lane runs reached; nothing has changed in the deploy gap.

## Live verification 2026-08-15 (credential-free)

- `https://aiconverter.app/formats/?cb=20260815-lane1` (cache-busted):
  HTTP 200, body exactly **8,301 bytes** — the pre-`0f1392e` page. Zero
  `<style>` tags in the head; ETag `0201e52a74fc5b07991fcddd1d592e38`
  unchanged from the 2026-08-12 closeout evidence.
- `STRESS_ROUNDS=1 npm run stress:live` against production: **1/1 round
  fails** with `formats-blank-first-paint` on `/formats` (elapsed 115ms);
  every other checked route passes (/, /api/config, /api/health, /llms.txt,
  /about, /security, /privacy, /data-retention; negative checks 400 as
  expected). p95 685ms.

## Local source verification 2026-08-15 (this worktree, base `origin/main` 0d017b4)

- `public/formats/index.html` (13,967 bytes): inline critical `<style>`
  present in the head, no stylesheet link in the head, `/legal.css` loaded
  after content. Byte-identical to `origin/main` (clean `git status`).
- Fix commits verified as ancestors of HEAD: `0f1392e`, `3efd78b`,
  `7310424` all `IS ancestor`.
- `node --test tests/*.test.mjs` — **196 pass, 0 fail** (includes the
  drift-guard test: inline critical styles cover every class the body uses,
  and the structural test: inline styles present, no render-blocking
  stylesheet in head, `/legal.css` after content).
- `npm run check:pricing` — "Pricing is consistent."
- `npm run build` — green; `dist/formats/index.html` (13,967 bytes) has
  inline critical styles, no render-blocking stylesheet in the head, and
  `/legal.css` after content. New bundle `assets/index-DCc9mPt9.js`.

## Why the item cannot be closed from a lane (re-verified 2026-08-15)

1. **Nothing left to change in the repo.** The source fix is merged on main
   with guards; the live gap is purely the stale production bundle.
2. **Fleet Cloudflare token still lacks Pages access.** Token from
   `~/.config/fleet-console/cf.env` verifies active
   (`/user/tokens/verify` → `status: active`), but
   `GET /accounts/<acct>/pages/projects/aiconverter` returns
   `403 {"code":10000,"message":"Authentication error"}` — the same
   Workers-only scope documented in prior runs. Pages:Edit is absent.
3. **Fleet release policy for this product is still `off` (disarmed).**
   `release-policy-aiconverter-app.txt` = `off`;
   `fleet-release-last-run.json` (2026-08-15T09:37:00) =
   `{"aiconverter-app": {"action": "disarmed"}}` — a real release run would
   do nothing for this product even with a capable token.
4. **No other deploy path.** `wrangler` is not installed in this repo or on
   this VPS; no OAuth session exists; no deploy workflow in
   `.github/workflows/` (only `ci.yml`, `review-gate.yml`,
   `secret-scan.yml` — `review-gate.yml` only mentions "deploy" as a
   review-scope keyword); GitHub Pages integration not connected. The fleet
   `auto-deploy` machinery targets other products; enabling or re-pointing it
   is a control-plane decision outside a lane's scope.

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

Expected post-deploy check: `/formats/` body ≥13,967 bytes with inline
critical styles in the head and `/legal.css` moved after the content.
Alternatives: grant the fleet token Account > Cloudflare Pages > Edit and
flip `release-policy-aiconverter-app.txt` to `on` (Nish/control-plane
action) — the fleet release dry runs already report all required checks
green, so an armed run would deploy the fix automatically.

## Checks on this lane (2026-08-15)

- `npm run check:pricing` — Pricing is consistent.
- `node --test tests/*.test.mjs` — 196 pass, 0 fail.
- `npm run build` — green; fixed `dist/formats/index.html` verified.
- Live `/formats/` (cache-busted) — still the pre-fix 8,301-byte page;
  `npm run stress:live` fails on `formats-blank-first-paint`.
