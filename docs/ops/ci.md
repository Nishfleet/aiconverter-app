# CI on this repo

What runs on every pull request, and which checks the merge actually needs.

## Required checks (merge gate)

This repo enforces branch requirements via rulesets, not classic branch
protection. The only ruleset is `main-required-checks` (id `23981683`,
`active`). Its required contexts, live at the time of this deletion:

```
$ gh api repos/Nishfleet/aiconverter-app/rulesets/23981683 \
  --jq '[.rules[] | select(.type=="required_status_checks") | .parameters.required_status_checks[].context]'
["Build","Gitleaks","Pricing check","Unit tests","actionlint","semgrep"]
```

`grade / grade` is in neither. The removed `grade.yml` declared in its own
comment that `Ruleset context is the name GitHub reports: grade / grade`, but
no ruleset in this repo ever required that context, so deleting the workflow
cannot stall a merge: there was no `grade / grade` context to stop reporting.

Classic branch protection status: the worker token used here has no
Administration scope, so `GET /repos/Nishfleet/aiconverter-app/branches/main/protection`
returns `403 Resource not accessible by integration`. An Admin token can
re-check it directly; the active ruleset above is the enforced gate.

## Workflow inventory (`.github/workflows/`)

- `ci.yml` — PR gates: actionlint, gitleaks, semgrep, unit tests, build.
- `deploy.yml` — push to `main` builds and deploys to Cloudflare Pages.
- `lighthouse.yml` — scheduled Lighthouse audits.
- `secret-scan.yml` — `gitleaks` job, which owns the required `Gitleaks` context.
- `agent-dispatch.yml` — starts a fleet worker run for a labeled issue.

## Removed: `grade.yml` (deleted 2026-10-12)

`grade.yml` was the only caller of the fleet-ops quality grader
(`Nishfleet/fleet-ops/.github/workflows/grade.yml@main`), which was deleted
upstream in fleet-ops#8953. The caller could then never pass: the upstream
workflow no longer exists:

```
$ gh api repos/Nishfleet/fleet-ops/contents/.github/workflows/grade.yml
{"message":"Not Found","status":"404"}
```

and every grade run in this repo has failed since:

```
$ gh run list -R Nishfleet/aiconverter-app --workflow grade.yml --limit 5
  # 5/5 conclusion=failure, all on branches unrelated to this change
```

The most recent sample (all `failure`): 38276785159, 38267054161, 38255662973,
38248658443, 38248390031. The caller did not grade anything; it only failed at
parse time on every `pull_request` and `merge_group` event, so removing it
eliminates a parse failure and drops no gate. Quality review of this repo now
runs through the merge-guard review path that the repo already uses for all
risky changes.

The deleted caller also passed `CLAUDE_CODE_OAUTH_TOKEN` and `CURSOR_API_KEY`
to the upstream workflow, pinned to mutable `@main`. A grep at the deletion
head shows no remaining consumer:

```
$ grep -rn "CLAUDE_CODE_OAUTH_TOKEN\|CURSOR_API_KEY" .github/
  # (no matches)
```

Both secrets are orphaned; removing them is tracked in #253 (needs repo
Administration, so filed for follow-up rather than done in this PR). If a grader
is re-added, pin the upstream workflow to a commit SHA.
