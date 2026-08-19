# Lane 1 evidence — 2026-08-15: Capterra vendor profile / decline (packet item 83c4f2d087)

**Verdict: ALREADY COMPLETE ON MAIN — no duplicate work performed.** The
packet asks to "create a truthful Capterra vendor profile or record a
decline". The dated decline and truthful copy-paste kit were recorded by a
prior run of this exact lane item and **merged to main on 2026-08-15 at
01:34:29Z as commit f0db7d2 (PR #113)**. This lane is a duplicate dispatch
of the same packet item (83c4f2d087): the prior run pushed a record branch
but opened no PR, so this run re-verifies the standing decision and kit live
and lands this lane's point-in-time verification report via PR. The shared
`ops/launch-venues.md` file is intentionally untouched — its Capterra
section (decision + kit) already carries the deliverable and is not
duplicated here.

## The deliverable is already on main

- Commit `f0db7d2` ("docs(lane): record 2026-08-15 Capterra lane attempt
  (NOT EXECUTED — venue policy gate + reviewed vendor form; decline + kit
  re-recorded)") is the tip of origin/main and is the merge of PR #113
  (state MERGED, mergedAt 2026-08-15T01:34:29Z).
- The Capterra section in `ops/launch-venues.md` (merged via PR #113)
  contains:
  - **Decision (dated 2026-08-11, re-verified 2026-08-15): DECLINED for
    agent-executed submission.** Truthful profile creation is a manual
    external-account action by Nish via the official Gartner Digital
    Markets get-listed flow.
  - Fleet lane attempt 2026-08-15 record (NOT EXECUTED; policy guard exit
    4; bot wall 403; reviewed vendor form + email verification).
  - Truthful copy-paste kit (name, tagline, description, key features,
    category guidance, pricing tag, canonical links, post-listing check).
- The prior run of this same packet (branch
  `lane1/capterra-vendor-20260815`, commit 40f6f15) recorded the same
  ALREADY-COMPLETE verdict but pushed without opening a PR; this run
  completes the packet's push-and-PR requirement with a fresh
  re-verification.

## Live re-verification 2026-08-15 (this run, credential-free)

- Policy ledger unchanged: `venue-policy.json` (re-read this run) still
  `updated: 2026-08-08`, `allowlist: {}` (empty), capterra.com
  `automation_disposition: "unknown"` → per the venue-claim contract,
  `claim` exits 4 and a blocked exit means NO browser work. `venue-claim`
  still not installed in the lane environment
  (`/home/nish/.local/bin/venue-claim: No such file or directory`).
- Official path live: `https://digitalmarkets.gartner.com/get-listed/start`
  → HTTP 200 and redirects to `https://app.g2digitalmarkets.com/get-listed/start`
  (HTTP 200, "G2 Digital Markets" portal) — unchanged from the merged
  record.
- Capterra bot wall: direct VPS access to `https://www.capterra.com/` →
  HTTP 403 (unchanged).
- Wayback CDX (no-duplicate probe): `capterra.com/p/aiconverter*` → zero
  captures (empty result set) — no duplicate listing exists for
  aiconverter.app; the venue hosts the category only via the live peer
  profile `capterra.com/p/10048907/Bank-Statement-Converter/`.
- Kit reference pages all live HTTP 200 (this run): `/`, `/llms.txt`,
  `/bank-statement-pdf-to-csv/`, `/sample-csv/`, `/trust/`, `/formats/` —
  the kit is truthful to live behavior.

## Why the item stays not-executed-by-agent and the decline stands

1. `venue-policy.json` allowlist is EMPTY and capterra.com is
   `automation_disposition: unknown` (reviewed_venues, 2026-08-08) — exit
   4 per the venue-claim contract; no agent-driven browser work, including
   profile creation or account sign-up.
2. The official path is a reviewed Gartner Digital Markets vendor form
   (email verification + editorial review) that requires the account owner
   (Nish). Direct VPS access to Capterra is 403 bot-walled.
3. No listing fee surfaced; optional sponsored placement stays Nish's spend
   call. No spend authorization exists in `agent-state/authorizations/`
   (only the sol-xhigh worker grant, expired 2026-08-14).

## Outcome

- **Item deliverable: already recorded on main (PR #113, f0db7d2).**
  Decision: **DECLINED for agent-executed submission; manual get-listed
  flow stays with Nish** — the truthful kit is in `ops/launch-venues.md`
  (Capterra section), copy-paste ready.
- Files changed by this lane: `.lane/reports/lane1-capterra-vendor-20260815.md`
  (this report) only. `ops/launch-venues.md` intentionally untouched to
  avoid a conflicting duplicate PR.
- Branch pushed: `lane1/capterra-vendor-rereverify-20260815` with this
  report; PR opened to close out the packet with the re-verification
  receipt.
