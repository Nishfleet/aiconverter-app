# Lane report — stale unmatched Dodo payment event (item 5fd1b106f5)

Date: 2026-08-20 · Lane: aiconverter-app lane 1 · Worktree: aiconverter-app-lane1-20260820-192532

## Verdict

**The code half of this item remains complete and merged (PR #47, commit `405e3b2`, in origin/main). The live monitor warning is still red because production still runs pre-fix code, and deploy remains impossible from this VPS today: the only Cloudflare credential on this host (fleet `cf.env`) still lacks Pages:Edit and D1 scopes (re-verified live 2026-08-20).**

No code or D1 change was made by this lane: the merged zero-amount sandbox filter already removes the stale event from the actionable unmatched-payment alert once production runs the fix, so a deploy alone turns the warning green. Deleting the row from D1 would be a live production data change with no effect while production runs pre-fix code (the alert is computed by deployed code), and the repo deliberately has no admin surface for it.

## Live evidence (2026-08-20, fresh)

1. `AICONVERTER_MONITOR_STRICT=true node scripts/monitor-live.mjs` against https://aiconverter.app with the private admin token (`.monitor.env` sourced from the lane-1 worktree, gitignored):
   - health: `ok`, status `ready`
   - failures: `[]`
   - warnings: `[admin-alerts → warning "Unmatched Dodo payments: 1 payment event did not match cleanly."]` — warning still red (monitor exit 1).
2. Live admin overview `unmatchedPayments` returns exactly one row (evidence file `.lane/evidence/lane1-stale-unmatched-20260820-overview.json`):
   - `pay_0NjXVYhB1zUB8cvHx15cO` / `cks_0NjXV87kao4KZT53vWL41`, `payment.succeeded`, `job_not_found`, `job_id ""`, `created_at 2026-07-19T18:23:05.601Z` — the same zero-amount Dodo sandbox event that has alerted since 2026-07-19.
   - The row still lacks the `amount` column that merged fix `405e3b2` adds to the unmatched-payments SQL — direct proof production functions are still pre-fix.
3. `git merge-base --is-ancestor 405e3b2 origin/main` → yes (PR #47 merged).
4. Deploy still impossible from this VPS:
   - `wrangler` not installed on this host (checked `which wrangler`).
   - Fleet `CLOUDFLARE_API_TOKEN` (`/home/nish/.config/fleet-console/cf.env`) is valid (`/user/tokens/verify` → 200 active) but `GET /accounts/<id>/pages/projects` → 10000 Authentication error (403) — no Pages permission; D1 database endpoint likewise 401 (no D1 scope).
   - No deploy workflow exists in the repo: `origin/main .github/workflows/` contains only `ci.yml`, `review-gate.yml`, `secret-scan.yml`.
   - No other Cloudflare credential found on this host (searched `~/.config`, `~/.wrangler`, `~/.config/.wrangler`).

## What would close the item (Nish-held, one step)

```bash
# from a clean origin/main checkout, with a Pages:Edit credential
SAFE_DEPLOY_APPROVED='pages deploy dist --project-name aiconverter --branch main' \
  wrangler pages deploy dist --project-name aiconverter --branch main
```

After deploy, the monitor warning goes green automatically (merged filter `405e3b2` excludes the zero-amount sandbox event; no D1 DELETE/UPDATE needed).

## What this lane changed

- `.lane/evidence/lane1-stale-unmatched-20260820-overview.json` — fresh live overview evidence captured 2026-08-20 (per-packet path; no shared report file touched).
- `.lane/reports/lane1-stale-unmatched-dodo-event-20260820.md` — this lane report (per-packet path; no shared report file touched).
- No production code, no D1 data, no secrets.
