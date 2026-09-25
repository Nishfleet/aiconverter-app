# Bing / DuckDuckGo Indexation Notes

Durable record of the Bing/DuckDuckGo zero-indexation gap for `aiconverter.app`
and the decision around ownership verification and sitemap submission.
Live-production claims only: everything below is grounded in live checks and
the backlog item `Bing/DuckDuckGo indexation is zero for an 18-month-old
domain; no Bing Webmaster ownership or sitemap-submission evidence exists`
(scout 2026-08-08, amber, traction).

## Re-verification (2026-08-22, lane re-run — IndexNow key live + first ping)

- **Deploy path is open.** GitHub Actions workflow `Deploy production` run `32550455542` concluded `success` at `2026-08-22T04:37:21Z` on SHA `f26c826e356480885396eb2d7e990b959870c7b4`. The previous "no Cloudflare Pages deploy" blocker is retired.
- **IndexNow key is live.** `curl` of `https://aiconverter.app/1bc751e6-ead3-48da-96d3-722f77cc4464.txt` → HTTP 200, body `1bc751e6-ead3-48da-96d3-722f77cc4464`. `curl` of `https://aiconverter.app/IndexNow.txt` → HTTP 200, same body. Both files already exist on `origin/main`; this run did not rotate the key.
- **IndexNow ping.** Ran `node scripts/indexnow-submit.mjs` from this checkout (sitemap URL list, no extra argv). Result: exit 0 — stdout: `Submitting 24 URL(s) to https://api.indexnow.org/ ...` then `IndexNow accepted (HTTP 200) for 24 URL(s).`. Endpoint: `POST https://api.indexnow.org/indexnow`. Key used: `1bc751e6-ead3-48da-96d3-722f77cc4464`. This is the credential-free sitemap-notification receipt. It is not Bing Webmaster ownership and it is not a Bing Webmaster console sitemap submission.
- **Script change.** `scripts/indexnow-submit.mjs` now treats IndexNow HTTP 200 and HTTP 202 as success (IndexNow protocol: 200 URL submitted successfully; 202 URL received, key validation pending).
- **Bing Webmaster ownership still missing.** `https://aiconverter.app/BingSiteAuth.xml` → HTTP 404. Live homepage HTML has no `msvalidate.01` and no `bing-site-verification` meta tag. No Bing-issued token exists in this repo. DNS remains authoritative at Porkbun (`ops/dns.md`); this lane has no Porkbun credential. Account sign-in for https://www.bing.com/webmasters/ stays with Nish.
- **Crawler surfaces.** `https://aiconverter.app/robots.txt` → HTTP 200 and still contains `Sitemap: https://aiconverter.app/sitemap.xml`. `https://aiconverter.app/sitemap.xml` → HTTP 200 with 24 `<loc>` entries.
- **SERP.** DuckDuckGo/Bing `site:aiconverter.app` is not a pass gate for this run (indexing lag + agent-side challenges). DDG lite agent-side bot-challenged.
- **Item 986a062c71 is not retired.** IndexNow ping does not satisfy the backlog acceptance line that requires Bing Webmaster ownership verification plus `site:` hits on Bing and DuckDuckGo within 2 weeks. Do not call `fleet-resolve-item`.

## Re-verification (2026-08-21, lane re-run — IndexNow deliverable + Gitleaks block)

- **IndexNow key + companion file are on `origin/main` (verified 2026-08-21).**
  `git ls-tree origin/main -- public/1bc751e6-ead3-48da-96d3-722f77cc4464.txt
  public/IndexNow.txt` shows both blobs present; both bodies are the
  real, self-issued UUID `1bc751e6-ead3-48da-96d3-722f77cc4464`.
  The 2026-08-17 re-verification below already noted that the Secret
  Scan gate no longer blocks them — that is re-confirmed today.
- **Gitleaks allowlist is live on `origin/main`.** `git log origin/main
  --grep="allowlist" --oneline` shows `ba03726 chore: allowlist
  by-design-public IndexNow keys in gitleaks config (#123)` (merged
  2026-08-15). `cat .gitleaks.toml` (verified live) extends the default
  rule set (`[extend] useDefault = true`) and allowlists both
  by-design-public IndexNow key values (`e141d4be-...`,
  `1bc751e6-...`) and the public key-file paths
  (`public/e141d4be-...txt`, `public/1bc751e6-...txt`,
  `public/IndexNow.txt`). With this allowlist in place, the original
  PR #44 block reason (`generic-api-key` flagging the submission curl
  in this file) is structurally gone: a fresh PR carrying the same
  IndexNow deliverable now scans clean against the same pinned
  gitleaks 8.24.3 binary the CI uses.
