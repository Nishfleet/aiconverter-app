# Lane evidence — aiconverter-app lane 1

## 2026-08-15 — Fix Secret Scan (Gitleaks) failures on the VPS verification runner (/tmp cache-restore failure + stale /tmp)

**Verdict: the item is ALREADY FIXED and merged on origin/main (PR #61,
`f796d3e`, 2026-08-13). Every Secret Scan run since the merge — including
runs earlier today on both PRs and pushes to main — completes successfully.
No tracked-file change remains to make in this repo, so this lane delivers a
live re-verification record instead of a code change.**

### What the fix does (already on origin/main)

`.github/workflows/secret-scan.yml` replaces `gitleaks/gitleaks-action@v3`
with a pinned (v8.24.3) workspace-local install plus the same scan semantics
and exit-code contract (0 clean, 2 leaks, else error). The gitleaks-action v3
installed the scanner under `os.tmpdir()` (system `/tmp` on the shared
`vps-verify` runner) and never cleaned up, failing two ways:

- actions-cache restore: `Cannot mkdir /tmp: Read-only file system` (the
  cached archive stores `/tmp/gitleaks-*` as workspace-escaped relative
  paths), and
- the download fallback: `Destination file path /tmp/gitleaks.tmp already
  exists` when a previous run left the stale file behind.

The merged workflow installs into `$GITHUB_WORKSPACE/.gitleaks` instead: the
workspace is always writable and checkout's clean wipes it before every job,
so no stale state can accumulate and no actions cache is involved.

### Live verification 2026-08-15 (against GitHub, credential-free)

- `gh run list --workflow=secret-scan.yml --limit 100`: of 100 most recent
  runs, **zero non-success conclusions** (the single blank entry is a run
  still queued/in-flight at query time). Runs from 2026-08-15 06:44Z onward
  all `success`, covering `lane1/*` PRs and `push` runs on `main`.
- `origin/main .github/workflows/secret-scan.yml` matches the fixed version
  (workspace-local install, no gitleaks-action, no actions cache).
- The stale `/tmp/gitleaks*` artifacts on this VPS are leftovers from manual
  pre-fix testing (Aug 11-13); the current workflow never writes to `/tmp`,
  so they are inert and are not cleaned by any job.
- Runner `aiconv-verify1` (`/var/lib/github-runners/aiconv-verify1`) is
  healthy and has been executing these green runs.

### Why no code change in this lane

The packet's premise (fix the failures) is already satisfied by merged PR
#61. Per the pre-implementation contract, forcing a redundant change would
be rework; the correct deliverable is this verified closeout record.

### Repo state note

`node_modules/` appears as an untracked empty directory skeleton in this
worktree (no files inside — git cannot track empty dirs, so it is inert and
not committed). Left untouched.

### Files

- `.lane/reports/lane1-gitleaks-secret-scan-20260815.md` — this evidence
  record (only file on this branch).
