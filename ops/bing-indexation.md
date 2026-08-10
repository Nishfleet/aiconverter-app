# Bing / DuckDuckGo Indexation Notes

Durable record of the Bing/DuckDuckGo zero-indexation gap for `aiconverter.app`
and the decision around ownership verification and sitemap submission.
Live-production claims only: everything below is grounded in live checks and
the backlog item `Bing/DuckDuckGo indexation is zero for an 18-month-old
domain; no Bing Webmaster ownership or sitemap-submission evidence exists`
(scout 2026-08-08, amber, traction).

## Current State (re-verified 2026-08-11)

- DuckDuckGo `site:aiconverter.app` renders **"No more results found for
  site:aiconverter.app"** — the only match is an unrelated Chinese
  domain-parking page (`www.west.cn/p/`), not an aiconverter.app result
  (rendered-proxy fetch, 2026-08-11). The exact brand query
  `"aiconverter.app"` renders **"No results found"** (2026-08-11). Zero result
  rows for the domain on both queries — same state as the camoufox walk of
  2026-08-10, independently corroborated.
- Direct Bing.com `site:aiconverter.app` is still blocked by a human
  verification/captcha challenge from this datacenter IP (both direct curl and
  rendered fetch, 2026-08-11), so Bing's own index state cannot be read
  agent-side (same blocker as the scout cycle and the 2026-08-10 check).
  DuckDuckGo results are Bing-index-derived, so the DDG zero-result state is
  the observable symptom of the Bing gap. DuckDuckGo's own `html`/`lite`
  endpoints also now answer HTTP 202 anomaly-challenge for agent requests
  (2026-08-11), which is why the rendered-proxy path is used for evidence.
- Google already indexes ~10 aiconverter.app pages (home, formats, about,
  privacy/terms/security/refund/support/data-retention,
  convert-bank-statement-to-csv, bank-statement-pdf-to-csv) — evidence of
  ~2026-08-08, unchanged since. This is a Bing-side submission/ownership gap,
  not a crawl-timing artifact: the domain has been live since at least
  2025-02-20 (Wayback CDX), ~18 months.
- Live crawler surfaces are healthy (checked 2026-08-11):
  `https://aiconverter.app/robots.txt` returns 200 and references the sitemap;
  `https://aiconverter.app/sitemap.xml` returns 200 with valid XML (22 URLs
  live; the repo has 23 — the missing `receipt-to-csv/` entry is owned by the
  separate open deploy item, not this one). No `noindex` appears anywhere
  except `404.html` and `/admin/` (both correct), and the bank landing carries
  explicit meta robots `index,follow`.
- No Bing ownership evidence exists anywhere: no `bing-site-verification`
  / `msvalidate.01` meta tag in live homepage HTML, no
  `https://aiconverter.app/BingSiteAuth.xml` (HTTP 404), and nothing in this
  repo (no verification tag, no Bing Webmaster submission receipt). The one
  new artifact added by this lane is the IndexNow key file below — it is
  inert until a deploy publishes it.

## Why Automated Submission Is Still Blocked From This Lane (2026-08-11)

- **Account action.** Bing Webmaster Tools ownership verification and sitemap
  submission require signing in with a Microsoft (or linked GitHub/Google)
  account. Per the fleet venue-policy pattern used for Product Hunt and
  BetaList (`ops/launch-venues.md`), account actions stay with Nish; an agent
  must not drive an authenticated browser session.
- **No API credentials.** No Bing Webmaster API key and no Microsoft Graph
  credential exist in this lane's environment (checked at runtime).
- **No DNS write path.** Verification via DNS TXT needs Porkbun access; DNS is
  authoritative at Porkbun (`ops/dns.md`) and no Porkbun API credential is
  available in this lane's environment.
- **No deploy path (still).** Verification via meta tag or `BingSiteAuth.xml`
  file (and publishing the IndexNow key file) would require shipping a new
  static file to Pages production. Deploy remains blocked as of 2026-08-11:
  `wrangler whoami` → "You are not authenticated", the fleet
  `CLOUDFLARE_API_TOKEN` still lacks Account > Cloudflare Pages > Edit
  (Pages project API returns Authentication error), and the fleet releaser
  still refuses the first release without a known-good baseline (see
  `.lane/report.md`, 2026-08-11 entry). A repo-added artifact therefore
  cannot go live yet.
- **No fabrication.** Inventing a Bing verification token or an
  `msvalidate.01` value without a real Bing-issued token would be a false
  ownership claim and is not done.

## What This Lane Ships (2026-08-11)

