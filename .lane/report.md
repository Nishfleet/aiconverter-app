# Lane evidence — aiconverter-app lane 1

## 2026-08-11 — dogfood 3af46f8a2040: Slow rendered load on home (re-verification)

**Verdict: the finding is STILL LIVE on production. The code fix (PR #22,
`88e3d3c`, sendBeacon) is merged to main but has never been deployed. The
deploy still cannot be performed by any VPS agent (verified today): no
wrangler session, the fleet Cloudflare token still lacks Pages:Edit, and the
fleet releaser refuses the first release without a known-good baseline. The
item closes only after one human Pages:Edit deploy.**

### The finding

`runs/20260808T074205Z-msk2fl3n.json` reported "Slow rendered load on home"
(dogfood 3af46f8a2040): the rendered audit reached network idle in 27423ms
(25s network-idle cap + fallback waits) on 2026-08-08, and timed out at
25000ms again on 2026-08-09.

### Root cause

The home page sends a `page_view` funnel beacon on mount via
`fetch("/api/funnel-event", { method: "POST", keepalive: ... })`. On the
Cloudflare edge, Chromium receives the 200 response but never emits
`requestfinished` for that keepalive fetch, so the page never reaches network
idle and the rendered-load audit hangs to its 25s cap.

### Fix (merged, undeployed)

PR #22 / commit `88e3d3c` ("fix: stop the home page from never reaching
network idle") switches the beacon to `navigator.sendBeacon()` (which
Chromium reports as finished) with a plain non-keepalive `fetch()` POST
fallback. Present in `origin/main` today at `33d3cb0`.

### Re-verification 2026-08-11 (Chromium headless, same engine semantics: `page.goto` `networkidle` wait, 25s cap)

Live https://aiconverter.app/ — bundle still `assets/index-Dqg0j7kd.js`
(280,475 bytes: `keepalive` present, zero `sendBeacon`):

- 3/3 fresh runs: network idle **TIMED OUT at the 25s cap**; the funnel-event
  POST's `requestfinished` **never fires**.
- Root cause pinned in a full request trace: every other request finished
  (bundle +342ms, woff2 fonts ~+670ms, `/api/config` +670ms,
  `/api/pricing-preview` +1067ms). The ONLY request still unfinished 3s after
  the cap is `POST /api/funnel-event` (started +418ms, HTTP 200 received,
  `requestfinished` never fires). That single in-flight request is what
  blocks network idle until the 25s cap — the exact 27423ms behavior from
  the original dogfood run.

Local build of `origin/main` at `33d3cb0` (`assets/index-7zU5-aJu.js`,
279,607 bytes: `sendBeacon` present, zero `keepalive`):

- Network idle reached at **1202ms** even with +350ms CDP network latency;
  the sendBeacon funnel POST reports `requestfinished = true`.
- Repo gates green: `npm run check:pricing` consistent, `node --test
  tests/*.test.mjs` 106/106 pass, `npm run build` green.

### Why the item cannot be closed from a lane (verified 2026-08-11)

1. `wrangler whoami` → "You are not authenticated. Please run `wrangler
   login`." — no OAuth session exists on this VPS and the environment is
   non-interactive.
2. Fleet `CLOUDFLARE_API_TOKEN` (loaded by `fleet-release.timer` from
   `~/.config/fleet-console/cf.env`): token verify succeeds, but
   `GET /accounts/<account>/pages/projects/aiconverter` returns
   `{"errors":[{"code":10000,"message":"Authentication error"}]}` — the
   token still lacks Account > Cloudflare Pages > Edit (Workers-only scope).
3. Fleet release machinery is now ARMED (`release-policy-aiconverter-app.txt`
   = "on") but the 2026-08-11T00:50:40 run refused with "needs Nish: no
   known-good release baseline - schema compatibility of 33d3cb04 is unknown
   - code-only release REFUSED until a baseline is recorded" (no
   `release-state-aiconverter-app.json` exists; the first release must be
   supervised). Even if a baseline existed, (2) would still block the Pages
   deploy.

### Remaining step to close the item (Nish-held)

One Cloudflare Pages:Edit deploy of a clean `origin/main` build, then rerun
the dogfood batch:

```bash
# from a clean origin/main checkout, with a Pages:Edit credential
SAFE_DEPLOY_APPROVED='pages deploy dist --project-name aiconverter --branch main' \
  wrangler pages deploy dist --project-name aiconverter --branch main
