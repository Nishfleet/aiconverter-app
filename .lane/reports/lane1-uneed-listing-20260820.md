# Lane 1 report — Uneed free waiting-line submit (2026-08-20 re-verify)

Packet item 12a5d614ce: "List the product on Uneed via free waiting-line
submit (record paid skip-the-line decision) — exact-category peers".

## Outcome: NOT EXECUTED — venue behavior has materially changed since 2026-08-17

The listing was **not submitted** — the eighth lane run to reach this
conclusion (2026-08-11 kit + NEEDS_NISH_STEP, 2026-08-12 NOT EXECUTED,
2026-08-15 NOT EXECUTED, 2026-08-15 re-verify, 2026-08-16 NOT EXECUTED,
2026-08-16 re-verify, 2026-08-17 NOT EXECUTED, and this 2026-08-20
re-verify). **What changed since 2026-08-17:** Uneed has closed its free
waiting line to new products — the API now returns
`{ free_line_closed: true, free_next_available: null }` and `tier: "free"`
returns HTTP 400 `free_line_closed`. launch.txt (the venue's own official
Agent Launch Guide) has been updated to say so explicitly. The packet's
"free waiting-line submit" is no longer a live option on this venue. STWL
($29.99) is now the only API launch path; "Submit without scheduling"
(saves the product for free, no launch date — scheduled later from the UI)
is also available but does not produce a listing in the daily ranking or
award eligibility without a paid launch.

Both independent blockers still hold and were re-verified live this run:

1. **Fleet venue policy gate (machine-enforced, unchanged).**
   `/home/nish/workspaces/agent-state/growth-loop/venue-policy.json` (updated
   2026-08-08, re-read live this run) still has **no uneed.best entry** —
   `automation_disposition: unknown`, and the executable allowlist is still
   empty (`allowlist: {}`). `venue-claim check uneed.best aiconverter-app`
   prints `policy disposition for uneed.best: unknown (not reviewed)` and
   exits 0 (pre-flight safe), but `venue-claim claim` requires the
   allowlist and would exit 4. Per the `venue-claim` contract, "A blocked
   exit means NO browser work" — an agent must not drive the submission.
   The `venue-claim` binary IS installed at `/home/nish/.local/bin/venue-claim`
   in this lane environment (correcting the 2026-08-15 → 2026-08-17 reports,
   which were written before the binary landed in PATH scope for this lane
   image); the policy JSON is the authoritative guard and remains unchanged.
2. **Email-OTP account gate (human account action, unchanged).**
   The launch flow still requires email-OTP sign-up (launch.txt, live this
   run: `POST /api/v1/auth/request-code` → user pastes the code →
   `POST /api/v1/auth/verify`). launch.txt is explicit: "Never guess,
   prefill, or reuse an email from context — ask, wait, accept what they
   type." No fleet inbox exists in this environment (the only email
   tooling is send-only `notify-email`), so the agent cannot receive or
   paste the OTP; account creation stays with Nish per the 2026-08-11
   decision ("Nish signs up (email OTP)").

## Paid skip-the-line decision (the packet's record requirement)

**Skip the Waiting Line $29.99 is now mandatory for any launched listing**
(no free waiting-line option exists anymore). Re-verified live this run:
`agent-state/authorizations/` holds only the `sol-xhigh-worker-grant-20260811.json`
grant (expired 2026-08-14); there is no Uneed spend authorization and no
Uneed entry in any dispatch ledger. STWL dates are bookable from
**2026-08-28** (soonest, 8 days out) — much shorter than the prior 6-month
free wait. Three possible paths remain for Nish:

- **STWL $29.99** — pick a launch date (soonest 2026-08-28); permanent
  do-follow backlink, daily ranking spot, weekly/monthly/yearly award
  eligibility.
- **"Submit without scheduling" (free)** — POST /api/v1/products only;
  saves the product on Uneed with no launch date. Scheduling later costs
  Fast-track $14.99 (slot ~14 days out) or STWL $29.99 (pick a date).
- **Uneed Pro (early bird $99/year)** — bundles 1 free STWL credit per
  year (worth $29.99). Not necessary for this packet; recorded for
  completeness because the launch.txt pricing surface still lists it.

The 2026-08-11 / 2026-08-12 / 2026-08-15 / 2026-08-16 / 2026-08-17 record
all bound the decision as **"Skip the Waiting Line $29.99 remains
DEFERRED to Nish's spend call"**. That phrasing is now technically
inaccurate: the free waiting line no longer exists. The 2026-08-20 record
is: **"Skip the Waiting Line $29.99 is the only paid launch path and
remains DEFERRED to Nish's spend call; 'Submit without scheduling' is a
free alternative that produces a saved product without a launch date."**

## Live re-verification (2026-08-20, plain HTTP — Uneed is curl-friendly)

All checks below are fresh live HTTP fetches from this lane run.

