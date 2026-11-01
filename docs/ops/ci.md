# CI on this repo

Every pull request runs `.github/workflows/ci.yml` on GitHub-hosted runners.
Each job names the rule or incident behind it in a comment above the job.

## Merge gate

GitHub's own features only (owner decision 2026-11-01, fleet-ops#10935):

- One repository ruleset on the default branch. It requires the checks `ci`,
  `gitleaks`, `semgrep`, `actionlint` and `preview`, and merges through the
  merge queue. Check it with
  `gh api repos/Nishfleet/aiconverter-app/rulesets --jq '.[].name'`.
- The merge queue runs `ci.yml` again on the merged tree (`merge_group`).
  `preview` is skipped there because the queue has no pull request, and GitHub
  counts a skipped job as passing.

## Preview link

The `preview` job deploys each pull request to the `pr-<number>` branch of the
`aiconverter` Pages project with the official `cloudflare/wrangler-action`.
The link is `https://pr-<number>.aiconverter.pages.dev` and stays the same
across pushes. The pull request template carries it plus a three-line
try-this note. Dependabot pull requests skip it, because Dependabot runs
get no Actions secrets.

## Workflows

| File | What it does |
| --- | --- |
| `ci.yml` | The pull request and merge queue checks. |
| `deploy.yml` | Deploys `main` to production on every merge. |
| `d1-export.yml` | Weekly sealed database backup (docs/ops/database.md). |
| `dependabot-automerge.yml` | Queues Dependabot patch and minor updates. |
