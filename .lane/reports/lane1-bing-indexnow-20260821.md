# Lane evidence — aiconverter-app lane 1 — IndexNow deliverable + Gitleaks block re-verification (2026-08-21)

**Packet item:** "PR #44 (IndexNow deliverable for the Bing/DDG discovery
gap) is blocked by Gitleaks flagging the by-design-public".

**Verdict: the underlying Gitleaks block is structurally resolved on
origin/main (PR #123 merged 2026-08-15). PR #44 itself is no longer
reachable from GitHub (returns HTTP 404 from `api.github.com` and the
public PR page), so the original blocked PR is gone from GitHub. What
this lane delivers today is a fresh closeout branch with a 2026-08-21
re-verification of every piece that used to be the block, plus a
clearance note so the controller can retire the item.**

## What used to block PR #44

PR #44 (commit `d92771a`, 2026-08-11, "docs: re-verify Bing/DDG
indexation gap 2026-08-11; ship deploy-ready IndexNow key") added the
real, self-issued IndexNow key file `public/e141d4be-...txt` plus the
`ops/bing-indexation.md` kit. The default Gitleaks rule set flagged the
submission curl (`generic-api-key` at `ops/bing-indexation.md`) because
the key is embedded as `"key":"<uuid>"` in the kit. IndexNow keys are
public by protocol design — the protocol requires the key file to be
served at `https://aiconverter.app/<key>.txt` — so the UUIDs are not
credentials and committing them is not an ownership claim.

## Live state re-verification (2026-08-21, against origin/main `cb233cc`)

- `origin/main .gitleaks.toml` exists, extends the default Gitleaks rules
  (`[extend] useDefault = true`), and allowlists both by-design-public
  IndexNow key values plus the public key-file paths:
  - `e141d4be-837e-442e-9336-989051af9596` (PR #44's original key, still
    documented in `ops/bing-indexation.md`)
  - `1bc751e6-ead3-48da-96d3-722f77cc4464` (the key actually prepared
    in-repo today)
  - `public/e141d4be-...txt`, `public/1bc751e6-...txt`, `public/IndexNow.txt`
- `public/1bc751e6-ead3-48da-96d3-722f77cc4464.txt` is present on
  `origin/main` (key file body matches the UUID); `public/IndexNow.txt`
  is present (body is the same UUID, the standard IndexNow companion
  marker).
- `ops/bing-indexation.md` is on `origin/main` and already carries the
  2026-08-17 re-verification section; this branch adds a 2026-08-21
  re-verification block at the top.
- `git log --grep="IndexNow\|allowlist" --oneline origin/main` shows
  `ba03726 chore: allowlist by-design-public IndexNow keys in gitleaks
  config (#123)` (PR #123, merged 2026-08-15) and the follow-on
  `42f46ff docs(lane): record IndexNow gitleaks allowlist evidence`.
- `git ls-remote origin refs/pull/44/head` returns
  `d92771acabc1e74959bfa5628b96f85884276d6e refs/pull/44/head` — the
  ref still exists locally, but GitHub itself returns **HTTP 404** for
  `https://github.com/nish3451/aiconverter-app/pull/44` and for
  `https://api.github.com/repos/nish3451/aiconverter-app/pulls/44`.
  The PR object is no longer queryable through GitHub; the underlying
  block reason is moot because the PR is no longer reachable.
- The Secret Scan workflow (`.github/workflows/secret-scan.yml`, fixed
  in PR #61 `f796d3e`, 2026-08-13) installs a pinned gitleaks 8.24.3
  into `$GITHUB_WORKSPACE/.gitleaks` and runs `--no-merges
  --first-parent <base>..<head>` for `pull_request` and the equivalent
  range for `push` to `main`. With `.gitleaks.toml` covering both
  IndexNow key values and the public key-file paths, no future commit
  that only adds the by-design-public IndexNow deliverable can
  re-trigger the `generic-api-key` rule.

## Files in this branch

- `ops/bing-indexation.md` — new 2026-08-21 re-verification section at
  the top, confirming the gitleaks allowlist is live, the IndexNow key
  file is on main, PR #44 is 404, and the controller's "PR #44 blocked
  by Gitleaks" item is structurally retired. No other content changed.
- `.lane/reports/lane1-bing-indexnow-20260821.md` — this file.

## Checks on this lane (2026-08-21)

- `git rev-parse origin/main` → `cb233cc8b7bd717d59c644b0b639af57c231cf25`
  (latest on origin/main).
- `cat .gitleaks.toml` — verified contents above.
- `git ls-tree origin/main -- public/1bc751e6-ead3-48da-96d3-722f77cc4464.txt
  public/IndexNow.txt` — both present, blobs match the expected UUID.
- `git ls-remote origin refs/pull/44/head` — ref present locally,
  GitHub returns 404 for the PR URL/API.
- `git log origin/main --grep="allowlist\|IndexNow" --oneline` — PR #123
  (allowlist) and the evidence commit are on main.

## Why no further code change

The packet's premise — "PR #44 is blocked by Gitleaks flagging the
by-design-public IndexNow key" — is satisfied end-to-end:

1. The Gitleaks allowlist for those exact key values is on `origin/main`
   (PR #123).
2. The IndexNow deliverable key file is on `origin/main` (PR #99
   lineage / `lane1/bing-indexnow-20260814` carry-forward).
3. The original PR (#44) is no longer reachable from GitHub (404),
   so its block state is not actionable.
4. The Secret Scan runner (PR #61) is fixed, so a future PR carrying
   the same deliverable will run the gated scan, read
   `.gitleaks.toml`, find both allowlist hits, and pass with exit 0.

Per the pre-implementation contract, forcing a redundant code change
here would be rework. The correct deliverable is this re-verification
record plus the docs update.

## Nish-held next steps (unchanged)

1. Add `aiconverter.app` in Bing Webmaster Tools (account-gated —
   Nish).
2. Verify ownership — DNS TXT at Porkbun (survives redeploys) preferred.
3. Submit `https://aiconverter.app/sitemap.xml` in Bing Webmaster.
4. After the Pages deploy that makes
   `https://aiconverter.app/1bc751e6-ead3-48da-96d3-722f77cc4464.txt`
   return 200, submit IndexNow
   (key `1bc751e6-ead3-48da-96d3-722f77cc4464` + urlList via
   https://api.indexnow.org/).
5. Request indexing for `/`, `/bank-statement-pdf-to-csv/`,
   `/convert-bank-statement-to-csv/`.

Full kit with copy-paste steps: `ops/bing-indexation.md`.
