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

## 2026-08-11 — core-phrase SERP wedge evidence (re-verification)

**Verdict: the free-anchor finding is STILL LIVE, and it got worse.** Page-1
organic for `bank statement pdf to csv converter` is still 100%
free-positioned (10/10) and aiconverter.app is still absent — but the
exact-core-phrase landing page has now dropped OUT of the Google-backed
`site:aiconverter.app` set (it was #1 on 2026-08-09; a stable 9-page set
today, twice-confirmed). The page is still HTTP 200 and sitemap-listed; the
deploy block is letting the product's last Google-side visibility floor
decay. Fed the free-anchor question to the rethink epic (E2) in
`ops/serp-wedge-evidence.md`.

### Evidence captured live (2026-08-11T05:1xZ UTC)

- Core phrase, Google-backed organic 1–10: bankstatementconverter.com
  ("Accurately Convert..."), re-cap.com ("Free Convert..."),
  bankstatementconverters.ai ("100% FREE"), FinanceFileConverter, Zamzar
  ("Online and Free"), Reddit r/Bookkeeping thread, Razor Extract ("100% free
  tool"), founderpath.com ("Free"), bankstatementmagic.com ("Free, fast,
  secure"), ocr.ac ("Online OCR"). 100% free-positioned; no aiconverter.app.
- Exact phrase `"bank statement pdf to csv converter"`: 10 organic, all
  free/content-positioned (FinanceFileConverter, bank-statements.co, BankConv
  "Free...", aibankstatementconverters.com "Free AI Tool Online", Nomi how-to,
  BankToBooks, bankstatementpdftocsv.com, pdfbankstatementsconverter.com,
  invoicedataextraction.com); no aiconverter.app.
- `site:aiconverter.app`: 9 pages, twice-confirmed identical — landing page
  `bank-statement-pdf-to-csv/` absent (was #1 on 2026-08-09). Live page HTTP
  200, in sitemap.xml. Bing-backed DDG `site:` still zero results.
- Product position unchanged: free preview + sample CSV; ₹399/₹799/₹1,399;
  `/pricing/` still 404s; no free full-conversion anchor.
- Capture method: google.com directly anti-bot-challenges this VPS IP, so the
  snapshot was read from the rendered DOM of the Google-backed Startpage proxy
  (unauthenticated, US/English), two runs per query, both agreeing. Recorded
  in the evidence file.

### Deliverable

PR #45 (`lane1/serp-wedge-evidence-20260811`): `ops/serp-wedge-evidence.md`
(dated 2026-08-11 snapshot + free-anchor question for epic E2), README index
link, this lane report. Supersedes the unmerged PR #29 (2026-08-09) record.

### Checks on this lane

- `npm run check:pricing` — Pricing is consistent.
- `node --test tests/*.test.mjs` — 106 pass, 0 fail.
- `npm run build` — green (392ms).
