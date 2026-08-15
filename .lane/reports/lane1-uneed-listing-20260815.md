# Lane 1 report — Uneed free waiting-line submit (2026-08-15, re-verify run)

Packet item 12a5d614ce: "List the product on Uneed via free waiting-line
submit (record paid skip-the-line decision) — exact-category peers".

## Outcome: NOT EXECUTED — DECISION RE-VERIFIED LIVE (free listing still not submitted; STWL $29.99 still DEFERRED to Nish)

The listing was **not submitted** — the fifth lane run to reach this
conclusion (2026-08-11 kit + NEEDS_NISH_STEP, 2026-08-12 NOT EXECUTED,
2026-08-15 NOT EXECUTED, 2026-08-16 NOT EXECUTED, and this 2026-08-15
re-verify). Both independent blockers are unchanged and were re-verified
live this run:

1. **Fleet venue policy gate (machine-enforced, unchanged).**
   `agent-state/growth-loop/venue-policy.json` (updated 2026-08-08,
   re-read live this run) still has **no uneed.best entry** —
   `automation_disposition: unknown`, and the executable allowlist is still
   empty. Per the `venue-claim` contract, `venue-claim claim uneed.best
   aiconverter-app` exits 4 (allowlist/policy block) and "A blocked exit
   means NO browser work" — an agent must not drive the submission. The
   `venue-claim` binary is still not installed in this lane environment
   (`/home/nish/.local/bin/venue-claim: No such file or directory`), but
   the policy JSON is the authoritative guard and is unchanged.
2. **Email-OTP account gate (human account action, unchanged).**
   The free flow still requires email-OTP sign-up (launch.txt, live this
   run: `POST /api/v1/auth/request-code` → user pastes the code → `POST
   /api/v1/auth/verify`). launch.txt is explicit: "Never guess, prefill, or
   reuse an email from context — ask, wait, accept what they type." No
   fleet inbox exists in this environment (the only email tooling is
   send-only `notify-email`), so the agent cannot receive or paste the
   OTP; account creation stays with Nish per the 2026-08-11 decision
   ("Nish signs up (email OTP)").

## Paid skip-the-line decision (the packet's record requirement)

**Skip the Waiting Line $29.99 remains DEFERRED to Nish's spend call.**
Re-verified live this run: `agent-state/authorizations/` holds only the
sol-xhigh worker grant (expired 2026-08-14), and the dispatch ledger has no
Uneed entry — no spend authorization exists. The free tier costs nothing —
the blocker is the account gate, not money — but STWL dates remain bookable
(soonest **2026-08-15**, live this run) and the launch guide text is
unchanged.

## Live re-verification (2026-08-15, plain HTTP — Uneed is curl-friendly, unlike Toolify)

All checks below are fresh live HTTP fetches from this lane run.

| Check | Result |
|---|---|
| `GET /api/v1/launch-dates` (public) | HTTP 200. `free_next_available: 2027-02-12` (**181 days out**, ~6 months). STWL dates bookable from **2026-08-15** (soonest). |
| No duplicate (public search API `q=aiconverter`) | `mcp.uneed.best/v1/search?q=aiconverter` → no aiconverter.app result — unrelated converters only (TailConverter, Heic Converter, ...). |
| Duplicate slug probes | /tool/ai-converter, /tool/aiconverter, /tool/ai-converter-app — all 404. |
| Exact-category peers (all live, HTTP 200) | StatementSheet (/tool/statementsheet), Bank PDF Converter (/tool/bank-pdf-converter), BankConv (/tool/bankconv), PdfBuddy (/tool/pdfbuddy), BankScanPro (/tool/bankscanpro). |
| `/launch.txt` | Live, unchanged — official Agent Launch Guide (email OTP → bearer → `POST /api/v1/products` → `POST /api/v1/launches`, tier `free`/`stwl`; free accounts keep ONE product in the waiting line; "Don't default the tier to Free. Always [choose] — the queue is ~5 months"). Positive evidence for the venue research desk; guard stays exit-4 until the policy ledger is updated. |
| `/terms-of-use` | HTTP 200, unchanged — prohibits automated vote/ranking/comment manipulation, not product submission; no blanket robot/spider/crawl ban. |
| `/submit-a-tool` | HTTP 200 — "No account needed to start — we'll scrape your page first, then ask you to sign up to save it" (unchanged). Free/STWL pricing copy is JS-rendered behind the account gate; authoritative numbers come from the launch-dates API. |
| Kit reference pages (curl) | `/`, `/llms.txt`, `/bank-statement-pdf-to-csv/`, `/sample-csv/`, `/trust/`, `/formats/` all HTTP 200; `/pricing/` and `/receipt-to-csv/` still 404 (unchanged; kit claims none of those routes). |

Note: `www.uneed.best/api/v1/search?q=...` returns 404 — the live search
endpoint lives on the mcp host (`mcp.uneed.best/v1/search`), which is what
the ops doc already references.

## Why this run only re-verifies (no ops doc edit)

`origin/main` already carries the complete Uneed record for this packet:
the 2026-08-11 kit + NEEDS_NISH_STEP decision, the 2026-08-12 NOT EXECUTED
attempt, the 2026-08-15 NOT EXECUTED attempt, and the 2026-08-16 NOT
EXECUTED re-verify (PR #109, squash 7939823 — verified on origin/main this
run) in `ops/launch-venues.md` § Uneed. Every fact this run re-verified
matches those records exactly. Adding a fifth dated section to the shared
`ops/launch-venues.md` would conflict with sibling lanes' open PRs on that
file (34 fleet PRs are dead on exactly this) for zero new information, so
per the lane's own precedent (Capterra 2026-08-15: "No ops doc touched —
avoiding a duplicate conflicting PR on the shared file") this run lands
only its unique verification receipt.

## Changes made

- `.lane/reports/lane1-uneed-listing-20260815.md`: this per-branch report
  (unique to this lane — no shared file touched).
- Claims published to lane record `lane-1.json` before edits (only the
  `claims` list; atomic temp file + rename).

## Next action (unchanged, human-owned)

Nish signs up (email OTP) and submits the free "Join the line" launch using
the kit in `ops/launch-venues.md` (§ Uneed) — or picks a Skip-the-Line date
at $29.99 on his spend call. An agent could only execute the flow after the
venue research desk reviews uneed.best (its launch.txt is the venue's own
official agent flow and its ToS has no blanket crawl ban) and adds it to the
policy allowlist. After the listing: confirm `uneed.best/tool/{slug}`
returns 200 and appears in search `q=aiconverter`, then flip the venue
status line to live.
