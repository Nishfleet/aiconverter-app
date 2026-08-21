# Lane 1 — Customer trials (scout item) re-verification run 2, 2026-08-15

Packet item: `- [ ] Run five observed intent-matched customer trials
(bookkeepers / SMB operators) with a free full export [scout 2026` (item
`d21164ea26`).

## Verdict: NOT EXECUTED (re-verified) — sessions remain Nish-held

The five observed trial sessions **were not run** from this lane, and cannot
be. The binding verdict from PR #58 / #112 (`ops/customer-trials.md`) still
holds: recruiting real bookkeepers / SMB operators requires Nish's human
network and outreach accounts, and an observed session requires a human
observer present with participant consent (screen share / interview). No lane
capability or fleet asset exists for either, and per fleet policy human
interactions and account actions stay with Nish — the same class of blocker as
every launch-venue submission recorded in `ops/launch-venues.md`.

This run's deliverable is a fresh re-verification: the kit, the per-job grant
mechanics, and the gate semantics are re-confirmed against live production and
repo code as of 2026-08-15, and the grant decision is re-recorded unchanged.
The trial ledger in `ops/customer-trials.md` still has **0/5 rows** — no
session has been run yet, so the scout item stays open.

## Live / repo re-verification 2026-08-15 (run 2)

- Live `/api/health` (curl, 2026-08-15T07:59Z):
  `dodo.freeDownloads: false` — free full export is **still NOT enabled** in
  production; the gate is real and would block a trial download today absent
  the per-job grant. Gate code unchanged:
  `functions/api/download.js:25-27` (`if (!job.paid_at && !freeDownloads) →
  402 Payment is required...`) and
  `functions/api/batch-download.js:53-56` (unpaid complete job →
  `skipped, payment required` unless the flag is on).
- `tests/download-gate.test.mjs`: 5/5 pass (unpaid → 402; unpaid + flag →
  200; paid → 200 regardless of flag; unknown job → 400 even with flag;
  batch-download skips unpaid unless flag on).
- Repo baseline: `npm run check:pricing` → "Pricing is consistent.";
  `node --test tests/*.test.mjs` → 196/196 pass.
- Trial ledger in `ops/customer-trials.md`: **0/5 rows filled** — no sessions
  run, no `trial:` grants recorded, no Option B window recorded.
- Working tree is at fresh `origin/main` (`08c8ddc`, 2026-08-15 12:24 +0530);
  prior run's PR #112 is merged.

## What exists (delivered PR #58, re-verified #112, re-verified again here)

- `ops/customer-trials.md` — the full trial kit: operational definition
  (intent-matched = real current files confirmed by screener; observed =
  watched session with consent; five separate participants, 2–3 bookkeepers +
  2–3 SMB operators), copy-paste recruitment messages (LinkedIn / WhatsApp /
  email), 3-question screener, per-session observation protocol, post-session
  questions, and the per-participant evidence ledger template.
- Grant decision (dated 2026-08-11, re-recorded unchanged 2026-08-15):
  **per-job `paid_at` grant** (`UPDATE jobs SET paid_at = '<trial date ISO>',
  payment_id = 'trial:<participant-id>' WHERE id = '<job id>' AND token_hash
  IS NOT NULL;`), NOT the global `FREE_DOWNLOADS_ENABLED=true` flag. The
  global flip makes every export free for everyone and needs a Pages deploy
  (still blocked from lanes — no Pages:Edit credential); the per-job grant
  touches exactly five jobs, leaves `payment_id = 'trial:…'` distinguishable
  in admin/refund drills, and needs no deploy.
- `tests/download-gate.test.mjs` — 5 tests locking the gate semantics.

## Why the five sessions still cannot be run from a lane

1. **Recruitment**: no participant pool, no outreach accounts, no network of
   bookkeepers / SMB operators. Nish has the professional network (and the
   product is his to pitch).
2. **Observation**: an observed trial is a live human session (screen share /
   watch + notes + consent). Fleet assets cannot be present in a human
   session; no consent mechanism exists.
3. Per fleet policy, human interactions and account actions stay with Nish —
   same class of blocker as the launch-venue submissions.

## Remaining step to close the item (Nish-held, unchanged)

Run five sessions with the kit in `ops/customer-trials.md` (recruit → screen →
observe → grant per-job export → record ledger rows). After each session,
grant the export with the doc's SQL. When 5/5 rows are recorded in the ledger
table in `ops/customer-trials.md`, flip the scout item closed. If the global
flag is ever used instead, record its exact on/off window in the doc.

## Files touched this run

- `.lane/reports/lane1-customer-trials-20260815-r2.md` — this honest
  NOT-EXECUTED re-verified lane record (unique to this lane/branch).
- (No product code changed; the kit and tests already exist from PR #58, and
  the ledger stays Nish-owned.)