| Check | Result |
|---|---|
| `GET /api/v1/launch-dates` (public, follows `uneed.best` → `www.uneed.best` redirect) | HTTP 200. **`free_line_closed: true`**, `free_next_available: null` (free waiting line is **closed**, new since 2026-08-17). STWL dates bookable from **2026-08-28** (soonest, 8 days out — `Fri, Aug 28` label). |
| No duplicate (public search API `q=aiconverter`) | `mcp.uneed.best/v1/search?q=aiconverter` → no aiconverter.app result — same 5+ unrelated converters only (TailConverter, Heic Converter, File Converter — Iconscout, SVG Converter, Convert.ai, ...). |
| Duplicate slug probes | /tool/ai-converter, /tool/aiconverter, /tool/ai-converter-app — all 404. |
| Exact-category peers (all live, HTTP 200) | StatementSheet (/tool/statementsheet), Bank PDF Converter (/tool/bank-pdf-converter), BankConv (/tool/bankconv), PdfBuddy (/tool/pdfbuddy), BankScanPro (/tool/bankscanpro). |
| `/launch.txt` | Live, updated — official Agent Launch Guide now contains a new "## Important: the free waiting line is closed" section that explicitly says "The free queue reached a 6+ month wait and is closed to new products. `tier: 'free'` returns 400 `{ 'error': 'free_line_closed' }`, do not retry it." Also adds a "Submit without scheduling" launch option (free, no date) and Phase 2 step 4 codifies `tier: 'free'` → 400 → "do not retry. Offer the STWL option or stop after step 3." Strong positive evidence for the venue research desk to review uneed.best. |
| `/terms-of-use` | HTTP 200, unchanged — prohibits automated vote/ranking/comment manipulation, not product submission; no blanket robot/spider/crawl ban. |
| `/submit-a-tool` | HTTP 200 — "No account needed to start — we'll scrape your page first, then ask you to sign up to save it" (unchanged). Free/STWL pricing copy is JS-rendered behind the account gate; authoritative numbers come from the launch-dates API. |
| Kit reference pages (curl) | `/`, `/llms.txt`, `/bank-statement-pdf-to-csv/`, `/sample-csv/`, `/trust/`, `/formats/` all HTTP 200; `/pricing/` and `/receipt-to-csv/` 404 (unchanged; the kit claims none of those routes). |
| `venue-claim check uneed.best aiconverter-app` | exit 0, prints `policy disposition for uneed.best: unknown (not reviewed)` — pre-flight passes; the actual gate (`claim`) is still blocked by the empty allowlist. |
| `/home/nish/.local/bin/venue-claim` | Present and executable (42,409 bytes). Prior 2026-08-15 → 2026-08-17 reports said the binary was not installed in the lane environment — it is now in this lane image. The policy JSON is the authoritative guard and remains unchanged regardless. |

`uneed.best/...` issues a 302 → `www.uneed.best/...` redirect; raw status
without `-L` is 302. The live search endpoint lives on the mcp host
(`mcp.uneed.best/v1/search`), which is what the ops doc already
references. `www.uneed.best/api/v1/search?q=...` returns 404.

## Why this run only re-verifies (no ops doc edit)

`origin/main` already carries the complete Uneed record for this packet:
the 2026-08-11 kit + NEEDS_NISH_STEP decision, the 2026-08-12 NOT EXECUTED
attempt, the 2026-08-15 NOT EXECUTED attempt, the 2026-08-15 re-verify,
the 2026-08-16 NOT EXECUTED re-verify, the 2026-08-16 re-verify landing
in `ops/launch-venues.md` § Uneed, and the 2026-08-17 re-verify (PR #129,
squash c9a2f7a — verified on origin/main this run). Every fact this run
re-verified matches those records except **one material change**: the
free waiting line is now closed (a venue-side change since 2026-08-17,
not a fleet-side change). Adding that change to the shared
`ops/launch-venues.md` would touch a shared file with sibling lanes' open
PRs on it (34 fleet PRs are dead on exactly this) and is not strictly
required by the packet ("re-verify + record decision" is fully satisfied
by this per-branch report). Per the lane's own precedent (Capterra
2026-08-15: "No ops doc touched — avoiding a duplicate conflicting PR on
the shared file"; Microlaunch 2026-08-17: same pattern; Uneed 2026-08-15
and 2026-08-17: same pattern), this run lands only its unique
verification receipt and notes that the shared doc has the now-stale
"free option first (173 days out, ~6 months)" wording — a future lane
that owns the venue-doc edit should add a "2026-08-20" section noting
the free-line closure.

## Changes made

- `.lane/reports/lane1-uneed-listing-20260820.md`: this per-branch report
  (unique to this lane — no shared file touched).
- Claims published to lane record `lane-1.json` before edits (only the
  `claims` list; atomic temp file + rename).

## Next action (now stricter than before — free option is gone)

Nish signs up (email OTP) and either:

1. Pays $29.99 for Skip the Waiting Line (pick a date — soonest
   2026-08-28) and gets a permanent do-follow backlink + daily ranking +
   award eligibility, OR
2. Submits without scheduling (free; saves the product on Uneed with no
   launch date; can schedule later via Fast-track $14.99 or STWL $29.99
   from the UI).

Either way, account creation and spend stay with Nish. An agent could
only execute the flow after the venue research desk reviews uneed.best
(launch.txt is the venue's own official agent flow and its ToS has no
blanket crawl ban) and adds it to the policy allowlist. After the
listing: confirm `uneed.best/tool/{slug}` returns 200 and appears in
search `q=aiconverter`, then flip the venue status line to live.
