# Lane 1 evidence — 2026-08-20: Microlaunch listing via + New Launch (packet item ed8ccbdb9d, re-dispatch #4)

**Verdict: NOT EXECUTED — the Microlaunch venue re-verified live 2026-08-20
and the standing decision in `ops/launch-venues.md` (dated 2026-08-11) still
binds. The regular (free) launch was not submitted, for the same reasons as
every prior attempt (2026-08-12 lane 3, 2026-08-14 lane 1, 2026-08-17 lane
1): the fleet venue policy ledger (`agent-state/growth-loop/venue-policy.json`,
updated 2026-08-08, re-read 2026-08-20) has no microlaunch.net entry —
`automation_disposition: unknown`, allowlist still EMPTY — so `venue-claim
claim` exits 4 and the agent must not drive a browser submission. Submission
additionally requires a human account action (the sign-in gate is Google / 𝕏
OAuth only), which stays with Nish per the 2026-08-11 decision; the optional
Pro Launch $39 upgrade is a spend decision only Nish can make (no spend
authorization exists in `agent-state/authorizations/` — only the sol-xhigh
worker grant). No venue policy change occurred since 2026-08-17.**

## Live re-verification 2026-08-20 (all credential-free, plain HTTP via `urllib`)

- Homepage live, HTTP 200 (final URL `https://microlaunch.net/`): "The Launch
  Platform for World-Class Startups"; homepage body still contains the
  substrings "new launch", "world-class", "daily visitors", "google",
  "x.com", "twitter", "launch20", and "signup". Nav still surfaces the
  New Launch entry point and the OAuth-gated Sign-up button.
- `/submit` is now followed automatically to its destination by the live
  check (final URL `https://microlaunch.net/premium#pricing`, status 200);
  this matches the standing 307 redirect recorded on 2026-08-17 — the free
  submission path is gated behind account creation.
- `/premium` live, HTTP 200: body still contains "regular launch",
  "pro launch", "launch20", "expert feedback" (the free tier referenced in
  the FAQ, the Pro Launch offer, and the optional paid add-on). The literal
  "$39" string is no longer present in the served HTML, but the "Pro Launch"
  card and the LAUNCH20 code are both still served (unchanged commercial
  surface from 2026-08-17).
- Both exact-category peers still live, HTTP 200:
  - https://microlaunch.net/p/bankstatementconverter (Bank Statement
    Converter, launched 2026-02-08).
  - https://microlaunch.net/p/bankformats (Bankformats, launched
    2026-06-14, Accounting Tools, Saas, Subscription).
- No duplicate: the full launches/products API
  (https://api.microlaunch.net/api/launches, `authorized_mode: false`,
  `data.launches` and `data.products` lists each **246** records, up from 233
  on 2026-08-17) still has **zero hits** for `aiconverter`, `ai-converter`,
  or `ai converter` across every field (slug, codename, name, labels,
  description). Slug probes `/p/aiconverter`, `/p/ai-converter`,
  `/p/aiconverter-app`, `/p/ai-converter-app`, `/p/AI-Converter`,
  `/p/aiconverter.app` all return HTTP 500 (the same not-found behaviour
  recorded on 2026-08-12, 2026-08-14 and 2026-08-17).
- ToS live, HTTP 200: https://microlaunch.net/terms — generic template
  (4817 chars), still no `robot`, `spider`, `crawl`, `scrap`, `automated`,
  or `bot` strings (unchanged; flag for the venue research desk; the
  `venue-claim` guard stays exit-4 either way).
- Kit reference pages all live HTTP 200 (2026-08-20):
  - https://aiconverter.app/ (200)
  - https://aiconverter.app/llms.txt (200)
  - https://aiconverter.app/bank-statement-pdf-to-csv/ (200)
  - https://aiconverter.app/sample-csv/ (200)
  - https://aiconverter.app/trust/ (200)
  - https://aiconverter.app/formats/ (200)
  - https://aiconverter.app/pricing/ (404 — unchanged)
  - https://aiconverter.app/receipt-to-csv/ (404 — unchanged)
  The kit explicitly claims none of the 404 routes, so the submission copy
  remains accurate.

## Blocking factors (all re-confirmed live 2026-08-20)

1. **Venue policy ledger blocks agent submission.**
   `agent-state/growth-loop/venue-policy.json` (updated 2026-08-08, re-read
   2026-08-20) has no microlaunch.net entry — `automation_disposition:
   unknown`, not in the allowlist — so per the `venue-claim` contract,
   `claim` exits 4 and "A blocked exit means NO browser work." Repo runbook
   `ops/launch-venues.md` (2026-08-11) states explicitly: "microlaunch.net
   is not in the venue policy allowlist ... so `venue-claim claim` exits 4
   — the agent must not drive a browser submission." The `venue-claim`
   binary is not installed in the lane environment, but the policy JSON
   is the authoritative guard and it has not been updated.
2. **OAuth sign-in gate (human account action).** The sign-in flow offers
   Google / 𝕏 (X) only; no email/OTP or agent flow exists, so account
   creation stays with Nish per the 2026-08-11 decision ("Nish signs in
   (Google or 𝕏) and submits a Regular launch using the kit below").
3. **Paid upgrade decision stays with Nish.** The Pro Launch $39 one-time
   (code LAUNCH20) is an optional spend call; no spend authorization
   exists in `agent-state/authorizations/` (only
   `sol-xhigh-worker-grant-20260811.json`).
4. This record is the honest NOT-EXECUTED lane outcome the re-dispatch
   packet requires; the dated decision line in `ops/launch-venues.md`
   flips to SUBMITTED only after Nish submits the Regular launch.

## Checks on this lane

- Live HTTP checks for Microlaunch homepage, `/submit` redirect target,
  premium pricing page FAQ, both exact-category peers, the launches API
  duplicate scan (246 + 246 records, zero aiconverter hits), slug probes,
  ToS, and the aiconverter.app kit reference pages — all as recorded
  above.
- No code changed; docs only (`ops/launch-venues.md` Microlaunch section
  appended with the 2026-08-20 re-verification, this report).

## What would change the verdict (for the next dispatch)

- The venue research desk adds `microlaunch.net` to
  `agent-state/growth-loop/venue-policy.json#allowlist` (or marks
  `automation_disposition: review_complete`) **and** an agent-usable
  endpoint exists; OR
- Nish completes the OAuth sign-in flow and submits the Regular launch
  with the kit already on file in `ops/launch-venues.md`, then the
  dated "Decision" line flips to SUBMITTED with the live product URL.

Until either happens, every re-dispatch of this packet produces the same
honest NOT-EXECUTED outcome and a fresh dated re-verification.
