# CI on this repo

What runs on every pull request, and which checks the merge actually needs.

Every command block below is literal output captured on **2026-10-13** by a
repository administrator. The live values will go stale; re-run the commands
rather than trusting this file. What does not go stale is the part checkable
from this repo's own tree: the context-to-reporter table and the workflow
inventory below name files and job ids that are in the repository.

This file names no repository secret, no token scope and no internal id. The
commands that would need them are left out and their results are stated in
prose instead, because this repository is public.

## Required checks (merge gate)

This repo enforces branch requirements with rulesets, and there is exactly one:

```
$ gh api repos/Nishfleet/aiconverter-app/rulesets --jq 'length'
1
```

Its complete rule list is three types. A ruleset rule type is the only place a
check name or a required workflow can be declared:

```
$ RS=$(gh api repos/Nishfleet/aiconverter-app/rulesets --jq '.[0].id')
$ gh api repos/Nishfleet/aiconverter-app/rulesets/$RS --jq '.rules[].type'
non_fast_forward
deletion
required_status_checks
```

`required_status_checks` is the only one of the three that names a context, and
there is no `required_workflows` rule, so no required workflow is configured
either. Nothing bypasses the ruleset:

```
$ gh api repos/Nishfleet/aiconverter-app/rulesets/$RS --jq '.bypass_actors | length'
0
```

The one `required_status_checks` rule names six contexts, and `grade / grade`
is not one of them:

```
$ gh api repos/Nishfleet/aiconverter-app/rulesets/$RS --jq '[.rules[] | select(.type=="required_status_checks") | .parameters.required_status_checks[].context] | join(", ")'
Build, Gitleaks, Pricing check, Unit tests, actionlint, semgrep
```

## Organization rulesets cannot exist on this plan

The org is on the free plan, so the organization-rulesets endpoint refuses:

```
$ gh api orgs/Nishfleet/rulesets 2>/dev/null | jq -r '.message'
Upgrade to GitHub Team to enable this feature.
```

Organization rulesets are a GitHub Team feature. With no org ruleset there is
no org-level required status check and no org-level required workflow that
could require `grade / grade` either.

## Classic branch protection is off

Read with an administrator token the protection endpoint answers `404`, not
`403`. A 404 is the API saying the branch is not protected; a 403 would mean
the reader lacked the Administration scope, which is not the case here:

```
$ gh api repos/Nishfleet/aiconverter-app/branches/main/protection 2>/dev/null | jq -r '.message'
Branch not protected
```

So the required contexts are `Build`, `Gitleaks`, `Pricing check`, `Unit
tests`, `actionlint` and `semgrep`, and `grade / grade` appears in neither the
repo ruleset, nor any org ruleset (none can exist), nor classic branch
protection (off).

## Every required context has a reporter in this tree

The checkable-from-the-diff half of the proof: each required context is
reported by a job that exists in `.github/workflows/` at this commit, and both
reporting workflows declare the `pull_request` trigger:

```
$ git grep -n -A1 '^on:' -- .github/workflows/ci.yml .github/workflows/secret-scan.yml
.github/workflows/ci.yml:10:on:
.github/workflows/ci.yml-11-  pull_request:
--
.github/workflows/secret-scan.yml:3:on:
.github/workflows/secret-scan.yml-4-  pull_request:
```

| Required context | Workflow | Job id (`jobs:` key) | Job `name:` |
| --- | --- | --- | --- |
| `Build` | `.github/workflows/ci.yml` | `build` | `Build` |
| `Pricing check` | `.github/workflows/ci.yml` | `pricing` | `Pricing check` |
| `Unit tests` | `.github/workflows/ci.yml` | `tests` | `Unit tests` |
| `actionlint` | `.github/workflows/ci.yml` | `actionlint` | `actionlint` |
| `Gitleaks` | `.github/workflows/secret-scan.yml` | `gitleaks` | `Gitleaks` |
| `semgrep` | `.github/workflows/secret-scan.yml` | `semgrep` | `semgrep` |

The six contexts above are exactly these six jobs, so no required check is left
without a reporter. Nothing in the tree reports a `grade` context.

Neither reporter workflow filters by path or skips conditionally, so none of
the six can silently not run on a pull request:

