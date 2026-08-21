# Lane evidence — aiconverter-app lane 1 — 2026-08-20

## Item: dogfood 3af46f8a2040 — Slow rendered load on home

**Verdict: the fix (PR #22 / `88e3d3c`, on `origin/main` at `141ab98`) is still
NOT deployed. Production still serves the pre-fix bundle
`assets/index-Dqg0j7kd.js` and the finding is STILL LIVE today — re-verified
live with the same audit-engine method (Playwright Chromium
`page.goto(waitUntil: networkidle, 25s cap)`): TIMED OUT at 25007ms, the only
in-flight request being `POST /api/funnel-event` (HTTP 200, never
`requestfinished`). Deploy remains impossible from any lane: the fleet
Cloudflare token still gets 403/`Authentication error [code: 10000]` on
`/accounts/<id>/pages/projects`, and the only other credential file on the VPS
(`~/.config/cloudflare/deploy.env`) contains empty placeholder values. The item
closes only after one human (Nish) Pages:Edit deploy of a clean `origin/main`
build.**

### The finding (unchanged)

`runs/20260808T074205Z-msk2fl3n.json` reported "Slow rendered load on home"
(dogfood 3af46f8a2040): the rendered audit reached network idle in 27423ms on
2026-08-08 (27000ms on 2026-08-09, deduped). The audit engine waits for
`page.goto(waitUntil: networkidle0)` with a 25s cap.

### Root cause (unchanged)

The home page sent a `page_view` funnel beacon on mount via
`fetch("/api/funnel-event", { method: "POST", keepalive: ... })`. On the
Cloudflare edge, Chromium receives the 200 response but never emits
`requestfinished` for that keepalive fetch, so the page never reaches network
idle and the rendered-load audit times out at its 25s cap.

### Fix (merged, still undeployed)

PR #22 / commit `88e3d3c` ("fix: stop the home page from never reaching
network idle") switches the beacon to `navigator.sendBeacon()` (which
Chromium reports as finished) with a plain non-keepalive `fetch()` POST
fallback. Verified present in `origin/main` today at `src/main.jsx:241-259`
(`trackFunnelEvent`), with regression test `tests/funnel-telemetry.test.mjs`.

### Live re-verification 2026-08-20 (same engine method)

Method: Playwright Chromium `page.goto(url, { waitUntil: "networkidle",
timeout: 25000 })` — same semantics as the audit engine — with per-request
`request`/`response`/`requestfinished` capture. Repro script:
`/tmp/lane1-aiconverter/repro-network-idle.mjs`.

Live https://aiconverter.app/ (bundle still `assets/index-Dqg0j7kd.js`;
`keepalive` present, zero `sendBeacon`):

- **TIMED OUT at 25007ms** — network idle never reached (4th independent day).
- All of HTML, bundle, CSS, favicon, 5 woff2 fonts, `/api/config`,
  `/api/pricing-preview` `requestfinished` by ~446ms.
- **The ONLY request still in flight at the 25s cap is
  `POST /api/funnel-event`** (started +445ms, HTTP 200, `requestfinished`
  never fires) — the 27423ms behavior reproduced verbatim.

Local fixed build of `origin/main` (fresh `npm run build`; bundle
`assets/index-CH-6KOMP.js`, `sendBeacon` present, zero `keepalive`):

- **Network idle reached at 774ms**, zero unfinished requests; the
  funnel-event beacon finishes normally (404 on the local static server, but
  `requestfinished` fires — the bug is the never-finished request, not the
  status).

### Deploy still blocked from lanes (verified 2026-08-20)

1. Fleet `CLOUDFLARE_API_TOKEN` (`~/.config/fleet-console/cf.env`): token
   verify succeeds (`status: active`) but
   `GET /accounts/f670a698e17bf160c8e4679823e68916/pages/projects/aiconverter`
   → **403**, and `wrangler pages project list` → **Authentication error
   [code: 10000]** — the token still lacks Account > Cloudflare Pages > Edit.
2. No wrangler binary on the VPS (used `npx wrangler`); no OAuth session in
   `~/.wrangler/state` (only account-id cache).
3. `~/.config/cloudflare/deploy.env` exists but holds empty placeholder
   values for `CLOUDFLARE_API_TOKEN`/`CLOUDFLARE_ACCOUNT_ID` — not usable.
4. Release state (`release-state-aiconverter-app.json`) still pins the live
   marker to `assets/index-Dqg0j7kd.js` (pre-fix bundle, as of 2026-08-12).
5. `.github/workflows/` has no deploy job — deploys are manual only.

### Remaining step to close the item (Nish-held)

One Cloudflare Pages deploy of a clean `origin/main` build with a
Pages:Edit-capable credential:

```bash
# from a clean origin/main checkout, with a Pages:Edit credential
npm ci && npm run build
SAFE_DEPLOY_APPROVED='pages deploy dist --project-name aiconverter --branch main' \
  wrangler pages deploy dist --project-name aiconverter --branch main
```

After deploy, re-run the rendered-load audit — expect network idle ~0.8s and
zero findings. Alternative: grant the fleet token Pages:Edit so merged fixes
deploy automatically.

### Checks on this lane (2026-08-20)

- `npm run build` — green; fixed bundle `assets/index-CH-6KOMP.js`
  (`sendBeacon` present, zero `keepalive`).
- Live network-idle reproduction + local fixed-build reproduction recorded
  above (774ms vs 25007ms timeout).
