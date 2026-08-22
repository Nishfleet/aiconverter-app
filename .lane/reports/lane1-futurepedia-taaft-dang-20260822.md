# Lane 1 evidence — Futurepedia / TAAFT / Dang.ai live re-check 2026-08-22

Item `7967b43c89`. Worktree `/home/nish/workspaces/agent-worktrees/aiconverter-app-lane1-20260822-182033`. Branch `lane1/futurepedia-taaft-dang-20260822`.

Plain `curl` from this VPS. Scratch in `/tmp/opencode/`. No browser, no `venue-claim`, no accounts, no purchases. TAAFT `/launch/` fetched once.

## Live checks

### 1. FP-SUBMIT — https://www.futurepedia.io/submit-tool

- HTTP 200 (98152 bytes)
- FAQ contains verbatim: `We are no longer offering free submissions. It's very important to us to maintain the quality of our directory and it became unmanageable to do so.`
- Page also contains `$247` (2), `$497` (2), `Sold Out` (2). Price-only movement is not a fact change.

### 2. FP-TOOL — https://www.futurepedia.io/tool/aiconverter

- HTTP 404 (no listing). Matches baseline.

### 3. TAFT-LAUNCH — https://theresanaiforthat.com/launch/ (exactly one fetch)

- HTTP 200 (950119 bytes). Baseline 2026-08-17 from this VPS was 403; 200 is allowed when paid cards and the X-thread free answer are intact.
- Paid cards present: `$49` (2), `$347` (2).
- FAQ `Is there any way to submit my tool for free?` answered: `We run a thread on X once a month where indie makers can submit their tool for free. We choose one tool from each thread and list it for free.`
- Paid-only + monthly-X-thread-lottery state unchanged. No further TAAFT URLs fetched (ToS §8-A).

### 4. DANG-LOGIN — https://dang.ai/login?next=%2Fpricing

- HTTP 200 (24788 bytes)
- Contains `Sign in to Dang.ai`. Login wall present.

### 5. DANG-PRICING — https://dang.ai/pricing

- `307 https://dang.ai/login?next=%2Fpricing` — gated.

### 6. DANG-SITEMAP — https://dang.ai/sitemap.xml

- HTTP 200
- `grep -icE 'aiconverter|ai-converter|AI Converter'` → `0`

### 7. POLICY

- `/home/nish/workspaces/agent-state/growth-loop/venue-policy.json`
- `"allowlist": {}`
- No entries for `futurepedia.io`, `theresanaiforthat.com`, `dang.ai`
- All three remain `automation_disposition: unknown`. Unchanged.

### 8. PRODUCT REFERENCE PAGES — https://aiconverter.app

| URL | HTTP | Baseline | Live |
| --- | ---: | --- | --- |
| `/` | 200 | 200 | match |
| `/llms.txt` | 200 | 200 | match |
| `/bank-statement-pdf-to-csv/` | 200 | 200 | match |
| `/sample-csv/` | 200 | 200 | match |
| `/trust/` | 200 | 200 | match |
| `/formats/` | 200 | 200 | match |
| `/pricing/` | 200 | 404 | **DRIFT** — title `Pricing - AI Converter one-time page packs` |
| `/receipt-to-csv/` | 200 | 404 | **DRIFT** — title `Receipt to Expense CSV - AI Converter` |

## Classification

Venue facts held. Product reference pages drifted (`/pricing/` and `/receipt-to-csv/` are HTTP 200, not 404).

Classification: **CHANGED-FACTS** (kit-route drift only). FORK path.

Submit arm: UNREACHABLE (no public no-login form; policy `allowlist: {}`). No POST attempted.

Related open docs-only PR #136 left untouched.

## Outcome

- Branch: `lane1/futurepedia-taaft-dang-20260822`
- Files: `ops/launch-venues.md`, `.lane/reports/lane1-futurepedia-taaft-dang-20260822.md`
- PR URL: (filled after `gh pr create`)