- **Secret Scan runner is fixed (re-confirmed 2026-08-21).** PR #61
  (`f796d3e`, 2026-08-13) replaced `gitleaks/gitleaks-action@v3` with a
  workspace-local install that never touches `/tmp` (the runner is
  self-hosted `vps-verify`; the workspace is always writable and
  checkout's clean wipes it before every job). The block is no longer
  reproducible from this lane.
- **PR #44 is no longer reachable from GitHub (re-checked 2026-08-21).**
  `git ls-remote origin refs/pull/44/head` still returns the head SHA
  `d92771a`, but `https://github.com/nish3451/aiconverter-app/pull/44`
  and `https://api.github.com/repos/nish3451/aiconverter-app/pulls/44`
  both return **HTTP 404**. The original blocked PR is gone from
  GitHub, so its block state is not actionable; the controller's
  recurring "PR #44 is blocked by Gitleaks" item should be retired
  by this re-verification record. See
  `.lane/reports/lane1-bing-indexnow-20260821.md` for the full
  structural proof.
- Live gap status (Bing/DDG zero-indexation symptom, blockers, deploy
  path) is unchanged from the 2026-08-17 re-verification below; this
  2026-08-21 row exists specifically to retire the Gitleaks block
  item and not to re-prove the same gap.

## Growth lane (2026-08-21) — IndexNow submission script

- **`scripts/indexnow-submit.mjs` added** (credential-free, fail-closed).
  Reads the key from `public/IndexNow.txt`, refuses to submit until
  `https://aiconverter.app/<key>.txt` returns 200 live (proven fail-closed
  against today's 404), validates the live key matches the committed key,
  extracts URLs from `public/sitemap.xml` or accepts explicit URL args,
  POSTs to `https://api.indexnow.org/indexnow`, treats HTTP 202 as success.
  The key comes from the public key file (not hardcoded in the script), so
  gitleaks stays clean.
- **Why this PR exists:** lane1 PR #143 carried the same script but
  conflicted on this doc (lane1 added a 2026-08-20 section that has since
  been superseded by the 2026-08-21 section above). This growth PR carries
  the script on fresh `origin/main` with no conflict and no doc duplication.
- **Next action completed 2026-08-22:** Pages deploy run `32550455542` made
  the key files return HTTP 200. This lane ran `node scripts/indexnow-submit.mjs`
  (receipt in the 2026-08-22 re-verification section). Remaining work is
  Nish-held Bing Webmaster ownership + sitemap submit in the Webmaster UI.


## Re-verification (2026-08-17, lane re-run)

- DuckDuckGo `site:aiconverter.app` (lite.duckduckgo.com, clean page, no
  challenge) renders **"No results found for site:aiconverter.app"** —
  zero-indexation symptom still live. The exact brand query
  `"aiconverter.app"` was bot-challenged agent-side on both the lite and html
  endpoints this run (anomaly redirect), so the brand-query row was not
  re-readable; the `site:` query is the clean signal and is unchanged.
- Bing.com `site:aiconverter.app` is **still human-verification challenged**
  agent-side: the SERP HTML contains only challenge and query-echo strings,
  zero organic aiconverter.app result links. Bing's own index state remains
  unreadable from a lane (same blocker as 2026-08-08, 2026-08-10, 2026-08-14).
  DuckDuckGo results are Bing-index-derived, so the DDG zero-result state is
  the observable symptom of the Bing gap.
- No ownership evidence still (re-checked 2026-08-17):
  `https://aiconverter.app/BingSiteAuth.xml` → HTTP 404; no `msvalidate.01` /
  `bing-site-verification` meta tag in live homepage HTML.
- Live crawler surfaces still healthy: `/robots.txt` 200 and references the
  sitemap; `/sitemap.xml` 200 with 22 `<url>` entries (this run: the live XML
  still omits `receipt-to-csv/` — the live bundle still predates merged PRs,
  i.e. the deploy path is still blocked).
- IndexNow key still **not live**: `https://aiconverter.app/1bc751e6-ead3-48da-96d3-722f77cc4464.txt`
  and `https://aiconverter.app/IndexNow.txt` both → HTTP 404. No IndexNow
  submission has been sent (a non-live key is rejected by the protocol).
- Deploy path re-checked 2026-08-17, still blocked: no Cloudflare/Pages token
  in this lane's environment and `wrangler whoami` → not authenticated.
- **IndexNow key prep carried forward:** the 2026-08-14 run left the key files
  in an unmerged PR (#99); the gitleaks allowlist for the by-design-public key
  values landed on main in #123 (2026-08-15), so the Secret Scan gate no
  longer blocks them. This branch re-carries `public/1bc751e6-ead3-48da-96d3-722f77cc4464.txt`
  + `public/IndexNow.txt` (same key, unchanged) onto fresh main so the free
  IndexNow discovery path can run the moment a Cloudflare Pages deploy exists.

## Re-verification (2026-08-14, lane re-run)

- Bing `site:aiconverter.app` (live SERP fetch 2026-08-14) returns **zero
  aiconverter.app result URLs** — the organic result block contains unrelated
  domains only (e.g. jeuxvideo.com). No aiconverter.app link anywhere in the
  SERP HTML; the finding is still live.
- DuckDuckGo `site:aiconverter.app` (html.duckduckgo.com, followed the 302)
  renders **"No results"** — zero-indexation symptom unchanged.
- No ownership evidence still: `https://aiconverter.app/BingSiteAuth.xml` →
  HTTP 404; no `msvalidate.01` / `bing-site-verification` meta tag in live
  homepage HTML (re-checked 2026-08-14).
- Live crawler surfaces still healthy: `/robots.txt` 200, `/sitemap.xml` 200
  (22 `<url>` entries, all valid).
- Blockers re-verified 2026-08-14, all unchanged:
  - Fleet `CLOUDFLARE_API_TOKEN` still **Workers-only**:
    `GET /accounts/<acct>/pages/projects/aiconverter` → `10000 Authentication
    error` (re-checked live).
  - `wrangler whoami` → not authenticated; no OAuth session on this VPS.
  - No Bing Webmaster API key, no Microsoft Graph credential, no Porkbun API
    credential, no IndexNow key in the environment (checked).
  - DNS still authoritative at Porkbun (`ops/dns.md`); no Porkbun API
    credential available.
- **IndexNow key now prepared in-repo (2026-08-14):** key file
  `public/{key}.txt` + `public/IndexNow.txt` hold a real freshly generated
  UUID key (`1bc751e6-ead3-48da-96d3-722f77cc4464`). The key is not yet live —
  it needs the same Cloudflare Pages deploy that is still blocked — and no
  IndexNow submission has been sent (the key is not live, so a submission
  would be rejected). Once a Pages:Edit deploy exists, the key goes live with
  the deploy and step 4 below can run immediately.

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

## Why Bing Webmaster Submission Is Still Blocked From This Lane

- **Account action (unchanged).** Bing Webmaster Tools ownership verification
  and the Webmaster sitemap-submission UI require signing in with a Microsoft
  (or linked GitHub/Google) account. Per the fleet venue-policy pattern used
  for Product Hunt and BetaList (`ops/launch-venues.md`), account actions stay
  with Nish; an agent must not drive an authenticated browser session.
- **No Bing Webmaster API credentials (unchanged).** No Bing Webmaster API key
  and no Microsoft Graph credential exist in this lane's environment.
- **No DNS write path (unchanged).** Verification via DNS TXT needs Porkbun
  access; DNS is authoritative at Porkbun (`ops/dns.md`) and no Porkbun API
  credential is available in this lane's environment.
- **Deploy path is open as of 2026-08-22.** GitHub Actions run `32550455542`
  published production. The IndexNow key files return HTTP 200. The previous
  "no deploy path" blocker is retired. IndexNow ping is the credential-free
  sitemap-notification path and is no longer blocked.
- **No fabrication (unchanged).** A Bing Webmaster verification token or meta
  tag would need to be Bing-issued; none is invented here. The IndexNow key
  `1bc751e6-ead3-48da-96d3-722f77cc4464` is self-issued by protocol design and
  is live.

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
  (meta tag, `BingSiteAuth.xml` file upload) can ship via the now-working
  Pages deploy, but the token must be Bing-issued after Nish adds the
  property; do not invent one.
3. **Submit the sitemap.** In Bing Webmaster Tools → Sitemaps, submit
   `https://aiconverter.app/sitemap.xml` and confirm it reports valid/200.
4. **IndexNow (credential-free, now live).** Key files
   `https://aiconverter.app/1bc751e6-ead3-48da-96d3-722f77cc4464.txt` and
   `https://aiconverter.app/IndexNow.txt` return HTTP 200 with body
   `1bc751e6-ead3-48da-96d3-722f77cc4464` as of the 2026-08-22 Pages deploy.
   First ping from this lane: `node scripts/indexnow-submit.mjs` →
   exit 0 — stdout: `Submitting 24 URL(s) to https://api.indexnow.org/ ...` then `IndexNow accepted (HTTP 200) for 24 URL(s).`. Remaining Nish step: add the same key in Bing
   Webmaster IndexNow settings if desired. Do not rotate the key.
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
