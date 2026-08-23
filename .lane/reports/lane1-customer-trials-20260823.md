# Customer trials (scout d21164ea26) — lane 1 re-verification, 2026-08-23

NOT EXECUTED — the five sessions remain Nish-held; kit, per-job grant mechanics, gate and live state re-verified this run.

## Re-verification evidence (this run, 2026-08-23)

### origin/main SHA at run start

```
$ git fetch origin && git rev-parse origin/main
5f6a26389646cbc71a0de22bbb244ce3cb7789a4
```

### Gate code anchors

`functions/api/download.js` lines 25–26:

```
$ sed -n '25,26p' functions/api/download.js
  const freeDownloads = env.FREE_DOWNLOADS_ENABLED === "true";
  if (!job.paid_at && !freeDownloads) {
```

`functions/api/batch-download.js` lines 53–54:

```
$ sed -n '53,54p' functions/api/batch-download.js
    const freeDownloads = env.FREE_DOWNLOADS_ENABLED === "true";
    if (!job.paid_at && !freeDownloads) {
```

### Gate tests

```
$ node --test tests/download-gate.test.mjs
✔ download: unpaid complete job is gated to 402 by default (34.39302ms)
✔ download: unpaid complete job downloads free when FREE_DOWNLOADS_ENABLED is true (3.420403ms)
✔ download: paid job downloads regardless of the free-downloads flag (2.458699ms)
✔ download: unknown or expired job is rejected even with the flag on (2.341074ms)
✔ batch download: unpaid job is skipped as payment required unless the flag is on (3.152262ms)
ℹ tests 5
ℹ suites 0
ℹ pass 5
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 138.867802
```

### Live health

```
$ curl -sS https://aiconverter.app/api/health
{"ok":true,"generatedAt":"2026-08-23T01:59:46.893Z","status":"ready","missing":[],"capabilities":{"storage":true,"database":"ready","dodo":{"apiConfigured":true,"webhookConfigured":true,"products":{"starter":true,"batch":true,"pro":true},"freeDownloads":false},"ai":{"workersAi":true,"markdownConversion":true,"whisper":true,"screenshotVision":true,"mistralOcr":true,"cloudConvert":true,"convertioBackup":true},"protection":{"uploadRateLimit":true,"turnstile":true}}}
```

`freeDownloads: false` confirmed.

### Ledger state

```
$ grep -cE '^\| [0-9]+ \|' ops/customer-trials.md
0
```

0/5 evidence rows in ops/customer-trials.md.

### Grant mechanics

Grant decision (dated 2026-08-11, unchanged): per-job `paid_at` grant for the five trial jobs, not the global flag. Option A — per-job grant (RECOMMENDED, Nish-held): after the trial job completes (status `complete`, preview reviewed), mark the job paid directly in D1 via `UPDATE jobs SET paid_at = '<trial date ISO>', payment_id = 'trial:<participant-id>' WHERE id = '<job id>' AND token_hash IS NOT NULL;`. This touches exactly five jobs, keeps `payment_id = 'trial:…'` distinguishable from real Dodo payments, and needs no deploy. The global `FREE_DOWNLOADS_ENABLED=true` flip makes every export free for everyone and requires a production deploy; it is not the chosen path.

## Why not executed from a lane

Recruiting real bookkeepers/SMB operators needs Nish's network and outreach accounts; an observed session needs a human observer with participant consent; the fleet has no participant pool, session presence, or consent mechanism (same blocker class as `ops/launch-venues.md`).

## Continuity

Prior runs: PR #58, PR #112 (2026-08-15 customer-trials attempt), PR #128, and direct commit `b12e5b6` (2026-08-21 re-verification, `.lane/reports/lane1-customer-trials-20260821.md`).

## Status and disposition

Item remains blocked on Nish-held sessions; ledger 0/5; item is NOT resolved so it is not retired; no PR opened this run; evidence persisted by pushing branch `lane1-customer-trials-20260823`.
