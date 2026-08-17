# Lane evidence — aiconverter-app lane 1

## 2026-08-17 — dogfood 3af46f8a2040: Slow rendered load on home (re-verification)

**Verdict: code fix still merged on `origin/main` and re-verified locally on a
fresh build; production bundle STILL ships the broken `keepalive` beacon.
Closing the item is blocked on a Cloudflare Pages deploy that no VPS agent
can perform (no Pages:Edit credential, release policy OFF). Re-verification
follows the previous run (#98 on 2026-08-15); no code change needed on this
pass.**

### Finding (unchanged from 2026-08-15)

`runs/20260808T074205Z-msk2fl3n.json` reports "Slow rendered load on home"
(dogfood 3af46f8a2040). The rendered-load audit waits for Chromium network
idle and times out after 25s on the home page (27423ms on 2026-08-08,
27000ms on 2026-08-09, same on every re-run since).

### Fix (merged, unchanged)

PR #22 / commit `88e3d3c` — switch the `page_view` funnel beacon from a
keepalive `fetch()` POST to `navigator.sendBeacon()`, which Chromium reports
as a finished request and lets the page reach network idle. Regression
test: `tests/funnel-telemetry.test.mjs`.

### Re-verification 2026-08-17

Re-ran the evidence the prior lane (#98) established, against the current
`origin/main` (`c9a2f7a`, a few `docs(lane)` PRs ahead of `88e3d3c`).

- `src/main.jsx` (lines 230–244): still uses
  `navigator.sendBeacon("/api/funnel-event", new Blob([payload], { type: "application/json" }))`
  with a plain non-keepalive `fetch()` POST fallback. No `keepalive` left in
  the beacon path.
- `tests/funnel-telemetry.test.mjs`: regression test asserts the same
  `sendBeacon` shape and explicitly rejects any `keepalive` reuse.
- `node --test tests/*.test.mjs`: **196 pass, 0 fail** (was 106 in the prior
  re-verification; +90 tests from intervening product work, all green).
- `./node_modules/.bin/vite build`: green, fresh bundle
  `dist/assets/index-DCc9mPt9.js` contains
  `navigator.sendBeacon("/api/funnel-event", new Blob([n], {type:"application/json"}))`
  and **no `keepalive`**.
- Staged manual build at
  `agent-state/lanes/fleet-release-work/aiconverter-app-manual-88e3d3c/dist/assets/index-7zU5-aJu.js`
  (commit `88e3d3c`, untouched): also contains `sendBeacon`, no `keepalive`.

### Live production re-check (this run)

`curl -sS https://aiconverter.app/` → 200 in 0.3s, references
`assets/index-Dqg0j7kd.js` (same hash the prior re-verification captured on
2026-08-15 — i.e. the production bundle hash has not changed since then).

`curl -sS https://aiconverter.app/assets/index-Dqg0j7kd.js` → contains
`keepalive` and **no `sendBeacon`**. The live home page is still shipping
the pre-fix bundle, so the audit still times out at 25s.

### Why the item stays open

`aiconverter-app` release policy is OFF (no
`agent-state/lanes/release-policy-aiconverter-app.txt`; release-lane
`last run` was `dispatch-failed` on 2026-08-09T23:23:00). Fleet
`CLOUDFLARE_API_TOKEN` lacks Cloudflare Pages:Edit — deploy attempts fail
with Authentication error code 10000 / 403 on
`GET /accounts/.../pages/projects/aiconverter`
(`agent-state/lanes/fleet-release-aiconverter-app-last-deploy.log`,
2026-08-09T03:29). `wrangler` OAuth token expired 2026-08-04
(`wrangler whoami` → "Not logged in … token has expired").

Closing the dogfood item therefore requires someone holding Pages:Edit on
the `aiconverter` project (Nish via the safe-deploy wrapper) to deploy
`origin/main` to Pages, e.g.:

```bash
npm ci && npm run build
wrangler pages deploy dist --project-name aiconverter --branch main
```

A prebuilt `88e3d3c` artifact already sits at
`agent-state/lanes/fleet-release-work/aiconverter-app-manual-88e3d3c/`
ready to copy into `dist` and ship. After deploy, re-run the rendered-load
audit against `https://aiconverter.app/` — expect network idle in ~1–2s
and zero findings.

### Lane protocol notes

- Branch: `lane1/home-rendered-load-reverify-20260817` off `origin/main`
  (c9a2f7a). Only this report is added; no product code is touched on a
  re-verification pass.
- Claims: `agent-state/lanes/aiconverter-app/lane-1.json` →
  `claims = [".lane/reports/lane1-home-rendered-load-reverify-20260817.md"]`
  (written via temp file + rename, other fields untouched).
- PR: not opened — re-verification-only change in an existing fixed item
  does not warrant a product PR; the next merge is the Pages deploy.

### Checks on this lane

- `git log -p src/main.jsx` from `88e3d3c` — diff unchanged on origin/main.
- `node --test tests/*.test.mjs` — 196 pass, 0 fail.
- `./node_modules/.bin/vite build` — green; fresh bundle
  `dist/assets/index-DCc9mPt9.js` contains `sendBeacon`, no `keepalive`.
- Live `curl https://aiconverter.app/assets/index-Dqg0j7kd.js` —
  `keepalive`, no `sendBeacon` (same hash as 2026-08-15).
