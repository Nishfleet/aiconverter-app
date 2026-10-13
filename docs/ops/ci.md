# CI on this repo

What runs on every pull request, and which checks the merge actually needs.

Every command block below is literal output captured on **2026-10-13** by a
repository administrator (token scopes `repo` + `workflow`, not the worker
App's token, so the reads below are not permission-limited). The live values
will go stale; re-run the commands rather than trusting this file. What does
not go stale is the part checkable from this repo's own tree: the
context-to-reporter table and the workflow inventory below name files and job
ids that are in the repository.

## Required checks (merge gate)

This repo enforces branch requirements with rulesets. Every ruleset in the
repository:

```
$ gh api repos/Nishfleet/aiconverter-app/rulesets --jq '.[] | "\(.id)\t\(.name)\t\(.enforcement)\t\(.target)"'
23981683	main-required-checks	active	branch
```

There is exactly one, `23981683`. Its complete rule list is three types:

```
$ gh api repos/Nishfleet/aiconverter-app/rulesets/23981683 --jq '.rules[].type'
non_fast_forward
deletion
required_status_checks
```

A ruleset rule type is the only place a check name or a required workflow can
be declared. `required_status_checks` is the only one of the three that names
a context, and there is no `required_workflows` rule, so no required workflow
is configured either. Nothing bypasses the ruleset:

```
$ gh api repos/Nishfleet/aiconverter-app/rulesets/23981683 --jq '.bypass_actors'
[]
```

The one `required_status_checks` rule names six contexts, and `grade / grade`
is not one of them:

```
$ gh api repos/Nishfleet/aiconverter-app/rulesets/23981683 --jq '.rules[] | select(.type=="required_status_checks") | .parameters.required_status_checks[].context'
Build
Gitleaks
Pricing check
Unit tests
actionlint
semgrep
```

## Organization rulesets cannot exist on this plan

The org is on the free plan, so the organization-rulesets endpoint refuses, and
says why in its own message:

```
$ gh api orgs/Nishfleet --jq '.plan.name'
free

$ gh api orgs/Nishfleet/rulesets
{"message":"Upgrade to GitHub Team to enable this feature.","documentation_url":"https://docs.github.com/rest/orgs/rules#get-all-organization-repository-rulesets","status":"403"}   # exit 1
```

Organization rulesets are a GitHub Team feature. With no org ruleset there is
no org-level required status check and no org-level required workflow that
could require `grade / grade` either.

## Classic branch protection is off

Read with an administrator token the protection endpoint answers `404`, not
`403`. A 404 is the API saying the branch is not protected; a 403 would mean
the reader lacked the Administration scope, which is not the case here:

```
$ gh api repos/Nishfleet/aiconverter-app/branches/main/protection
{"message":"Branch not protected","documentation_url":"https://docs.github.com/rest/branches/branch-protection#get-branch-protection","status":"404"}   # exit 1
```

So the required contexts are `Build`, `Gitleaks`, `Pricing check`,
`Unit tests`, `actionlint` and `semgrep`, and `grade / grade` appears in
neither the repo ruleset, nor any org ruleset (none can exist), nor classic
branch protection (off).

## Every required context has a reporter in this tree

The checkable-from-the-diff half of the proof: each required context is
reported by a job that exists in `.github/workflows/` at this commit, and both
reporting workflows declare the `pull_request` trigger, so every context below
reports on every pull request:

```
$ git grep -n -A1 '^on:' -- .github/workflows/ci.yml .github/workflows/secret-scan.yml
.github/workflows/ci.yml:10:on:
.github/workflows/ci.yml-11-  pull_request:
--
.github/workflows/secret-scan.yml:3:on:
.github/workflows/secret-scan.yml-4-  pull_request:
```

| Required context | Workflow | Job id (`jobs:` key) | Job `name:` | Runs on |
| --- | --- | --- | --- | --- |
| `Build` | `.github/workflows/ci.yml` | `build` | `Build` | `pull_request` |
| `Pricing check` | `.github/workflows/ci.yml` | `pricing` | `Pricing check` | `pull_request` |
| `Unit tests` | `.github/workflows/ci.yml` | `tests` | `Unit tests` | `pull_request` |
| `actionlint` | `.github/workflows/ci.yml` | `actionlint` | `actionlint` | `pull_request` |
| `Gitleaks` | `.github/workflows/secret-scan.yml` | `gitleaks` | `Gitleaks` | `pull_request` |
| `semgrep` | `.github/workflows/secret-scan.yml` | `semgrep` | `semgrep` | `pull_request` |

The six contexts above are exactly these six jobs, so no required check is
left without a reporter. Nothing in the tree reports a `grade` context.

## Workflow inventory (`.github/workflows/`)

```
$ git ls-files .github/workflows
.github/workflows/agent-dispatch.yml
.github/workflows/ci.yml
.github/workflows/deploy.yml
.github/workflows/lighthouse.yml
.github/workflows/secret-scan.yml
```

- `ci.yml` — pull-request gates: `pricing` (Pricing check), `tests` (Unit
  tests), `build` (Build) and `actionlint`.
- `secret-scan.yml` — `gitleaks` (Gitleaks) and `semgrep`.
- `deploy.yml` — push to `main` builds and deploys to Cloudflare Pages.
- `lighthouse.yml` — scheduled Lighthouse audits.
- `agent-dispatch.yml` — starts a fleet worker run for a labeled issue.

## Removed: `grade.yml` (deleted 2026-10-12)

`grade.yml` was the only caller of the fleet-ops quality grader
(`Nishfleet/fleet-ops/.github/workflows/grade.yml@main`), which was deleted
upstream in fleet-ops#8953. The upstream workflow no longer exists:

```
$ gh api repos/Nishfleet/fleet-ops/contents/.github/workflows/grade.yml
{"message":"Not Found","documentation_url":"https://docs.github.com/rest/repos/contents#get-repository-content","status":"404"}   # exit 1
```

Every grade run in this repo has failed since (summary of
`gh run list -R Nishfleet/aiconverter-app --workflow grade.yml --limit 5`:
five rows, all `conclusion=failure`, newest run `38276785159` on
`2026-10-12T16:21Z`, on branches unrelated to this change). The caller did not
grade anything; it failed at parse time on every `pull_request` and
`merge_group` event. Removing it ends that parse failure and drops no gate.

The deleted file's own header comment said `Ruleset context is the name GitHub
reports: grade / grade`. That comment did not describe an enforced gate: the
reads above show no ruleset or protection setting in this repo requires that
context. Deleting the workflow therefore cannot strand a required check, and it
removes the only producer of a context nothing required.

No reference to the deleted caller remains. `git grep -rni grade -- .github/`
at this head matches exactly one line, `pip install --upgrade pip` in
`secret-scan.yml` (a substring of "upgrade"),
`git grep -rn "grade\.yml" -- .` outside this file matches nothing (exit 1),
and the context string itself appears nowhere else in the tree:
`git grep -n "grade / grade" -- .` outside this file matches nothing (exit 1).

Other workflows still call fleet-ops reusable workflows on purpose
(`agent-dispatch.yml`, `lighthouse.yml`); those upstream workflows exist and
are unchanged.

The deleted caller passed `CLAUDE_CODE_OAUTH_TOKEN` and `CURSOR_API_KEY` to the
upstream workflow, pinned to mutable `@main`. No consumer remains
(`git grep -rn "CLAUDE_CODE_OAUTH_TOKEN\|CURSOR_API_KEY" -- .github/` matches
nothing, exit 1). Both repo secrets are orphaned; their removal needs repo
Administration, so it is tracked in #253 (this repo) rather than done here.

After this deletion the six required contexts above are the enforced gate, and
this repo runs no separate quality grader in Actions. If a grader is re-added,
pin the upstream workflow to a commit SHA.
