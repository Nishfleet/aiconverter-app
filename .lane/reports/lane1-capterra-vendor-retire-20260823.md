# Item 83c4f2d087 — Capterra vendor profile / decline retire (2026-08-23)

item 83c4f2d087 already resolved on main by PR #113; retired, no PR opened.

## Prior art

- PR #113 / commit `f0db7d2` (decline + truthful kit, merged 2026-08-15) in the `## Capterra` section of `ops/launch-venues.md`.
- PR #147 / commit `1d62a8e` (live guard receipt, 2026-08-21).
- Prior retirement already stamped `2026-08-23T04:49:26Z` with `pr=147` in `/home/nish/workspaces/products/aiconverter-app/.fleet/improvement-loop.json`. This dispatch is a duplicate of that already-resolved item; retirement is an idempotent refresh.

## P1 live re-verification (2026-08-23)

| Command | Literal output |
|---|---|
| `python3` policy JSON dump (`updated` / `allowlist` / capterra reviewed entry) | `updated: 2026-08-08` / `allowlist: {}` / `capterra: {"venue_url": "https://www.capterra.com", "automation_disposition": "unknown", "notes": "Named in seo-fix-kit listing research (2026-08-08) as a discovery venue; no current official policy evidence collected yet. NOT automation-allowed until current official evidence exists."}` |
| `venue-claim claim capterra.com aiconverter-app` (bare, sandboxed env overrides) | `usage: venue-claim claim [-h] --account ACCOUNT ...` / `venue-claim claim: error: the following arguments are required: --account, --policy-date, --policy-url, --evidence-path, --removal-route, --verification-state` / `claim_exit=2` |
| `venue-claim claim capterra.com aiconverter-app` + required dummy flags (sandboxed: `VENUE_POLICY_PATH` copy of production policy; throwaway ledger/lock/markdown under `/tmp/opencode/vc-Hk2DXa`) | `ERROR: ALLOWLIST/POLICY BLOCK: venue capterra.com is reviewed as unknown - not automation-allowed; route to NEEDS-NISH/manual, never bypass.` / `claim_exit=4` |
| `venue-claim check capterra.com aiconverter-app` (production paths, no sandbox) | `policy disposition for capterra.com: reviewed (unknown)` / `check_exit=0` |
| `curl -s -o /dev/null -m 20 -w '%{http_code}\n' -A 'Mozilla/5.0' https://www.capterra.com/` | `403` |
| `curl -s -o /dev/null -m 20 -w '%{http_code}\n' -A 'Mozilla/5.0' https://www.capterra.com/p/10048907/Bank-Statement-Converter/` | `403` |
| `curl -s -o /dev/null -m 25 -w '%{http_code} %{redirect_url}\n' https://digitalmarkets.gartner.com/get-listed/start` | `301 https://app.g2digitalmarkets.com/get-listed/start` |
| CDX HTTP `url=capterra.com/p/*&filter=urlkey:.*aiconverter.*&limit=5` | empty body (0 capture rows) |
| CDX HTTP `url=capterra.com/p/*&filter=urlkey:.*ai-converter.*&limit=5` | empty body (0 capture rows) |
| CDX HTTP control `url=capterra.com/p/*&limit=3&fl=original,statuscode` | empty body after ~30s timeout (0 bytes) |
| CDX HTTPS retry `filter=urlkey:.*aiconverter.*` | `curl: (28) Operation timed out after 30002 milliseconds with 0 bytes received` / `aiconverter_exit=28` |
| CDX HTTPS retry `filter=urlkey:.*ai-converter.*` | `curl: (28) Operation timed out after 30003 milliseconds with 0 bytes received` / `ai_converter_exit=28` |
| CDX HTTPS retry control `limit=3&fl=original,statuscode` | `http://www.capterra.com:80/p 404` / `http://www.capterra.com:80/p 301` / `http://www.capterra.com:80/p 301` / `control_exit=0` |

Sandbox ledger after claim remained `{"version":1,"records":{}}`. Production `venues.json` still has zero capterra keys.

## Trigger evaluation (P2)

- T1: no. Allowlist is empty `{}`; capterra `automation_disposition` is `unknown`.
- T2: no. Peer-profile status is `403`, not 2xx.
- T3: no. Neither absence query returned ≥1 capture row. HTTP absences were empty; HTTPS absences timed out with 0 bytes (`CDX inconclusive` for those two). Control HTTPS returned 3 rows, so the archive itself is reachable. Reopening requires positive duplicate evidence; an empty or unreachable absence query is a non-trigger.

Path (a): no material change. `ops/launch-venues.md` was not edited. Shared `.lane/report.md` was left untouched. No browser touched capterra.com or g2.com.

## Close-out

`fleet-resolve-item resolve` is run after this file lands on the branch. No pull request is opened for this docs-only retire path.
