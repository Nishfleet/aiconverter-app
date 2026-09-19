# Lane 1 report — TinyLaunch listing (2026-08-23)

## Packet item

84b2e7b871: "List the product on TinyLaunch — 3 exact-category competitors launched there in the last 30 days and AI Converter"

## Outcome

**NOT EXECUTED — venue policy guard + email-OTP account boundary**

TinyLaunch hosts three exact-category bank-statement peers launched in the last
30 days and no aiconverter.app listing exists (sitemap, Wayback CDX, slug
probes). Free launch slots are bookable (earliest 2026-09-21). Submission was
not attempted: `tinylaunch.com` is unreviewed in the venue policy ledger
(`venue-claim claim` exit 2 — missing required policy metadata) and the
`/llms.txt` API flow requires email-OTP auth that the lane cannot supply. Zero
tinylaunch records in `venue-claim list` before and after the claim attempt.

## Live re-verification

| Check | Command | Result | Interpretation |
| --- | --- | --- | --- |
| Sitemap enumeration | `curl -sS https://www.tinylaunch.com/sitemap.xml \| grep -oE '/launch/[0-9]+-[a-z0-9-]+' \| sort -u \| wc -l` | 14732 | Full launch URL set enumerated. |
| Sitemap duplicate grep | `grep -icE 'aiconverter\|ai-converter' /tmp/opencode/tl-launch-urls.txt` | 1 | One false-positive: `/launch/8592-audio-to-text-ai-converter` (different product); no aiconverter.app listing. |
| Wayback CDX | `curl -sS 'http://web.archive.org/cdx/search/cdx?url=tinylaunch.com&matchType=domain&filter=urlkey:.*aiconverter.*'` | (empty) | Zero archived rows for aiconverter on tinylaunch.com. |
| Slug probe | `curl -sS -o /dev/null -w '%{http_code}' https://www.tinylaunch.com/launch/aiconverter` | HTTP 404 | No listing at this slug. |
| Slug probe | `curl -sS -o /dev/null -w '%{http_code}' https://www.tinylaunch.com/launch/ai-converter` | HTTP 404 | No listing at this slug. |
| Slug probe | `curl -sS -o /dev/null -w '%{http_code}' https://www.tinylaunch.com/launch/aiconverter-app` | HTTP 404 | No listing at this slug. |
| Slug probe | `curl -sS -o /dev/null -w '%{http_code}' https://www.tinylaunch.com/launch/ai-converter-app` | HTTP 404 | No listing at this slug. |
| Search dead end | `curl -sS -o /dev/null -w '%{http_code} %{redirect_url}' 'https://www.tinylaunch.com/search?q=aiconverter'` | `307 https://www.tinylaunch.com/login?q=aiconverter&returnTo=%2Fsearch%3Fq%3Daiconverter` | Auth-gated; not usable for duplicate proof. |
| Startups API dead end | `curl -sS https://www.tinylaunch.com/api/v1/startups` | `{"error":"missing_bearer_token"}` | Bearer required; not usable without account. |
| Launch dates API | `curl -sS https://www.tinylaunch.com/api/v1/launch-dates` | Earliest free slot 2026-09-21 (`bookable_free: true`, 100 slots); 2026-08-24–2026-09-14 `premium_only: true` | Free tier available; earliest slot 2026-09-21. |
| Categories API | `curl -sS https://www.tinylaunch.com/api/v1/categories` | Finance & FinTech `id: 5`, category group Business & Finance | Category for kit. |
| Agent guide | `curl -sS https://www.tinylaunch.com/llms.txt` | HTTP 200; eight-endpoint flow (`/auth/request-code` → `/auth/verify` → `/maker` → `/startups` → `/launches`) | Official agent submission path documented. |
| Venue-claim check | `venue-claim check tinylaunch.com aiconverter-app` | exit 0; `policy disposition for tinylaunch.com: unknown (not reviewed)` | Pre-flight safe; policy not reviewed. |
| Venue-claim list (before) | `venue-claim list \| grep -ci tinylaunch` | 0 | No existing tinylaunch ledger records. |
| Venue-claim claim | `venue-claim claim tinylaunch.com aiconverter-app` | exit 2; missing required `--account`, `--policy-date`, `--policy-url`, `--evidence-path`, `--removal-route`, `--verification-state` | Claim subcommand requires full policy metadata; no executable allowlist entry. |
| Venue-claim list (after) | `venue-claim list \| grep -ci tinylaunch` | 0 | No ledger record created. |
| Kit page `/` | `curl -sS -o /dev/null -w '%{http_code}' https://aiconverter.app/` | HTTP 200 | Live. |
| Kit page `/llms.txt` | `curl -sS -o /dev/null -w '%{http_code}' https://aiconverter.app/llms.txt` | HTTP 200 | Live. |
| Kit page `/bank-statement-pdf-to-csv/` | `curl -sS -o /dev/null -w '%{http_code}' https://aiconverter.app/bank-statement-pdf-to-csv/` | HTTP 200 | Live. |
| Kit page `/sample-csv/` | `curl -sS -o /dev/null -w '%{http_code}' https://aiconverter.app/sample-csv/` | HTTP 200 | Live. |
| Kit page `/trust/` | `curl -sS -o /dev/null -w '%{http_code}' https://aiconverter.app/trust/` | HTTP 200 | Live. |
| Kit page `/formats/` | `curl -sS -o /dev/null -w '%{http_code}' https://aiconverter.app/formats/` | HTTP 200 | Live. |
| Peer Bank Statement Engine | `curl -sS -o /dev/null -w '%{http_code}' https://www.tinylaunch.com/launch/16986-bank-statement-engine` | HTTP 200; launch date 2026-07-27 | Exact-category peer within 30-day window. |
| Peer Statement Flow | `curl -sS -o /dev/null -w '%{http_code}' https://www.tinylaunch.com/launch/16996-statement-flow` | HTTP 200; launch date 2026-07-27 | Exact-category peer within 30-day window. |
| Peer Clearly Ledger | `curl -sS -o /dev/null -w '%{http_code}' https://www.tinylaunch.com/launch/17071-clearly-ledger` | HTTP 200; launch date 2026-08-03 | Exact-category peer within 30-day window. |

## Exact-category peers

1. Bank Statement Engine — `https://www.tinylaunch.com/launch/16986-bank-statement-engine` (HTTP 200, launched 2026-07-27)
2. Statement Flow — `https://www.tinylaunch.com/launch/16996-statement-flow` (HTTP 200, launched 2026-07-27)
3. Clearly Ledger — `https://www.tinylaunch.com/launch/17071-clearly-ledger` (HTTP 200, launched 2026-08-03)

## Changes made

- Created `.lane/reports/lane1-tinylaunch-listing-20260823.md` (this file)
- Created `ops/tinylaunch-listing-20260823.md` (durable repo record)
- Edited `ops/launch-venues.md` (TinyLaunch venue #17: intro chain, venue count,
  submission-outcomes bullet, full TinyLaunch section)
- Branch `lane1-tinylaunch-listing-20260823` pushed; PR #178 opened

## Next action

Human-owned: Nish completes email-OTP sign-up at TinyLaunch, creates the
startup using the manual submission kit in `ops/launch-venues.md` § TinyLaunch,
and schedules the free launch on 2026-09-21 (or a later free window). No agent
submission is possible without venue policy review and account creation.
