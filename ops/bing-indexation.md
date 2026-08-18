# Bing / DuckDuckGo Indexation Notes

Durable record of the Bing/DuckDuckGo zero-indexation gap for `aiconverter.app`
and the decision around ownership verification and sitemap submission.
Live-production claims only: everything below is grounded in live checks and
the backlog item `Bing/DuckDuckGo indexation is zero for an 18-month-old
domain; no Bing Webmaster ownership or sitemap-submission evidence exists`
(scout 2026-08-08, amber, traction).

## Current State (verified 2026-08-10)

- DuckDuckGo `site:aiconverter.app` renders **"No results found for
  site:aiconverter.app"** and the exact brand query `"aiconverter.app"` renders
  **"No results found"** — zero result rows for both (camoufox walk,
  India region, safe search moderate, 2026-08-10).
- Direct Bing.com `site:aiconverter.app` is blocked by a human-verification
  challenge ("Please solve the challenge below to continue"), so Bing's own
  index state cannot be read agent-side (same blocker as the scout cycle).
  DuckDuckGo results are Bing-index-derived, so the DDG zero-result state is
  the observable symptom of the Bing gap.
- Google already indexes ~10 aiconverter.app pages (home, formats, about,
  privacy/terms/security/refund/support/data-retention,
  convert-bank-statement-to-csv, bank-statement-pdf-to-csv) — evidence of
  ~2026-08-08, unchanged since. This is a Bing-side submission/ownership gap,
  not a crawl-timing artifact: the domain has been live since at least
  2025-02-20 (Wayback CDX), ~18 months.
- Live crawler surfaces are healthy: `https://aiconverter.app/robots.txt`
  returns 200 and references the sitemap; `https://aiconverter.app/sitemap.xml`
  returns 200 with valid XML (22 URLs live; the repo has 23 — the missing
  `receipt-to-csv/` entry is owned by the separate open deploy item, not this
  one). No `noindex` appears anywhere except `404.html` and `/admin/` (both
  correct), and the bank landing carries explicit meta robots `index,follow`.
- No Bing ownership evidence exists anywhere: no `bing-site-verification`
  / `msvalidate.01` meta tag in live homepage HTML, no
  `https://aiconverter.app/BingSiteAuth.xml` (HTTP 404), and nothing in this
  repo (no verification tag, no Bing Webmaster submission receipt, no IndexNow
  key file). robots.txt and sitemap.xml are valid and referenced, but Bing
  Webmaster Tools has no verified property for the domain.

## Why Automated Submission Is Blocked From This Lane

- **Account action.** Bing Webmaster Tools ownership verification and sitemap
  submission require signing in with a Microsoft (or linked GitHub/Google)
  account. Per the fleet venue-policy pattern used for Product Hunt and
  BetaList (`ops/launch-venues.md`), account actions stay with Nish; an agent
  must not drive an authenticated browser session.
- **No API credentials.** No Bing Webmaster API key and no Microsoft Graph /
  IndexNow key exist in this lane's environment (checked at runtime), so there
  is no credential-free programmatic submission path.
- **No DNS write path.** Verification via DNS TXT needs Porkbun access; DNS is
  authoritative at Porkbun (`ops/dns.md`) and no Porkbun API credential is
  available in this lane's environment.
- **No deploy path.** Verification via meta tag or `BingSiteAuth.xml` file
  (and an IndexNow key file) would require shipping a new static file to
  Pages production. Deploy remains blocked (open red backlog item: release
  policy disarmed, no Cloudflare Pages Edit token, live bundle predates
  merged PRs), so a repo-added verification artifact would not go live.
- **No fabrication.** Inventing a verification token or an IndexNow key file
  without a real Bing-issued token would be a false ownership claim and is not
  done.

## Decision (dated 2026-08-10)

- **Outcome: manual submission by Nish using the kit below. Automated
  submission declined (account-gated, no credentials, no deploy path).**
- No code change is required for this item (robots.txt and sitemap.xml are
  already valid and referenced live).
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
   exists, but a repo-only artifact cannot reach production today.
3. **Submit the sitemap.** In Bing Webmaster Tools → Sitemaps, submit
   `https://aiconverter.app/sitemap.xml` and confirm it reports valid/200.
4. **(Optional, free, faster discovery) IndexNow.** Generate a key (any UUID),
   host it as `https://aiconverter.app/{key}.txt`, and submit the sitemap URLs
   via https://api.indexnow.org/ (key + urlList). Caveat: the key file needs
   the same deploy path as step 2's alternatives, so this lands when deploy
   unlocks.
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
- Rollback: remove the Bing Webmaster property (harmless; nothing in this
  repo changes).

## Notes

- DuckDuckGo serves from the Bing index; fixing Bing ownership + sitemap
  submission fixes DDG visibility as well.
- The live sitemap missing `receipt-to-csv/` is the open deploy item's
  assertion, not this item's; it does not block Bing ownership, and Google
  already crawls the receipt page path once deploy lands.
