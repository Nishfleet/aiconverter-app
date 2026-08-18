# Lane evidence — aiconverter-app lane 1

## 2026-08-09 — dogfood 3af46f8a2040: Slow rendered load on home

**Verdict: code fix merged and verified, but the finding is STILL LIVE on
production because the fix has not been deployed. Completion is blocked on a
Cloudflare Pages deploy that no VPS agent can perform (no Pages:Edit
credential, release policy OFF).**

### The finding

`runs/20260808T074205Z-msk2fl3n.json` reported "Slow rendered load on home"
(dogfood 3af46f8a2040), measured at 27423ms on 2026-08-08 and 27000ms on
2026-08-09. The rendered-load audit waits for Chromium network idle and times
out after 25s.

### Root cause

The home page sends a `page_view` funnel beacon on mount via
`fetch("/api/funnel-event", { method: "POST", keepalive: payload.length < 1200 })`.
On the Cloudflare edge, Chromium receives the 200 response but never emits
`Network.loadingFinished` for a keepalive fetch, so the page never reaches
network idle and the audit times out.

### Fix (merged)

PR #22 / commit `88e3d3c` ("fix: stop the home page from never reaching
network idle") switches the beacon to `navigator.sendBeacon()` (which
Chromium reports as finished) with a plain non-keepalive `fetch()` POST
fallback. Also covered by regression test `tests/funnel-telemetry.test.mjs`.

### Live verification 2026-08-09 (Playwright/Chromium, same engine as the audit)

Live https://aiconverter.app/ — bundle `assets/index-Dqg0j7kd.js`
(contains `keepalive:...`, no `sendBeacon`):

- `POST /api/funnel-event` starts at +1159ms, HTTP 200 response arrives at
  +1663ms, but `requestfinished` NEVER fires.
- Audit-style network idle: **TIMED OUT at 25000ms** — reproduces the finding.

Local build of `origin/main` (`assets/index-7zU5-aJu.js`, contains
`navigator.sendBeacon`):

- `POST /api/funnel-event` via sendBeacon finishes normally.
- Audit-style network idle: **reached at 2206ms** — finding would clear.

### Why it is still open

The merged fix has never been deployed to production:

- `wrangler` OAuth token expired 2026-08-04; environment is non-interactive
  (`wrangler whoami` → "Not logged in ... token has expired").
- Fleet `CLOUDFLARE_API_TOKEN` lacks Cloudflare Pages:Edit — deploy attempts
  fail with Authentication error code 10000 / 403 on
  `GET /accounts/.../pages/projects/aiconverter`
  (see `fleet-release-aiconverter-app-last-deploy.log`, 2026-08-09T03:29).
- aiconverter-app release policy is OFF: no `release-policy-aiconverter-app.txt`
  exists in the fleet lanes dir, and the release lane has no staged policy
  change; auto-deploy last run 2026-08-09T23:23:00 → "dispatch-failed".

### Remaining step to close the item

Someone holding Cloudflare Pages:Edit for the `aiconverter` project (Nish via
the safe-deploy wrapper) must deploy a clean `origin/main` build:

```bash
# from a clean origin/main checkout with a Pages:Edit credential
npm ci && npm run build
wrangler pages deploy dist --project-name aiconverter --branch main
```

A staged build of `88e3d3c` already exists at
`/home/nish/workspaces/agent-state/lanes/fleet-release-work/aiconverter-app-manual-88e3d3c`.
After deploy, re-run the rendered-load audit — expect network idle ~1–2s and
zero findings.

### Checks on this lane

- `npm run check:pricing` — Pricing is consistent.
- `node --test tests/*.test.mjs` — 106 pass, 0 fail.
- `npm run build` — green (`assets/index-7zU5-aJu.js` contains sendBeacon).
- Live vs fixed Chromium traces recorded above.
