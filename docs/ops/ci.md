# CI on this repo

What runs on every pull request, and which checks the merge actually needs.

## Required checks

The branch ruleset `main-required-checks` (ruleset id 23981683, active) is the
only enforced gate on `main`. It requires exactly these contexts and nothing
else:

- Build
- Gitleaks
- Pricing check
- Unit tests
- actionlint
- semgrep

No ruleset context references `grade / grade`, and classic branch protection is
not in use.

## Workflow inventory (`.github/workflows/`)

- `ci.yml` — PR gates: actionlint, gitleaks, semgrep, unit tests, build.
- `deploy.yml` — push to `main` builds and deploys to Cloudflare Pages.
- `lighthouse.yml` — scheduled Lighthouse audits.
- `secret-scan.yml` — gitleaks scan. Its `gitleaks` job (`name: Gitleaks`) is
  what reports the required `Gitleaks` context.
- `agent-dispatch.yml` — starts a fleet worker run for a labeled issue.

## Removed: `grade.yml` (deleted 2026-10-12)

`grade.yml` called the fleet-ops quality grader
(`Nishfleet/fleet-ops/.github/workflows/grade.yml@main`), which was deleted
upstream in fleet-ops#8953. From that moment every grade run in this repo
failed at parse time on every pull request and merge queue entry —
`gh run list -R Nishfleet/aiconverter-app --workflow grade.yml --limit 5`
returns five `failure` results on 2026-10-12 (runs 38276785159, 38267054161,
38255662973, 38248658443, 38248390031), all on unrelated branches. The caller
could never pass again, so it was removed. Grading now happens in the fleet's
merge-guard review pipeline, not in this repo's Actions (PR #252 itself was
reviewed by that pipeline on 2026-10-12).

The deleted caller also passed `CLAUDE_CODE_OAUTH_TOKEN` and `CURSOR_API_KEY`
to an external workflow pinned to `@main`. No workflow in `.github/` consumes
either secret since the deletion, so both repo secrets are unused. Cleanup is
tracked in #253. If a grader is ever re-added, pin the upstream workflow to a
commit SHA.
