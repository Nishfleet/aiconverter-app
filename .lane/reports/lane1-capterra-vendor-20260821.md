# Lane 1 report — Capterra vendor profile / decline (2026-08-21)

Packet item 83c4f2d087: "Create a truthful Capterra vendor profile or record a
decline — Capterra already has a current bank-statement-conv[erter listing]".

## Outcome: NOT EXECUTED (policy-blocked). Decline re-verified and now backed by a live guard receipt.

The vendor profile was **not created**. The standing decision on main —
**DECLINED for agent-executed submission; the truthful copy-paste kit stays in
`ops/launch-venues.md` and the get-listed submission stays Nish's manual
step** — is re-verified live today and remains correct.

What is materially new this run: **`venue-claim` is now installed on this VPS**
(`/home/nish/.local/bin/venue-claim`, mtime 2026-08-20 23:24). Every prior
Capterra record (2026-08-11, 2026-08-15) had to *infer* the block from the
policy JSON because the binary was missing (exit 127). This run executed the
guard and captured the actual exit code.

## The guard, actually executed (2026-08-21)

| Command | Result |
|---|---|
| `venue-claim check capterra.com aiconverter-app` | exit **0**, stderr: `policy disposition for capterra.com: reviewed (unknown)` (exit 0 = no active ledger record; it is *not* an allow) |
| `venue-claim validate` | capterra.com listed under **reviewed (non-executable) venues** |
| `venue-claim claim capterra.com aiconverter-app ...` (real production policy, sandboxed ledger) | exit **4** — `ALLOWLIST/POLICY BLOCK: venue capterra.com is reviewed as unknown - not automation-allowed; route to NEEDS-NISH/manual, never bypass.` |

Per `agent-state/growth-loop/venue-claim.md`, `claim` is THE gate and **a
blocked exit means NO browser work** — so no account creation, no vendor form,
no navigation of capterra.com was performed.

Safety of the probe: the `claim` invocation ran with `VENUE_POLICY_PATH`
pointed at a byte copy of the **production** policy (so the block is the real
policy's verdict) while `VENUE_LEDGER_PATH`, `VENUE_MARKDOWN_PATH` and
`VENUE_LOCK_PATH` pointed at throwaway files in `/tmp` (the documented
test-isolation overrides). Verified after the run: the sandbox ledger is still
`{"version":1,"records":{}}` and the production `venues.json` still contains
**zero** capterra records. Nothing in the control plane was mutated.

Policy ledger re-read 2026-08-21 — unchanged: `venue-policy.json`
`updated: 2026-08-08`, `allowlist: {}` (empty), capterra.com
`automation_disposition: "unknown"` ("NOT automation-allowed until current
official evidence exists").

## Live re-verification (2026-08-21, credential-free)

- **Capterra bot wall unchanged (HTTP 403 from this VPS):** `https://www.capterra.com/`,
  `/p/10048907/Bank-Statement-Converter/` (the peer profile), `/vendors/`,
  `/legal/listing-guidelines/` — all 403.
- **Official path still live:** `https://digitalmarkets.gartner.com/get-listed/start`
  → HTTP 200, redirecting to `https://app.g2digitalmarkets.com/get-listed/start`
  (HTTP 200). The kit's "next action" URL is still correct.
- **No duplicate listing (Wayback CDX):** zero captures for
  `capterra.com/p/*aiconverter*`, `capterra.com/p/*ai-converter*`, and a
  regex-filtered scan of `capterra.com/p/` for `.*[Aa][Ii][-]?[Cc]onverter.*`.
  Control probe (new this run): `capterra.com/p/` prefix *does* return
  captures (e.g. `capterra.com/p&c-insurance-software/`, 200, 2018), proving
  the empty aiconverter result is a real absence rather than a broken query.
  The listing is **missing, not duplicate** — consistent with the packet's
  premise that Capterra already hosts the category via the peer profile.
- **Kit reference pages (HTTP 200):** `/`, `/llms.txt`,
  `/bank-statement-pdf-to-csv/`, `/sample-csv/`, `/trust/`, `/formats/`.
- **Regression still open:** `/pricing/` is **404** again today — the
  regression first recorded on 2026-08-20 has not self-healed.
  `/receipt-to-csv/` is 404 as before. The Capterra kit references neither
  route, so the kit remains truthful as written; flagged here for the loop
  because it is outside this lane's owned files.

## Why a truthful profile still cannot be agent-created

1. **Policy gate (observed, not inferred):** `venue-claim claim` exits 4 —
   capterra.com is reviewed-unknown and the executable allowlist is empty. A
   blocked exit forbids browser work. The only override is a root change to
   the allowlist by the venue research desk.
2. **Account-owner gate:** the official route is a reviewed Gartner/G2 Digital
   Markets vendor form with email verification and editorial review — no
   product-creation API, no agent-credential path. Even an allowlisted venue
   would leave the verification email with Nish.
3. **Bot wall:** direct VPS access to every relevant Capterra page is 403, so
   the profile could not be filled or verified from here regardless.
4. **Money boundary:** no listing fee surfaced; optional sponsored placement
   remains Nish's spend call. No spend authorization exists in
   `agent-state/authorizations/`.

## Unblock (human-owned, unchanged)

Nish creates the vendor account at `https://app.g2digitalmarkets.com/get-listed/start`
(use the `claim-bx` flow if a profile already exists for aiconverter.app,
otherwise the new-product form) and submits with the kit in the Capterra
section of `ops/launch-venues.md`. Afterwards, put the public profile URL in
that file and flip the status line to live.

## Files changed

- `ops/launch-venues.md` — added the dated **2026-08-21 lane attempt** block to
  the Capterra section (live guard receipt, bot-wall/official-path/CDX
  re-verification, `/pricing/` regression note), updated the Capterra decision
  heading and the header verification line to include 2026-08-21, updated the
  summary bullet, and re-dated the kit's canonical-link verification.
- `.lane/reports/lane1-capterra-vendor-20260821.md` — this report (path unique
  to this lane; the shared `.lane/report.md` was left untouched).
