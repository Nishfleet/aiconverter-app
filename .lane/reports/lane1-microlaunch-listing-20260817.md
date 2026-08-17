# Lane 1 evidence — 2026-08-17: Microlaunch listing via + New Launch (packet item ed8ccbdb9d, re-dispatch)

**Verdict: NOT EXECUTED — the Microlaunch venue re-verified live 2026-08-17
and the standing decision in `ops/launch-venues.md` (dated 2026-08-11) still
binds. The regular (free) launch was not submitted, for the same reasons as
every prior attempt (2026-08-12 lane 3, 2026-08-14 lane 1): the fleet venue
policy ledger (`agent-state/growth-loop/venue-policy.json`, updated
2026-08-08) has no microlaunch.net entry — `automation_disposition: unknown`,
allowlist EMPTY — so `venue-claim claim` exits 4 and the agent must not drive
a browser submission. Submission additionally requires a human account action
(the sign-in gate is Google / 𝕏 OAuth only), which stays with Nish per the
decision above; the optional Pro Launch $39 upgrade is a spend decision only
Nish can make (no spend authorization exists in `agent-state/authorizations/`
— only the sol-xhigh worker grant). No venue policy change occurred since
2026-08-14.**

## Live re-verification 2026-08-17 (all credential-free, plain HTTP)

- Homepage live, HTTP 200: https://microlaunch.net — "The Launch Platform
  for World-Class Startups"; nav still shows "+ New Launch" and a "Signup"
  nav button (sign-in is OAuth-gated; Google avatar and x.com/twitter
  strings present in the served HTML).
- /submit still redirects (307, was 302) to /premium#pricing; the premium
  page (HTTP 200) still names the "Regular launch" tier in its FAQ ("What's
  the difference between Pro and Regular launch?") and the Pro Launch $39
  offer with code LAUNCH20.
- Both exact-category peers still live, HTTP 200: Bank Statement Converter
  (https://microlaunch.net/p/bankstatementconverter, Saas) and Bankformats
  (https://microlaunch.net/p/bankformats, Accounting Tools, Saas,
  Subscription) — the category is hosted; only this product's listing is
  missing.
- No duplicate: the full launches/products API
  (https://api.microlaunch.net/api/launches, `authorized_mode: false`, now
  233 launches + 233 products in the slice) has zero hits for aiconverter /
  "AI Converter" / ai-converter across every field; slug probes
  /p/aiconverter, /p/ai-converter, /p/ai-converter-app, /p/aiconverter-app
  all return no product (500).
- ToS live, HTTP 200: https://microlaunch.net/terms — generic template, no
  robot/spider/automated-access prohibition (unchanged; flag for the venue
  research desk, the guard stays exit-4 either way).
- Kit reference pages all live HTTP 200 (2026-08-17): `/`, `/llms.txt`,
  `/bank-statement-pdf-to-csv/`, `/sample-csv/`, `/trust/`, `/formats/`;
  `/pricing/` and `/receipt-to-csv/` still 404 (unchanged; the kit claims
  none of those routes).

## Blocking factors (all re-confirmed live 2026-08-17)

1. **Venue policy ledger blocks agent submission.**
   `agent-state/growth-loop/venue-policy.json` (updated 2026-08-08, re-read
   2026-08-17) has no microlaunch.net entry — `automation_disposition:
   unknown`, not in the allowlist — so per the `venue-claim` contract,
   `claim` exits 4 and "A blocked exit means NO browser work." Repo runbook
   `ops/launch-venues.md` (2026-08-11) states explicitly: "microlaunch.net
   is not in the venue policy allowlist ... so `venue-claim claim` exits 4 —
   the agent must not drive a browser submission." The `venue-claim` binary
   is not installed in the lane environment, but the policy JSON is the
   authoritative guard and it has not been updated.
2. **OAuth sign-in gate (human account action).** The sign-in flow offers
   Google / 𝕏 (X) only; no email/OTP or agent flow exists, so account
   creation stays with Nish per the 2026-08-11 decision ("Nish signs in
   (Google or 𝕏) and submits a Regular launch using the kit below").
3. **Paid upgrade decision stays with Nish.** The Pro Launch $39 one-time
   (code LAUNCH20) is an optional spend call; no spend authorization exists
   in `agent-state/authorizations/` (only
   `sol-xhigh-worker-grant-20260811.json`).
4. This record is the honest NOT-EXECUTED lane outcome the re-dispatch
   packet requires; the dated decision line in `ops/launch-venues.md` flips
   to SUBMITTED only after Nish submits the Regular launch.

## Checks on this lane

- Live HTTP checks for Microlaunch homepage, /submit redirect, premium
  pricing page FAQ, both exact-category peers, the launches API duplicate
  scan (233 + 233 records), slug probes, ToS, and the aiconverter.app kit
  reference pages (2026-08-17) — all as recorded above.
- No code changed; docs only (`ops/launch-venues.md` Microlaunch section
  updated with this run's re-verification, this report).