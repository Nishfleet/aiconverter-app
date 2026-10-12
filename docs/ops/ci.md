# CI on this repo

What runs on every pull request, and which checks the merge actually needs.

## Required checks (merge gate)

This repo enforces branch requirements with rulesets. All rulesets, live:

```
$ gh api repos/Nishfleet/aiconverter-app/rulesets --jq '.[] | "\(.id)\t\(.name)\t\(.enforcement)\t\(.target)"'
23981683	main-required-checks	active	branch
```

There is exactly one ruleset. It targets branch refs and applies to the default
branch:

```
$ gh api repos/Nishfleet/aiconverter-app/rulesets/23981683 --jq '{name, enforcement, includes, conditions, contexts: [.rules[] | select(.type=="required_status_checks") | .parameters.required_status_checks[].context]}'
{"name":"main-required-checks","enforcement":"active","includes":null,"conditions":{"ref_name":{"exclude":[],"include":["~DEFAULT_BRANCH"]}},"contexts":["Build","Gitleaks","Pricing check","Unit tests","actionlint","semgrep"]}
```

Classic branch protection runs no checks at all:

```
$ gh api repos/Nishfleet/aiconverter-app/branches/main --jq '.protection'
{"enabled":false,"required_status_checks":{"checks":[],"contexts":[],"enforcement_level":"off"}}
```

So the required contexts are `Build`, `Gitleaks`, `Pricing check`, `Unit tests`,
`actionlint` and `semgrep`. `grade / grade` is in neither the ruleset nor
classic protection.

The removed `grade.yml` declared in its own comment that `Ruleset context is the
name GitHub reports: grade / grade`, but no ruleset or branch protection in this
repo ever required that context, so deleting the workflow cannot leave a
required check without a reporter.

## Workflow inventory (`.github/workflows/`)

```
$ ls .github/workflows/
agent-dispatch.yml
ci.yml
deploy.yml
lighthouse.yml
secret-scan.yml
```

- `ci.yml` — PR gates: actionlint, gitleaks, semgrep, unit tests, build.
- `deploy.yml` — push to `main` builds and deploys to Cloudflare Pages.
- `lighthouse.yml` — scheduled Lighthouse audits.
- `secret-scan.yml` — `gitleaks` job, which owns the required `Gitleaks` context.
- `agent-dispatch.yml` — starts a fleet worker run for a labeled issue.

## Removed: `grade.yml` (deleted 2026-10-12)

`grade.yml` was the only caller of the fleet-ops quality grader
(`Nishfleet/fleet-ops/.github/workflows/grade.yml@main`), which was deleted
upstream in fleet-ops#8953. The upstream workflow no longer exists:

```
$ gh api repos/Nishfleet/fleet-ops/contents/.github/workflows/grade.yml
{"message":"Not Found","documentation_url":"https://docs.github.com/rest/repos/contents","status":"404"}
```

Every grade run in this repo has failed since (summary of
`gh run list -R Nishfleet/aiconverter-app --workflow grade.yml --limit 5`:
five rows, all `conclusion=failure`, newest run `38276785159` on
`2026-10-12T16:21Z`, on branches unrelated to this change). The caller did not
grade anything; it failed at parse time on every `pull_request` and
`merge_group` event. Removing it ends that parse failure and drops no gate.

No reference to the deleted caller remains in the repo (summary of
`grep -rn grade .github/ docs/`, excluding this file: no matches). Other
workflows still call fleet-ops reusable workflows on purpose
(`agent-dispatch.yml`, `lighthouse.yml`); those upstream workflows exist and
are unchanged.

The deleted caller passed `CLAUDE_CODE_OAUTH_TOKEN` and `CURSOR_API_KEY` to the
upstream workflow, pinned to mutable `@main`. No consumer remains (summary of
`grep -rn "CLAUDE_CODE_OAUTH_TOKEN\|CURSOR_API_KEY" .github/`: no matches).
Both repo secrets are orphaned; their removal needs repo Administration, so it
is tracked in #253 rather than done here.

After this deletion the six required contexts above are the enforced gate, and
this repo runs no separate quality grader in Actions. If a grader is re-added,
pin the upstream workflow to a commit SHA.
