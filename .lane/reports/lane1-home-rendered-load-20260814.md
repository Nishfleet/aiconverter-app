# Lane evidence — aiconverter-app lane 1 — 2026-08-14

## Item: dogfood 3af46f8a2040 — Slow rendered load on home

**Verdict: the code fix for this finding is already merged on main (PR #22 /
`88e3d3c`, re-landed as `684573c` on `lane1/home-rendered-load` and present in
`origin/main` today at `64e5af0`). The finding is STILL LIVE on production
because production still serves the pre-fix bundle — re-verified live today
with the exact audit-engine network-idle method. The deploy remains blocked
from lanes (fleet Cloudflare token still lacks Pages:Edit; verified live
today). The item closes only after one human Pages:Edit deploy of a clean
`origin/main` build, after which the rendered-load audit clears.**

### The finding

`runs/20260808T074205Z-msk2fl3n.json` reported "Slow rendered load on home"
(dogfood 3af46f8a2040): the rendered audit reached network idle in 27423ms on
2026-08-08, and 27000ms on 2026-08-09 (same finding, deduped to the same
marker). The audit engine waits for `page.goto(waitUntil: networkidle0)` with
a 25s cap.

### Root cause (unchanged)

The home page sends a `page_view` funnel beacon on mount via
`fetch("/api/funnel-event", { method: "POST", keepalive: ... })`. On the
Cloudflare edge, Chromium receives the 200 response but never emits
`requestfinished` for that keepalive fetch, so the page never reaches network
idle and the rendered-load audit times out at its 25s cap.

### Fix (merged, undeployed)

PR #22 / commit `88e3d3c` ("fix: stop the home page from never reaching
network idle") switches the beacon to `navigator.sendBeacon()` (which
Chromium reports as finished) with a plain non-keepalive `fetch()` POST
fallback. Present in `origin/main` today (`src/main.jsx:227-245`, regression
test `tests/funnel-telemetry.test.mjs`).

### Re-verification 2026-08-14 (live, same engine method)

Method: Playwright Chromium `page.goto(url, { waitUntil: "networkidle",
timeout: 25000 })` — the same network-idle semantics as the audit engine
(`proof-seo/shared/audit-engine.js` maps `networkidle0` → Playwright
`networkidle`), with per-request `request`/`response`/`requestfinished` event
capture. Browser engine: Playwright Chromium (ms-playwright cache,
chromium-1223/1234).

Live https://aiconverter.app/ (bundle still `assets/index-Dqg0j7kd.js`;
`keepalive` present, zero `sendBeacon`):

- **TIMED OUT at 25012ms** — network idle never reached (reproduces the
  finding, 3rd independent day).
- Full request trace: HTML, bundle, CSS, favicon, 5 woff2 fonts,
  `/api/config`, `/api/pricing-preview` all `requestfinished` by ~565ms.
- **The ONLY request still in flight at the 25s cap is
  `POST /api/funnel-event`** (started +441ms, HTTP 200 received,
  `requestfinished` never fires) — exactly the 27423ms behavior from the
  original dogfood run.

Local fixed build of `origin/main` (fresh `npm run build`; bundle
`assets/index-DCc9mPt9.js`, `sendBeacon` present):

- **Network idle reached at 975ms**, zero unfinished requests; the
  funnel-event beacon finishes normally (404 on the local static server, but
  `requestfinished` fires — the bug is the never-finished request, not the
  status).

### Deploy still blocked from lanes (verified 2026-08-14)

1. Fleet `CLOUDFLARE_API_TOKEN` (`~/.config/fleet-console/cf.env`): token
   verify succeeds (`status: active`) but
   `GET /accounts/<id>/pages/projects/aiconverter` → **403** — the token
   still lacks Account > Cloudflare Pages > Edit.
2. No wrangler on this VPS (`which wrangler` → none); no OAuth session.
3. Release state (`release-state-aiconverter-app.json`) pins the live marker
   to `assets/index-Dqg0j7kd.js` — the pre-fix bundle, as of 2026-08-12.

### Remaining step to close the item (Nish-held)

One Cloudflare Pages deploy of a clean `origin/main` build with a
Pages:Edit-capable credential:

```bash
# from a clean origin/main checkout, with a Pages:Edit credential
npm ci && npm run build
SAFE_DEPLOY_APPROVED='pages deploy dist --project-name aiconverter --branch main' \
  wrangler pages deploy dist --project-name aiconverter --branch main
```

After deploy, re-run the rendered-load audit — expect network idle ~1s and
zero findings. Alternative: grant the fleet token Pages:Edit so merged fixes
deploy automatically.

### Checks on this lane (2026-08-14)

- `npm run check:pricing` — Pricing is consistent.
- `node --test tests/*.test.mjs` — 196 pass, 0 fail.
- `npm run build` — green; fixed bundle `assets/index-DCc9mPt9.js`
  (`sendBeacon` present, zero `keepalive`).
- Live bundle re-fetched today — unchanged `assets/index-Dqg0j7kd.js`.
- Live network-idle reproduction + local fixed-build reproduction recorded
  above; reproduction script kept outside the worktree
  (`/tmp/lane1-aiconverter/repro-network-idle.mjs`).
