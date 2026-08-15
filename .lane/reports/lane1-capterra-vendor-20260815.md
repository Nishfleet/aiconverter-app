# Lane 1 evidence — 2026-08-15: Capterra vendor profile / decline (packet item 83c4f2d087)

**Verdict: ALREADY COMPLETE ON MAIN — no duplicate work performed.** The
packet asks to "create a truthful Capterra vendor profile or record a
decline". The dated decline and truthful copy-paste kit were recorded by a
prior run of this exact lane item and **merged to main on 2026-08-15 at
01:34:29Z as commit f0db7d2 (PR #113)** — nine minutes after this lane
opened. This lane is a duplicate dispatch of the same packet item
(83c4f2d087). Creating a second, identical PR would add merge noise and
conflict pressure to the shared `ops/launch-venues.md` file that eleven
other lanes also edit, so the correct outcome is this record plus a
point-in-time re-verification that the standing decision and kit are still
live and truthful. No code or docs were changed.

## The deliverable is already on main

- Commit `f0db7d2` ("docs(lane): record 2026-08-15 Capterra lane attempt
  (NOT EXECUTED — venue policy gate + reviewed vendor form; decline + kit
  re-recorded)") is the tip of origin/main and is the merge of PR #113
  (state MERGED, mergedAt 2026-08-15T01:34:29Z).
- `git diff 52e9a92 f0db7d2` is empty — the merged tree is identical to the
  prior branch's work. The Capterra section in `ops/launch-venues.md`
  contains:
  - **Decision (dated 2026-08-11, re-verified 2026-08-15): DECLINED for
    agent-executed submission.** Truthful profile creation is a manual
    external-account action by Nish via the official Gartner Digital
    Markets get-listed flow.
  - Fleet lane attempt 2026-08-15 record (NOT EXECUTED; policy guard exit
    4; bot wall 403; reviewed vendor form + email verification).
  - Truthful copy-paste kit (name, tagline, description, key features,
    category guidance, pricing tag, canonical links, post-listing check).
- This lane's worktree HEAD (b1c9def) predates the merge; the work is on
  origin/main, not in this checkout.

## Live re-verification 2026-08-15 (this lane, credential-free)

- Policy ledger unchanged: `venue-policy.json` still `updated: 2026-08-08`,
  `allowlist: {}` (empty), capterra.com `automation_disposition: "unknown"`
  → per the venue-claim contract, `claim` exits 4 and a blocked exit means
  NO browser work. `venue-claim` still not installed in the lane environment
  (`/home/nish/.local/bin/venue-claim: No such file or directory`).
- Official path live: `https://digitalmarkets.gartner.com/get-listed/start`
  → HTTP 200 and redirects to `https://app.g2digitalmarkets.com/get-listed/start`
  (HTTP 200, "G2 Digital Markets" portal) — unchanged from the merged
  record.
- Capterra bot wall: direct VPS access to `https://www.capterra.com/` →
  HTTP 403 (unchanged).
- Wayback CDX (no-duplicate probe): `capterra.com/p/aiconverter*` →
  zero captures (empty result set, HTTP-200 response). The broader CDX
  queries (`capterra.com/p/*` with urlkey filter, and the peer
  `capterra.com/p/10048907/*`) intermittently returned 503 from the
  archive service this run — the availability API also returned no
  snapshot for the peer URL — so this lane does not re-claim the peer
  capture state; the merged record's dated 2026-08-15 evidence and the
  scout's 2026-08-09 live peer check stand. The zero-capture no-duplicate
  finding for aiconverter itself re-verified clean.
- Kit reference pages all live HTTP 200 (2026-08-15, this lane): `/`,
  `/llms.txt`, `/bank-statement-pdf-to-csv/`, `/sample-csv/`, `/trust/`,
  `/formats/`; `/pricing/` and `/receipt-to-csv/` still 404 (unchanged;
  the kit claims none of those routes).

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
- Branch pushed: `lane1/capterra-vendor-20260815` with this report. No PR
  opened — the merged PR #113 already carries the deliverable.
