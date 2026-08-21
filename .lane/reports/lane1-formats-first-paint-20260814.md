# Lane evidence — aiconverter-app lane 1 — Formats blank first paint

**Item:** Eliminate the blank first paint on the Formats route
(research-desk 2026-08-06, risk: amber, authorized-by-nish)
**Branch:** `lane1/formats-first-paint-20260814`
**Run date:** 2026-08-14

## Verdict

**The source fix is complete and already merged on `origin/main` (PR #20,
`0f1392e`, plus drift guard `3efd78b` and live gate `7310424`), all local
gates are green, but the blank first paint is STILL LIVE on production
because the fixed bundle has never been deployed.** Re-verified today
(2026-08-14, cache-busted): `https://aiconverter.app/formats/` still serves
the pre-fix 8,301-byte page — no inline `<style>`, render-blocking
`<link rel="stylesheet" href="/legal.css">` still in the head, ETag
`0201e52a74fc5b07991fcddd1d592e38` unchanged. The fleet live stress gate
fails 2/2 rounds on `formats-blank-first-paint`.

No lane credential can deploy: the fleet Cloudflare token still 403s every
Pages endpoint (re-verified today), `wrangler` is unauthenticated on this
VPS, no deploy workflow exists in the repo, and the fleet release policy
for this product is `off` (today's dry run: "would deploy 2c99375c (last
good: 48b098ee), all required checks green" — but disarmed). The item
closes only after one Cloudflare Pages deploy of a clean `origin/main`
build (see "Remaining step", below).

## Live verification 2026-08-14 (credential-free)

- `https://aiconverter.app/formats/?cb=20260814` (cache-busted): HTTP 200,
  body exactly **8,301 bytes** — the pre-`0f1392e` page. Zero `<style>`
  tags; `<link rel="stylesheet" href="/legal.css">` present in the head
  (render-blocking); ETag `0201e52a74fc5b07991fcddd1d592e38` unchanged
  from the 2026-08-12 closeout evidence.
- Live bundle still `assets/index-Dqg0j7kd.js` (pre-fix), matching the
  fleet release-state marker `assets/index-Dqg0j7kd.js` at sha
  `48b098eea3b0545dea370a7021f185035186ef69`.
- `STRESS_ROUNDS=2 npm run stress:live` against production: 2/2 rounds
  fail with `formats-blank-first-paint` on `/formats`; all other checked
  routes pass (/, /api/config, /api/health, /llms.txt, /about, /security,
  /privacy, /data-retention). p95 727ms.

## Local source verification 2026-08-14 (this branch, base `origin/main` c8409f9)

- `public/formats/index.html` (13,967 bytes): inline critical `<style>`
  present in head, no stylesheet link in head, `/legal.css` loaded after
  content. Byte-identical to `origin/main` (empty `git diff`).
- `tests/seo-static-regression.test.mjs`: 3/3 pass, including the
  drift-guard test ("formats page inline critical styles cover every class
  the body uses") and the structural test (inline styles present, no
  render-blocking stylesheet in head, `/legal.css` after content).
- Full suite: `node --test tests/*.test.mjs` — **196 pass, 0 fail**.
- `npm run check:pricing` — "Pricing is consistent."
- `npm run build` — green (dist built in 3.45s).
- The fix commits `0f1392e` (fix), `3efd78b` (drift guard),
  `7310424` (live gate) are all ancestors of `origin/main` (verified with
  `git merge-base --is-ancestor`).

## Why the item cannot be closed from a lane (re-verified 2026-08-14)

1. **Nothing left to change in the repo.** The source fix is merged on
   main with guards; the live gap is purely the stale production bundle.
2. **Fleet Cloudflare token still lacks Pages access.** Token from
   `~/.config/fleet-console/cf.env` verifies active, but
   `GET /accounts/f670a698e17bf160c8e4679823e68916/pages/projects/aiconverter`
   returns `403 {"code":10000,"message":"Authentication error"}` (tested
   today with the Authorization header). Same 403 in the fleet release log
   for 2026-08-14 08:56 ("wrangler preflight: wrangler is not
   authenticated after 3 attempts"; "policy is OFF").
3. **No other deploy path.** `wrangler` is not installed in this repo
   (`node_modules/.bin/wrangler` absent); no OAuth session exists
   (`~/.wrangler` has no config); no deploy workflow in
   `.github/workflows/` (only ci.yml, review-gate.yml, secret-scan.yml);
   GitHub Pages API 404s (project not connected via GitHub integration,
   per baseline evidence 2026-08-12).
4. **Fleet release is disarmed for this product.**
   `release-policy-aiconverter-app.txt` = `off`;
   `fleet-release-last-run.json` (2026-08-14T08:55:56) =
   `{"aiconverter-app": {"action": "dry-run-disarmed", "sha":
   "2c99375c0d401386faf43bb25a66d97fd3658475"}}`; fleet-release.log
   2026-08-14T08:56:12: "would deploy 2c99375c (last good: 48b098ee) |
   checks: all required checks green | [dry-run] policy is OFF, so a real
   run would have done NOTHING". Enabling policy is a control-plane
   decision outside a lane's scope.

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
action); the fleet release dry run already reports all required checks
green, so an armed run would deploy the fix automatically.

## Checks on this lane (2026-08-14)

- `npm run check:pricing` — Pricing is consistent.
- `node --test tests/*.test.mjs` — 196 pass, 0 fail.
- `npm run build` — green.
- Live `/formats/` (cache-busted) — still the pre-fix 8,301-byte page;
  `npm run stress:live` fails on `formats-blank-first-paint` 2/2 rounds.
