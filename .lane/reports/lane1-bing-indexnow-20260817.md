# Lane evidence — aiconverter-app lane 1 — Bing/DDG indexation (2026-08-17)

**Verdict: the Bing/DuckDuckGo zero-indexation finding is STILL LIVE
(re-verified 2026-08-17). The 2026-08-10 decision still holds: Bing Webmaster
ownership + sitemap submission are manual, Nish-held actions (account-gated),
and the Cloudflare Pages deploy that would make the IndexNow key live is still
blocked. What this lane delivered: fresh live evidence, plus a rescue of the
IndexNow key prep that had been sitting dead in unmerged PR #99 — re-carried
onto fresh main so the free IndexNow discovery path is ready to fire the
moment a Pages deploy exists.**

## Re-verification (all live, 2026-08-17)

- DuckDuckGo `site:aiconverter.app` (lite.duckduckgo.com, clean page, no
  challenge) → **"No results found for site:aiconverter.app"** — zero-indexation
  symptom unchanged.
- DuckDuckGo brand query `"aiconverter.app"` — bot-challenged agent-side this
  run (anomaly redirect on both lite and html endpoints); the `site:` query is
  the clean signal and confirms no results.
- Bing `site:aiconverter.app` (live SERP fetch) → **human-verification
  challenge still up**; zero organic aiconverter.app result links in the HTML
  (only challenge + query-echo strings). Bing's own index state remains
  unreadable from a lane (unchanged since the scout cycle).
- No ownership evidence: `https://aiconverter.app/BingSiteAuth.xml` → 404; no
  `msvalidate.01` / `bing-site-verification` meta tag in live homepage HTML.
- Crawler surfaces healthy: `/robots.txt` 200 (references sitemap);
  `/sitemap.xml` 200 with 22 `<url>` entries, all valid.

## Blockers (all re-verified 2026-08-17, unchanged)

1. **Account action.** Bing Webmaster Tools verification + sitemap submission
   need a Microsoft (or linked) account sign-in — a human account action, per
   fleet venue policy, stays with Nish.
2. **No API credentials.** No Bing Webmaster API key, no Microsoft Graph
   credential, no Porkbun API credential in this lane's environment.
3. **No DNS write path.** DNS is authoritative at Porkbun (`ops/dns.md`); no
   Porkbun credential → no TXT verification from a lane.
4. **No deploy path (re-checked).** No Cloudflare/Pages token in this lane's
   environment; `wrangler whoami` → not authenticated; live bundle still
   predates merged PRs (live sitemap still 22 URLs, missing `receipt-to-csv/`;
   IndexNow key file 404). A repo-added static artifact (verification file,
   IndexNow key file) cannot reach production today.

## What this lane changed (PR `lane1/bing-indexnow-20260817`)

- Rescue of the dead IndexNow prep: `public/1bc751e6-ead3-48da-96d3-722f77cc4464.txt`
  (the real, freshly generated IndexNow key from 2026-08-14, unchanged) and
  `public/IndexNow.txt` — previously sitting unmerged in PR
  `lane1/bing-indexnow-20260814` (#99) since 2026-08-14. The gitleaks
  allowlist for these by-design-public key values landed on main in #123
  (2026-08-15), so the Secret Scan gate no longer blocks them; this branch
  re-carries them onto fresh main.
- `ops/bing-indexation.md` — new 2026-08-17 re-verification section with
  today's evidence and the PR #99 rescue note.
- `.lane/reports/lane1-bing-indexnow-20260817.md` — this file.

Neither key file is live yet (needs the same blocked Pages deploy), and no
IndexNow submission was sent (a non-live key is rejected by the protocol). No
Bing-issued ownership token was invented.

## Suggested follow-up for the controller

- PR #99 (`lane1/bing-indexnow-20260814`) is superseded by this branch's key
  files and can be closed to avoid duplicate-merge conflict (both carry the
  same two public key files).

## Nish-held next steps (unchanged, key now ready on a fresh main base)

1. Add `aiconverter.app` in Bing Webmaster Tools (import from GSC or manual).
2. Verify ownership — recommended DNS TXT at Porkbun (survives redeploys);
   meta tag / `BingSiteAuth.xml` work once a deploy exists.
3. Submit `https://aiconverter.app/sitemap.xml` in Bing Webmaster → Sitemaps.
4. After a Pages deploy makes the key file return 200, submit IndexNow
   (key `1bc751e6-ead3-48da-96d3-722f77cc4464` + urlList via
   https://api.indexnow.org/) or enable it in Bing Webmaster settings.
5. Request indexing for `/`, `/bank-statement-pdf-to-csv/`,
   `/convert-bank-statement-to-csv/`.