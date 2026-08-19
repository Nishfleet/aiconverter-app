# Lane evidence — aiconverter-app lane 1 — Bing/DDG indexation (2026-08-14)

**Verdict: the Bing/DuckDuckGo zero-indexation finding is STILL LIVE
(re-verified 2026-08-14), and the 2026-08-10 decision still holds: Bing
Webmaster ownership + sitemap submission are manual, Nish-held actions
(account-gated). What this lane delivered: fresh live evidence, and the
IndexNow key is now prepared in-repo so the free IndexNow discovery path can
run the moment a Cloudflare Pages deploy exists.**

## Re-verification (all live, 2026-08-14)

- Bing `site:aiconverter.app` (live SERP fetch) → **zero aiconverter.app
  result URLs**; the organic result block contains unrelated domains only
  (e.g. jeuxvideo.com). No aiconverter.app link in the SERP HTML.
- DuckDuckGo `site:aiconverter.app` (html.duckduckgo.com, redirect followed)
  → **"No results"** — zero-indexation symptom unchanged.
- No ownership evidence: `https://aiconverter.app/BingSiteAuth.xml` → 404; no
  `msvalidate.01` / `bing-site-verification` meta tag in live homepage HTML.
- Crawler surfaces healthy: `/robots.txt` 200 (references sitemap),
  `/sitemap.xml` 200 with 22 `<url>` entries, all valid.

## Blockers (all re-verified 2026-08-14, unchanged)

1. **Account action.** Bing Webmaster Tools verification + sitemap submission
   need a Microsoft (or linked) account sign-in — a human account action, per
   fleet venue policy, stays with Nish.
2. **No API credentials.** No Bing Webmaster API key, no Microsoft Graph
   credential, no Porkbun API credential, no IndexNow key in the environment
   (checked).
3. **No DNS write path.** DNS is authoritative at Porkbun (`ops/dns.md`); no
   Porkbun credential → no TXT verification from a lane.
4. **No deploy path.** Fleet `CLOUDFLARE_API_TOKEN` re-checked live:
   `GET /accounts/<acct>/pages/projects/aiconverter` → `10000 Authentication
   error` (Workers-only token, no Pages:Edit). `wrangler whoami` → not
   authenticated. A repo-added static artifact (verification file, IndexNow
   key file) cannot reach production today.

## What this lane changed (PR `lane1/bing-indexnow-20260814`)

- `public/1bc751e6-ead3-48da-96d3-722f77cc4464.txt` — the IndexNow key file
  (real freshly generated UUID key; self-issued by IndexNow design).
- `public/IndexNow.txt` — standard IndexNow key marker companion file.
- `ops/bing-indexation.md` — 2026-08-14 re-verification section; updated
  blockers, no-fabrication note, and kit step 4 to reference the prepared key.

Neither key file is live yet (needs the same blocked Pages deploy), and no
IndexNow submission was sent (a non-live key would be rejected). No
Bing-issued ownership token was invented.

## Nish-held next steps (unchanged, now with the key ready)

1. Add `aiconverter.app` in Bing Webmaster Tools (import from GSC or manual).
2. Verify ownership — recommended DNS TXT at Porkbun (survives redeploys);
   meta tag / `BingSiteAuth.xml` work once a deploy exists.
3. Submit `https://aiconverter.app/sitemap.xml` in Bing Webmaster → Sitemaps.
4. After a Pages deploy makes the key file return 200, submit IndexNow
   (key `1bc751e6-ead3-48da-96d3-722f77cc4464` + urlList via
   https://api.indexnow.org/) or enable it in Bing Webmaster settings.
5. Request indexing for `/`, `/bank-statement-pdf-to-csv/`,
   `/convert-bank-statement-to-csv/`.

Full kit with copy-paste steps: `ops/bing-indexation.md`.

## Checks on this lane

- Live probes 2026-08-14: Bing SERP, DDG html endpoint, `/robots.txt`,
  `/sitemap.xml`, `/BingSiteAuth.xml`, homepage meta tags, Cloudflare Pages
  API with the fleet token, `wrangler whoami` — all as recorded above.
- Repo gates: `node --test tests/*.test.mjs` (see PR), `npm run build` (see PR).
