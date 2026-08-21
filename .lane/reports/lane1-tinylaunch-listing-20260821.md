# Lane 1 — TinyLaunch listing packet (2026-08-21)

Packet item: `84b2e7b871` — "List the product on TinyLaunch — 3 exact-
category competitors launched there in the last 30 days and AI Converter".

Lane: `aiconverter-app` lane 1.
Branch: `lane1/tinylaunch-listing-20260821`.
Worktree: `/home/nish/workspaces/agent-worktrees/aiconverter-app-lane1-20260821-061036`.

## Outcome (concise)

- **Verification half: SATISFIED.** Three exact-category competitors
  launched on TinyLaunch in the last 30 days are verified live
  2026-08-21 (Bank Statement Engine 2026-07-27, Statement Flow
  2026-07-27, Clearly Ledger 2026-08-03) — all under the
  bank-statement-PDF-to-spreadsheet exact category that AI
  Converter's primary workflow targets.
- **Submission half: NOT EXECUTED.** The lane does not drive the
  TinyLaunch `/api/v1/*` submission because `tinylaunch.com` is not
  in `agent-state/growth-loop/venue-policy.json`
  (`automation_disposition: unknown`, allowlist empty, ledger
  updated 2026-08-08 — well within the 90-day freshness window) AND
  the `/auth/request-code` step requires an email that the lane
  cannot supply. The free submission kit is copy-paste / curl-paste
  ready and the path-to-live is documented.

## Live evidence (re-verified 2026-08-21)

All HTTP 200 from the lane VPS (plain HTTPS GETs):

- https://www.tinylaunch.com/launch/16986-bank-statement-engine — Bank
  Statement Engine, launched 2026-07-27, "Free PDF bank statement
  converter. No signup needed. Bank Statement Engine is a free tool
  that converts PDF bank statements into Excel, CSV, JSON…" (exact-
  term match).
- https://www.tinylaunch.com/launch/16996-statement-flow — Statement
  Flow, launched 2026-07-27, "Convert any bank statement — even scans
  & photos. StatementFlow uses AI vision to convert PDF, scanned, or
  photographed bank statements into clean structured data."
- https://www.tinylaunch.com/launch/17071-clearly-ledger — Clearly
  Ledger, launched 2026-08-03, "Bank Statement Converter — Free PDF to
  Excel & CSV. Upload a PDF bank statement and get structured
  Excel/CSV."
- https://www.tinylaunch.com/launch-archive/2026/7/27 — archive page
  for Bank Statement Engine + Statement Flow.
- https://www.tinylaunch.com/launch-archive/2026/8/3 — archive page for
  Clearly Ledger.
- https://www.tinylaunch.com/.well-known/agents.json — `schema_version:
  v1`, `name: TinyLaunch`, `description: "Launch directory for indie
  startups. Agents can sign up users, manage maker profiles, register
  startups, and schedule launches over a JSON API."`,
  `legal_info_url: https://www.tinylaunch.com/tos`.
- https://www.tinylaunch.com/llms.txt — "TinyLaunch — Agent Guide",
  eight-endpoint narrative end-to-end flow.
- https://www.tinylaunch.com/openapi.json — full OpenAPI 3.0.3 schema;
  bearer-JWT auth; endpoints `/auth/request-code`, `/auth/verify`,
  `/me`, `/maker` (GET/POST/PATCH), `/startups` (GET/POST),
  `/startups/{id}` (GET/PATCH), `/launches` (POST).
- https://www.tinylaunch.com/api/v1/categories — Finance & FinTech is
  `id: 5`, Business & Finance group — closest live category for the
  bank-statement-to-CSV peer set.
- https://www.tinylaunch.com/api/v1/launch-dates — earliest free slot
  2026-09-21 (100 free slots, `bookable_free: true`); 2026-08-24 /
  2026-08-31 / 2026-09-07 / 2026-09-14 are full and `premium_only:
  true`.
- https://www.tinylaunch.com/pricing — free + paid options; specific
  premium prices not surfaced on the public page text.
