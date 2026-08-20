# Lane evidence — aiconverter-app lane 1 — Bing/DDG indexation (2026-08-20)

**Verdict: the Bing/DuckDuckGo zero-indexation finding is STILL LIVE
(re-verified 2026-08-20), and the 2026-08-10 decision still holds: Bing
Webmaster ownership + sitemap submission are manual, Nish-held actions
(account-gated). What this lane delivered: the cleanest agent-side Bing SERP
evidence to date, confirmation that the deploy-path unblock (PR #135) is in
progress, and a ready-to-fire credential-free IndexNow submission script so
the free discovery path runs the moment the Pages deploy lands.**

## Re-verification (all live, 2026-08-20)

- **Bing `site:aiconverter.app` (live SERP fetch) — cleanest read to date:
  NO human-verification challenge this run.** SERP renders "About 50 results"
  that are all unrelated fallback hits (zhihu.com et al.); zero
  aiconverter.app URLs anywhere in the HTML. Zero-indexation is live on
  Bing's own index, not just DDG's derivative view.
- DuckDuckGo `site:aiconverter.app` (lite.duckduckgo.com) — bot-challenged
  this run (duck-select challenge), so no clean DDG row; Bing's SERP above is
  the clean signal and DDG serves from the Bing index.
- No ownership evidence: `https://aiconverter.app/BingSiteAuth.xml` → 404; no
  `msvalidate.01` / `bing-site-verification` meta tag in live homepage HTML.
- Crawler surfaces healthy: `/robots.txt` 200 (references sitemap, no Bing
  blocking), `/sitemap.xml` 200 with 22 `<url>` entries, all valid.
- IndexNow key files still on main but **not live**: key file → 404 (needs a
  Pages deploy); no submission sent (non-live key would be rejected).

## Blockers (re-verified 2026-08-20)

1. **Account action.** Bing Webmaster Tools verification + sitemap submission
   need a Microsoft (or linked) account sign-in — a human account action, per
   fleet venue policy, stays with Nish.
2. **No API credentials.** No Bing Webmaster API key, no Microsoft Graph
   credential, no Porkbun API credential in this lane's environment.
3. **No DNS write path.** DNS is authoritative at Porkbun (`ops/dns.md`); no
   Porkbun credential → no TXT verification from a lane.
4. **No deploy path yet — but unblock in progress.** No Cloudflare/Pages token
   in this lane's environment; `wrangler whoami` → not authenticated; live
   bundle still predates merged PRs (live sitemap still 22 URLs, missing
   `receipt-to-csv/`; IndexNow key file 404). **PR #135
   (`lane1/deploy-workflow-20260820`, open 2026-08-20, mergeable CLEAN) adds a
   fail-closed Cloudflare Pages deploy workflow** (push to main + daily
   schedule). Once it merges and the Pages token is provisioned, the first
   deploy makes the IndexNow key files go live.

## What this lane changed (PR `lane1/bing-indexnow-20260820`)

- `scripts/indexnow-submit.mjs` — new credential-free IndexNow submission
  script (protocol is self-issued by design). Fail-closed: refuses to submit
  until `https://aiconverter.app/<key>.txt` actually returns 200 (verified
  live: refuses with HTTP 404 today), validates the live key matches the
  committed key, extracts URLs from `public/sitemap.xml` (24 URLs incl.
  `/pricing/`) or takes explicit URL arguments, POSTs to api.indexnow.org,
  treats HTTP 202 as success. Key comes from the public key file, not the
  script, so gitleaks stays clean.
- `ops/bing-indexation.md` — new 2026-08-20 re-verification section with
  today's evidence and the PR #135 unblock note.
- `.lane/reports/lane1-bing-indexnow-20260820.md` — this file.

No Bing-issued ownership token was invented; nothing was submitted to
IndexNow (the key is not live, and the script's guard is the proof).

## Checks on this lane

- Live probes 2026-08-20: Bing SERP `site:aiconverter.app` (clean, zero
  results), DDG lite endpoint (challenged), `/robots.txt` 200, `/sitemap.xml`
  200 (22 URLs), `/BingSiteAuth.xml` 404, IndexNow key file 404, homepage meta
  tags (no msvalidate/bing-site-verification), `wrangler whoami` → not
  authenticated, no env credentials.
- Script guard: `node scripts/indexnow-submit.mjs` → refuses with exit 1
  against the live 404 key file (fail-closed proven live).
- Build chain: `npm run build` → dist ships `IndexNow.txt`,
  `1bc751e6-....txt`, `robots.txt`, `sitemap.xml` (no artifact blocks the key
  going live).
- Repo gates: `npm run check:pricing` → consistent; `node --test
  tests/*.test.mjs` → pass; `npm run build` → green.

## Suggested follow-up for the controller

- After PR #135 merges and the Pages token is provisioned (deploy workflow
  fails closed until then), the daily deploy self-heals the live bundle; the
  next step for this item is `node scripts/indexnow-submit.mjs` once
  `https://aiconverter.app/1bc751e6-ead3-48da-96d3-722f77cc4464.txt`
  returns 200.

## Nish-held next steps (unchanged from kit, `ops/bing-indexation.md`)

1. Add `aiconverter.app` in Bing Webmaster Tools (import from GSC or manual).
2. Verify ownership — recommended DNS TXT at Porkbun (survives redeploys);
   meta tag / `BingSiteAuth.xml` work once a deploy exists.
3. Submit `https://aiconverter.app/sitemap.xml` in Bing Webmaster → Sitemaps.
4. After a Pages deploy makes the key file return 200, run
   `node scripts/indexnow-submit.mjs` (or use the same key
   `1bc751e6-ead3-48da-96d3-722f77cc4464` in Bing Webmaster IndexNow
   settings).
5. Request indexing for `/`, `/bank-statement-pdf-to-csv/`,
   `/convert-bank-statement-to-csv/`.
