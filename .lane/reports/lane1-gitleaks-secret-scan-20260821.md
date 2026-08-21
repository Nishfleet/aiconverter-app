# Lane evidence — aiconverter-app lane 1

## 2026-08-21 — Fix Secret Scan (Gitleaks) failures on the VPS verification runner (/tmp cache-restore failure + stale /tmp)

**Verdict: the item is ALREADY FIXED and merged on origin/main (PR #61,
`f796d3e`, 2026-08-13), and the live runner executes it green. This lane is
the 2026-08-21 re-verification closeout — no tracked-file change remains to
make in this repo, so the deliverable is this live re-verification record
instead of a code change.**

### What the merged fix does (already on origin/main)

`.github/workflows/secret-scan.yml` replaces `gitleaks/gitleaks-action@v3`
with a pinned (v8.24.3) workspace-local install plus the same scan semantics
and exit-code contract (0 clean, 2 leaks, else error). The old action
installed the scanner under `os.tmpdir()` (system `/tmp` on the shared
`vps-verify` runner) and never cleaned up, failing two ways:

- actions-cache restore: `Cannot mkdir /tmp: Read-only file system` (the
  cached archive stores `/tmp/gitleaks-*` as workspace-escaped relative
  paths), and
- the download fallback: `Destination file path /tmp/gitleaks.tmp already
  exists` when a previous run left the stale file behind.

The merged workflow installs into `$GITHUB_WORKSPACE/.gitleaks` instead: the
workspace is always writable and checkout's clean wipes it before every job,
so no stale state can accumulate and no actions cache is involved. The only
`/tmp` tokens left in the workflow are comment lines documenting the old
failure (lines 25-31); the executable steps never touch `/tmp`.

### Live verification 2026-08-21 (against GitHub, credential-free)

- `gh run list --workflow=secret-scan.yml --limit 200`: **200/200 most recent
  runs `success`** — zero non-success conclusions. Covers PR runs and pushes
  on main through 2026-08-20 20:33Z (latest at query time).
- Executed-step log of the latest green run (32414733013, 2026-08-20 20:33Z,
  PR `lane1/g2-free-profile-20260821`): "Install Gitleaks" step runs
  `mkdir -p "$GITHUB_WORKSPACE/.gitleaks"`, curl of
  `gitleaks_8.24.3_linux_x64.tar.gz`, `tar -xzf` into the workspace, and
  `"$GITHUB_WORKSPACE/.gitleaks/gitleaks" version` — the workspace-local
  install, no `/tmp`, no actions cache.
- `origin/main .github/workflows/secret-scan.yml` matches the fixed version
  (workspace-local install, no gitleaks-action, no actions cache); the
  worktree is in sync (`git diff origin/main` over the workflow and
  `.gitleaks.toml` is empty).
- The stale `/tmp/gitleaks*` artifacts still present on this VPS
  (e.g. `/tmp/gitleaks-8.24.3/`, `/tmp/gitleaks-action-*/`,
  `/tmp/gitleaks.tgz`, `/tmp/gitleaks.log`) are leftovers from manual pre-fix
  testing (Aug 11-13) and the 2026-08-19 PR-review scratch work; the current
  workflow never writes to `/tmp`, so they are inert and no job cleans them.
- No new gitleaks work exists on any branch: `git log --all --grep=gitleaks`
  tops out at the merged allowlist PR #123 and the merged runner fix PR #61.
- The content-side allowlist (`.gitleaks.toml`, merged PR #123) is also on
  main, so the scan is green on both the runner and the rules side.

### Why no code change in this lane

The packet's premise (fix the failures) is already satisfied by merged PR
#61 and re-verified green on the live runner. Per the pre-implementation
contract, forcing a redundant change would be rework; the correct deliverable
is this verified closeout record.

### Files

- `.lane/reports/lane1-gitleaks-secret-scan-20260821.md` — this evidence
  record (only file on this branch).

### PR

- Branch `lane1/gitleaks-secret-scan-20260821` pushed; PR #149 opened with
  this evidence-only change.
