# Lane 1 report — Open-Launch Premium Launch listing (2026-08-17, run 2)

Packet item 89c1ec650e: "List the product on Open-Launch via Premium Launch
($12; free slots booked into 2027) — exact-category peers Bank".

## Outcome: NOT EXECUTED — DECISION RE-RECORDED (listing not submitted; Premium Launch $12 still DEFERRED to Nish)

The listing was **not submitted** and the $12 was **not paid**. The
2026-08-11 Open-Launch decision still binds (PAID listing at $12
recommended for evaluation; declined for agent-executed submission; the $12
spend, the account creation, and the form submission are Nish's human
actions). Two independent gates block the agent, both unchanged since the
2026-08-17 earlier re-run (commit d1780e8):

1. **Fleet venue policy gate (machine-enforced, unchanged).**
   `agent-state/growth-loop/venue-policy.json` (updated 2026-08-08, mtime
   unchanged) still has no open-launch.com entry — `automation_disposition:
   unknown`, and the executable allowlist is still empty. Per the
   `venue-claim` contract, `venue-claim claim open-launch.com aiconverter-app`
   exits 4 (allowlist/policy block) and "A blocked exit means NO browser
   work" — an agent must not drive the submission. The `venue-claim` binary
   is still not installed in this lane environment
   (`/home/nish/.local/bin/venue-claim: No such file or directory`), but the
   policy JSON is the authoritative guard and is unchanged.
2. **Account and payment gates (human account actions, unchanged).**
   `/projects/submit` still 307-redirects to
   `/sign-in?redirect=/projects/submit` (Google / GitHub / email sign-in),
   and the only current launch route is the paid **Premium Launch $12** (free
   slots booked into 2027). Account creation and payment stay with Nish.

## Paid decision (the packet's record requirement)

**Premium Launch $12 remains DEFERRED to Nish's spend call.** No spend
authorization exists in `agent-state` (authorizations/ holds only the
sol-xhigh worker grant — expired 2026-08-14 — and the dispatch ledger has no
Open-Launch entry). The venue policy ledger would also need to be updated
before any agent-executed submission, and the sign-in/payment flow is a
human account action either way.

## Live re-verification (2026-08-17 r2, plain HTTP — open-launch.com is curl-friendly)

| Check | Result |
|---|---|
| No duplicate (`GET /api/search?q=aiconverter`) | `{"results":[]}` — zero results; r2 unchanged from the earlier 2026-08-17 run. |
| Duplicate slug probes | /projects/aiconverter, /projects/ai-converter, /projects/aiconverter-app, /projects/ai-converter-app — all 404. |
| Exact-category peers (3 spot-checked, all HTTP 200) | /projects/ai-bank-statement, /projects/bank-statement-converter-ai, /projects/bank-statement-engine. |
| `/pricing` (HTTP 200) | **Premium Launch $ 12** — "Premium spot + ...", "Guaranteed dofollow backlink from a DR 71 domain", "Featured on homepage"; **Free Launch Fully booked $0** (line-through) — "Free launches are fully booked into 2027"; **SEO Growth Package $59** (was $199). |
| `/projects/submit` | **307** → `/sign-in?redirect=/projects/submit` (account-gated; unchanged). robots.txt still disallows /api/, /projects/submit, /payment/, /sign-in, /sign-up, /forgot-password, /reset-password, /verify-email, /dashboard, /settings, /admin, /_next/. |
| `/legal/terms` (HTTP 200) | **"Last updated: August 17, 2026"** (re-revised today; prior record showed August 14); section 2 Acceptable Use still lists five items (illegal content, misrepresentation, interference, unpermitted data collection, unauthorized commercial use) — **no robot/spider/automated-access prohibition** found in the rendered page; payments final and non-refundable (unchanged). |
| Kit reference pages (aiconverter.app) | `/`, `/llms.txt`, `/bank-statement-pdf-to-csv/`, `/sample-csv/`, `/trust/`, `/formats/` — all HTTP 200; `/pricing/` and `/receipt-to-csv/` still 404 (the kit claims none of those routes). |

## Changes made

- `ops/launch-venues.md`: added "Fleet lane attempt 2026-08-17 r2 (Open-Launch
  — NOT EXECUTED, re-verified)" subsection under the Open-Launch section,
  recording the 2026-08-17 terms revision (last updated today) and
  reconfirming the unchanged gates; the Open-Launch SKIPPED_PAID status
  bullet in the submission-outcomes ledger already covers this attempt
  (the bullet lists 2026-08-15, 16, 17 attempts).
- `.lane/reports/lane1-open-launch-listing-20260817-r2.md`: this per-branch
  report.

## Next action (unchanged, human-owned)

Nish signs in (Google / GitHub / email), pays $12, and submits a Premium
Launch using the kit in `ops/launch-venues.md` (§ Open-Launch), then the
file should be updated with the public product URL
(open-launch.com/projects/{slug}). An agent could only execute the flow
after the venue research desk reviews open-launch.com (its ToS has no
automated-access prohibition — re-confirmed today with the 2026-08-17
revision) and adds it to the policy allowlist.