```
$ git grep -n "paths:\|if:\|branches-ignore" -- .github/workflows/ci.yml .github/workflows/secret-scan.yml
   # no output, exit 1
```

## Workflow inventory (`.github/workflows/`)

```
$ git ls-files .github/workflows
.github/workflows/agent-dispatch.yml
.github/workflows/ci.yml
.github/workflows/dependabot-automerge.yml
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
- `dependabot-automerge.yml` — arms auto-merge on Dependabot patch and minor
  pull requests. It reports no required check, and it never checks out pull
  request code.

Each file above carries an off-switch row in the README's "Automation
Off-Switches" section, which names what fires it and how to stop it. A
`tests/workflow-contracts.test.mjs` case fails a pull request that adds a
workflow file without that row, or that puts a `schedule:` trigger back into
`deploy.yml`.

## Removed: `grade.yml`

`grade.yml` was the only caller of the fleet-ops quality grader. The upstream
workflow was deleted on 2026-09-29 in fleet-ops#8953 and no longer exists:

```
$ gh api repos/Nishfleet/fleet-ops/contents/.github/workflows/grade.yml 2>/dev/null | jq -r '.message'
Not Found
```

The caller did not grade anything after that. Of the 14 runs this repo ever made
of it, 13 failed and 1 succeeded, and the single success was on 2026-09-28,
before the upstream deletion:

```
$ gh run list -R Nishfleet/aiconverter-app --workflow grade.yml --limit 100 --json conclusion --jq '[.[].conclusion] | group_by(.) | map("\(.[0])=\(length)") | join(", ")'
failure=13, success=1
```

```
$ gh run list -R Nishfleet/aiconverter-app --workflow grade.yml --limit 100 --json createdAt,conclusion --jq '[.[] | select(.conclusion=="success") | .createdAt] | join(", ")'
2026-09-28T10:20:47Z
```

A failed run with zero jobs is a workflow that never started: GitHub rejected it
before running anything, which is what a call to a deleted upstream workflow
looks like. Twelve of the thirteen failures have zero jobs; the thirteenth
(2026-09-28, before the deletion) has one and failed the rubric:

```
$ for R in $(gh run list -R Nishfleet/aiconverter-app --workflow grade.yml --limit 100 --json databaseId,conclusion --jq '.[] | select(.conclusion=="failure") | .databaseId'); do gh api repos/Nishfleet/aiconverter-app/actions/runs/$R/jobs --jq '.jobs | length'; done | sort | uniq -c
     12 0
      1 1
```

Every run after the deletion failed at parse time, so every pull request carried
a failed run it did not ask for. The workflow declared `pull_request` and
`merge_group` triggers, but no merge queue is configured here (no `merge_queue`
rule in the ruleset above), so only the `pull_request` trigger ever fired.
Removing the caller ends those failures and drops no gate.

The deleted file's own header comment said `Ruleset context is the name GitHub
reports: grade / grade`. That comment did not describe an enforced gate: the
reads above show no ruleset or protection setting in this repo requires that
context. Deleting the workflow therefore cannot strand a required check, and it
removes the only producer of a context nothing required.

No reference to the deleted caller remains. `git grep -rni grade -- .github/`
at this head matches exactly one line, `pip install --upgrade pip` in
`secret-scan.yml` (a substring of "upgrade"), `git grep -rn "grade\.yml" -- .`
outside this file matches nothing (exit 1), and the context string itself
appears nowhere else in the tree: `git grep -n "grade / grade" -- .` outside
this file matches nothing (exit 1).

Other workflows still call fleet-ops reusable workflows on purpose
(`agent-dispatch.yml`, `lighthouse.yml`); those upstream workflows exist and
are unchanged.

The deleted caller passed two repository secrets to the upstream workflow,
pinned to mutable `@main`. A grep of `.github/` for either secret name now
finds no consumer, so both are orphaned; the grep is deliberately not printed
here because the names themselves are reconnaissance detail on a public repo.
Removing the secrets needs repo Administration, so it is tracked in #253 (this
repo) rather than done here.

After this deletion the six required contexts above are the enforced gate, and
this repo runs no separate quality grader in Actions. If a grader is re-added,
pin the upstream workflow to a commit SHA.