- **IndexNow key file, committed and deploy-ready:**
  `public/e141d4be-837e-442e-9336-989051af9596.txt` (content:
  `e141d4be-837e-442e-9336-989051af9596`). IndexNow keys are owner-generated
  (any UUID — no Bing account involved), and the key file is public by
  protocol design, so committing it is not an ownership claim. Once the file
  is published at `https://aiconverter.app/e141d4be-837e-442e-9336-989051af9596.txt`
  (it rides along with the next Pages deploy of `main`), the site becomes
  IndexNow-ready and the one-shot submission below works without any account.
- **Submission command (agent-executable once the key file is live):**

  ```bash
  curl -s -X POST https://api.indexnow.org/indexnow \
    -H 'Content-Type: application/json; charset=utf-8' \
    -d '{"host":"aiconverter.app","key":"e141d4be-837e-442e-9336-989051af9596","keyLocation":"https://aiconverter.app/e141d4be-837e-442e-9336-989051af9596.txt","urlList":["https://aiconverter.app/","https://aiconverter.app/bank-statement-pdf-to-csv/","https://aiconverter.app/convert-bank-statement-to-csv/"]}'
  ```

  IndexNow pushes to Bing, Yandex, Naver and Seznam. It does not replace Bing
  Webmaster ownership + sitemap submission (still the durable fix), but it is
  the only Bing-discovery path that does not require a Microsoft account, so
  it should be run the moment the key file is live.

## Decision (dated 2026-08-10, reaffirmed 2026-08-11)

- **Outcome: manual submission by Nish using the kit below. Automated
  submission declined (account-gated, no credentials, no deploy path).**
- No further code change is required for this item (robots.txt and sitemap.xml
  are already valid and referenced live); the IndexNow key file above is
  deploy-ready so the post-deploy submission path is a one-shot curl.
- Next action: Nish performs the kit steps, then this file should be updated
  with the verification receipt (TXT value / meta tag) and the sitemap
  submission date so the loop has durable evidence.

## Manual submission kit (copy-paste ready)

1. **Add the site in Bing Webmaster Tools** — sign in at
   https://www.bing.com/webmasters/ and add `aiconverter.app` (import from
   Google Search Console when prompted, or enter the domain manually).
2. **Verify ownership — recommended: DNS TXT at Porkbun.** Bing offers a TXT
   record value. Add it as a TXT record for `aiconverter.app` in the Porkbun
   registrar panel (authoritative DNS per `ops/dns.md`; do not touch
   nameservers). TXT survives every redeploy. Alternative verification methods
   (meta tag, `BingSiteAuth.xml` file upload) are fine once a deploy path
   exists.
3. **Submit the sitemap.** In Bing Webmaster Tools → Sitemaps, submit
   `https://aiconverter.app/sitemap.xml` and confirm it reports valid/200.
4. **Run the IndexNow submission** (see command above) once
   `https://aiconverter.app/e141d4be-837e-442e-9336-989051af9596.txt` returns
   200 — the key file is already committed and will go live with the next
   deploy, so this step needs no further setup.
5. **Request indexing** for the homepage and the two bank landing pages
   (`/bank-statement-pdf-to-csv/`, `/convert-bank-statement-to-csv/`) via URL
   submission once the property is verified.

## Acceptance / verify (from the backlog item)

- Accept: domain ownership verified in Bing Webmaster Tools and sitemap.xml
  submitted; `site:aiconverter.app` and the brand query `"aiconverter.app"`
  return the domain on **both** Bing and DuckDuckGo within 2 weeks of
  submission.
- Verify: re-run the DDG queries
  (`https://duckduckgo.com/?q=site%3Aaiconverter.app` and
  `https://duckduckgo.com/?q=%22aiconverter.app%22`) and a Bing
  `site:aiconverter.app` query after submission; confirm the Bing Webmaster
  property shows verified + sitemap 200 in the console.
- Rollback: remove the Bing Webmaster property (harmless); delete the IndexNow
  key file from the repo (nothing depends on it).

## Notes

- DuckDuckGo serves from the Bing index; fixing Bing ownership + sitemap
  submission fixes DDG visibility as well.
- The live sitemap missing `receipt-to-csv/` is the open deploy item's
  assertion, not this item's; it does not block Bing ownership, and Google
  already crawls the receipt page path once deploy lands.
- Evidence trail: DDG zero-state observed 2026-08-10 (camoufox walk) and
  re-confirmed 2026-08-11 (rendered-proxy fetch; `html`/`lite` endpoints now
  anomaly-blocked for agents). Bing captcha confirmed 2026-08-09, 2026-08-10
  and 2026-08-11.