- https://www.tinylaunch.com/tos — no blanket robot/spider/
  automated-access prohibition in the rendered page (only one mention
  of "Robot", which is the venue's own robot metadata, not a
  prohibition).

## No duplicate / missing listing

- Slug probes `/launch/aiconverter`, `/launch/ai-converter`,
  `/launch/aiconverter-app`, `/launch/ai-converter-app` all HTTP 404.
- Zero `aiconverter.app` mentions in any launch-archive weekly page
  for 2026-07-20, 2026-07-27, 2026-08-03, 2026-08-10, 2026-08-17.

## Why the submission is NOT EXECUTED

1. **Venue policy guard.** `tinylaunch.com` is not in
   `agent-state/growth-loop/venue-policy.json` — the executable
   allowlist is empty for this venue, so `venue-claim claim` would
   exit 4 and the agent must not drive the API. The policy JSON was
   last updated 2026-08-08 (well within the 90-day freshness window)
   and is the authoritative guard. The `venue-claim` binary is not
   installed in the lane environment
   (`/home/nish/.local/bin/venue-claim: No such file or directory`).
2. **Email-OTP / spend boundary.** Even with the policy cleared,
   `/auth/request-code` emails a 6-digit OTP to the user's email and
   `/auth/verify` requires pasting that code back. The lane cannot
   supply the email account. A premium launch adds a `payment_url`
   checkout — no authorization exists in
   `agent-state/authorizations/` (only the sol-xhigh worker grant —
   expired 2026-08-14 — and the dispatch ledger has no TinyLaunch
   entry).

The submission half is therefore blocked on (a) the venue research
desk reviewing `tinylaunch.com` against the strong positive evidence
(`/llms.txt`, `/openapi.json`, `/agents.json`, ToS without a blanket
robot/spider prohibition — the strongest case in `launch-venues.md`)
and updating the policy ledger to `automation_disposition: allowed`,
and (b) Nish providing an email and receiving the 6-digit OTP for
the `/auth/request-code` → `/auth/verify` flow.

## Free submission kit (copy-paste / curl-paste ready)

The full eight-endpoint agent flow (steps 1–6, no endpoint probing,
no value guessing) is reproduced verbatim in
`ops/launch-venues.md` under "Manual / agent submission kit
(copy-paste ready)". Summary:

- `POST /api/v1/auth/request-code` → email + 6-digit OTP returned via
  email.
- `POST /api/v1/auth/verify` → `{access_token, refresh_token,
  user_id, email}`. Token lasts ~1 hour.
- `GET /api/v1/maker` (Bearer) → existing maker profile or 404.
- `POST /api/v1/maker` (Bearer) → `{firstName, lastName?, handle,
  xHandle?}`.
- `POST /api/v1/startups` (Bearer) → `{name: "AI Converter", tagline:
  "Bank statement PDFs to CSV you can review before paying",
  description: <copy>, url: "https://aiconverter.app",
  category_id: 5, logo: <base64 PNG/JPG/JPEG/WEBP, ≤200 KB>}`.
- `POST /api/v1/launches` (Bearer) → `{startup_id, date: "2026-09-21",
  tier: "free"}` (or `tier: "premium"` with `payment_url`).

## Files touched

- `ops/launch-venues.md` — added the TinyLaunch decision, the
  manual / agent submission kit, and the lane-attempt sections
  (initial 2026-08-21 + re-attempt 2026-08-21).
- `.lane/reports/lane1-tinylaunch-listing-20260821.md` — this
  evidence file.

## Next actions (unchanged from prior attempt)

1. Venue research desk: review `tinylaunch.com` and update
   `agent-state/growth-loop/venue-policy.json` to
   `automation_disposition: allowed`.
2. Nish: provide an email for the agent API; decide on the launch
   tier (free = 2026-09-21 earliest, no money boundary; premium = any
   slot from 2026-08-24 with `payment_url` checkout, separate spend
   call); receive and paste the 6-digit OTP from
   `/auth/request-code` into `/auth/verify`.
3. After the listing lands, confirm the public
   `/launch/{id}-ai-converter` page resolves, then update
   `ops/launch-venues.md` with the public URL and flip the venue's
   status line to live.