```

Alternative: grant the fleet token Account > Cloudflare Pages > Edit and
supervise the first fleet release (records the baseline, then all subsequent
merged fixes deploy automatically). After deploy, the rendered-load audit
should clear — expect network idle ~1–2s on the fixed bundle.

### Checks on this lane

- `npm run check:pricing` — Pricing is consistent.
- `node --test tests/*.test.mjs` — 106 pass, 0 fail.
- `npm run build` — green; fixed bundle `assets/index-7zU5-aJu.js`.
- Live bundle re-fetched twice today — unchanged `assets/index-Dqg0j7kd.js`.

## 2026-08-11 — WeLikeTools listing + xix.ai paid/decline decision (re-verification, item c716f1de42)

**Verdict: the item's research deliverable is complete and re-verified live on
2026-08-11; both venue decisions and kits are recorded in
`ops/launch-venues.md` (this run's PR). Both venues still host exact-category
competitor tools while aiconverter.app is absent. The remaining steps are
Nish-held: the free WeLikeTools submission (Google sign-in) and the xix.ai
$9.90 paid/decline spend decision. This supersedes PR #30, whose branch
(`lane1/weliketools-xix-listing`) predates the #40 re-verification merge and
never landed.**

### Re-verification (all credential-free, live 2026-08-11)

WeLikeTools:

- Search `q=aiconverter` → "Found 0 results / No tools found" (HTTP 200) — no
  duplicate, no aiconverter.app listing.
- Exact-category competitor still live: Bank Statement Engine
  (https://weliketools.com/tool/bankstatementengine, published 2026-07-12,
  Category: Business & Finance, Pricing: Free).
- `/submit` still gates behind Google sign-in ("Log in to Submit" /
  "Log in with Google") — free, no fee or paid tier mentioned.

xix.ai:

- Site search `q=aiconverter` → "No results found in the search" (HTTP 200);
  `/tool/ai-converter.html` → 404.
- Exact-term category page still live and still competitor-occupied:
  "PDF Bank Statements Converter"
  (https://xix.ai/tool/pdf-bank-statements-converter.html, listed 2025-09-08,
  current tool aibankparser.com; tags pdf-csv-converter /
  bank-statement-parser / financial-data-processing-tool).
- `/submit` still payment-gated: "$9.90", "no queue, listed within 48 hours",
  account sign-in required (graphic captcha at payment step, scout-verified
  2026-08-09).

Product baseline (aiconverter.app, 2026-08-11): `/`, `/llms.txt`,
`/bank-statement-pdf-to-csv/`, `/sample-csv/`, `/trust/`, `/formats/` all HTTP
200; `/pricing/` and `/receipt-to-csv/` still 404 (PR #42 for pricing still
open, undeployed) — no kit claims those routes.

### Decisions recorded (dated 2026-08-10, re-verified 2026-08-11)

- WeLikeTools: **SUBMIT — manual submission by Nish (free, no fee)**; kit
  copy-paste ready in `ops/launch-venues.md`.
- xix.ai: **PAID listing at $9.90 recommended; declined for agent-executed
  submission** — the $9.90 spend and the submission are Nish's human actions;
  the dated decision line flips to SUBMITTED or DECLINED once Nish decides.

### Why the item cannot be closed from a lane (unchanged policy)

Both venues are `automation_disposition: unknown` in the fleet venue policy
ledger (`agent-state/growth-loop/venue-policy.json`), so `venue-claim claim`
exits 4 for each; the xix.ai listing additionally requires a $9.90 payment.
Per fleet policy, account actions and spend stay with Nish.

### Checks on this lane

- Live HTTP checks for both venues' search/submit/category/competitor pages
  (2026-08-11) — all as recorded above.
- No code changed; docs only (`ops/launch-venues.md`,
  `.lane/report.md`).

---

# 2026-08-11 — Toolbit.ai launch venue (re-verification packet)

**Verdict: listing recorded as SUBMIT (free plan first, manual by Nish); the
actual Toolbit submission is a human account action, same as the other four
venues. Packet delivered the re-verified decision record + submission kit on
main-track via PR #49.**

### What was done (all live-verified 2026-08-11)

- Fresh branch `lane1/toolbit-listing-20260811` from origin/main (405e3b2).
- `ops/launch-venues.md`: added Toolbit.ai decision (dated 2026-08-10,
  re-verified 2026-08-11) + manual submission kit + fleet re-verification
  ledger section; header now covers all five venues.
- Live checks: Toolbit search `q=aiconverter` → no aiconverter.app result
  (unrelated only); `/ai-tool/ai-converter` 404; StatementSheet
  (`/ai-tool/statementsheet`, Data Extraction, 9.5K visits, Paid) and Rocket
  Statements (`/ai-tool/rocketstatements` — slug CHANGED since 2026-08-10,
  old `/ai-tool/rocket-statements` now 404) both still live; `/submit` paid
  plans unchanged (Launch Tool $29 one-time, Update $19, Advertise from $39,
  Guest Post $39) + free FAQ "reviewed in up to 3 days"; `/submit/tool?plan=free`
  renders sign-in wall; `/launch-badge` 404; ToS §7 (last updated 2026-07-20)
  still prohibits robots/spiders/automatic access.
- Policy: `agent-state/growth-loop/venue-policy.json` (updated 2026-08-08)
  still has no toolbit.ai entry → `automation_disposition: unknown` →
  `venue-claim` exits 4; ToS §7 is Product-Hunt-class prohibition — flagged
  for the venue research desk in the doc (ledger not modified; outside this
  worktree's scope).
- Kit canonical links all HTTP 200; `/pricing/` and `/receipt-to-csv/` still
  404 (not claimed).

### Outcome

- PR #49 (https://github.com/nish3451/aiconverter-app/pull/49): MERGEABLE,
  all CI green (Build, Gitleaks, Pricing check, Unit tests, classify).
- Stale PR #34 (`lane1/toolbit-listing`, conflicting, 2026-08-10 content)
  annotated as superseded by #49.
- Gates run: `npm run check:pricing` pass, `node --test tests/*.test.mjs`
  106/106 pass, `npm run build` pass.

### Nish-held next action

Sign in at toolbit.ai (Google/email), submit via the kit (free Launch Tool $0
first), embed the Launch Badge snippet on aiconverter.app (tiny deploy — note
Pages:Edit deploy still blocked per the finding above), then update
`ops/launch-venues.md` with the public tool URL. The $29 paid launch remains a
deferred commercial decision.
