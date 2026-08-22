# Lane evidence — aiconverter-app lane 1 — IndexNow live ping (2026-08-22)

**Packet item:** Bing/DuckDuckGo indexation is zero for an 18-month-old domain; no Bing Webmaster ownership or sitemap-submission evidence exists (id `986a062c71`).

**Verdict: not resolved.** IndexNow key files are live and this lane ran `node scripts/indexnow-submit.mjs` (receipt below). Bing Webmaster ownership is still missing. Item is not retired. No Bing-issued token was invented.

## Live checks (2026-08-22)

- `https://aiconverter.app/1bc751e6-ead3-48da-96d3-722f77cc4464.txt` → HTTP 200, body `1bc751e6-ead3-48da-96d3-722f77cc4464`
- `https://aiconverter.app/IndexNow.txt` → HTTP 200, body `1bc751e6-ead3-48da-96d3-722f77cc4464`
- `https://aiconverter.app/BingSiteAuth.xml` → HTTP 404
- homepage `msvalidate.01` / `bing-site-verification`: absent
- `https://aiconverter.app/robots.txt` → HTTP 200
- `https://aiconverter.app/sitemap.xml` loc count: 24
- Deploy: GitHub Actions run `32550455542` success, SHA `f26c826e356480885396eb2d7e990b959870c7b4`
- origin/main at branch creation: `f26c826e356480885396eb2d7e990b959870c7b4` (`git rev-parse origin/main`)
- IndexNow command: `node scripts/indexnow-submit.mjs`
- IndexNow result (exact stdout/stderr, exit code): exit 0 — stdout: `Submitting 24 URL(s) to https://api.indexnow.org/ ...` then `IndexNow accepted (HTTP 200) for 24 URL(s).`; stderr empty
- SERP: DDG lite agent-side bot-challenged

## Files in this branch

- `scripts/indexnow-submit.mjs` — treat IndexNow HTTP 200 and 202 as success
- `ops/bing-indexation.md` — 2026-08-22 re-verification; blockers section made truthful (deploy open; Webmaster still Nish-gated); kit steps 2 and 4 updated; Growth-lane next-action marked completed
- `.lane/reports/lane1-bing-indexnow-20260822.md` — this file

## Nish-held remainder

1. Add `aiconverter.app` in Bing Webmaster Tools.
2. Verify ownership (DNS TXT at Porkbun preferred).
3. Submit `https://aiconverter.app/sitemap.xml` in the Webmaster Sitemaps UI.
4. Request indexing for `/`, `/bank-statement-pdf-to-csv/`, `/convert-bank-statement-to-csv/`.

Do not call `fleet-resolve-item` for `986a062c71`.
