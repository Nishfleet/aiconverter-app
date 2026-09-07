# SPEC — Capterra vendor profile / decline (item 83c4f2d087)

## 1. GOAL

Retire packet item `83c4f2d087` as `resolved` with no PR, because the 2026-08-23 live re-check confirms the Capterra decline already on `main` (PR #147, commit `1d62a8e`) is still current: the `venue-claim` guard still exits 4, the policy ledger still blocks capterra.com, the bot wall is still HTTP 403, the official G2 Digital Markets get-listed path is still live, and Wayback still has no aiconverter/ai-converter product captures. No repo files are created, edited, or deleted.

## 2. EXACT FILES

### Create / edit in the repo
None. The decline and kit are already current on `main`.

### Read for verification
- `/home/nish/workspaces/agent-worktrees/aiconverter-app-lane1-20260823-073032/ops/launch-venues.md` (Capterra section, lines 2839-3058)
- `/home/nish/workspaces/agent-state/growth-loop/venue-policy.json`
- `/home/nish/workspaces/agent-worktrees/aiconverter-app-lane1-20260823-073032/.lane/reports/lane1-capterra-vendor-20260821.md`
- `/home/nish/workspaces/agent-state/lanes/aiconverter-app/lane-1.json`

### Update atomically
- `/home/nish/workspaces/agent-state/lanes/aiconverter-app/lane-1.json` — set the `claims` field to `[]` and write it back with a temp file + rename. No other field may be changed.

### Let `fleet-resolve-item` create/update
- `/home/nish/workspaces/products/aiconverter-app/.fleet/improvement-loop.json` — the `fleet-resolve-item resolve` command appends the retirement record. This is the only external control-plane file written, and it is explicitly required by DONE WHEN (b).

### Write
- `.fleet-spec/667985-28393-1787450688/SPEC.md` (this file)
- `.fleet-spec/667985-28393-1787450688/PROPOSAL.md` (notes two brief conflicts the senior judge should rule on)

## 3. CHANGES

### `/home/nish/workspaces/agent-state/lanes/aiconverter-app/lane-1.json`
1. Read the file.
2. Set `claims` to `[]` (no repo paths are changing this run).
3. Write to a temp file in the same directory, then `mv` it over the original. Do not change `item`, `state`, `stage`, or any other field.

### Retirement record
Run:

```bash
fleet-resolve-item resolve \
  --workspace /home/nish/workspaces/agent-worktrees/aiconverter-app-lane1-20260823-073032 \
  --item-id 83c4f2d087 \
  --status resolved \
  --receipt-pr 147 \
  --commit 1d62a8e \
  --receipt-note "Capterra decline already recorded on main by PR #147 (1d62a8e). 2026-08-23 re-check: venue-claim exit 4, venue-policy.json allowlist empty and capterra.com unknown, Capterra 403 bot wall, official path 200, Wayback no aiconverter listing. No material change since 2026-08-21; no PR opened to avoid docs-only churn."
```

This is the only side-effect. It writes the product-checkout retirement ledger, not the repo.

## 4. MUST NOT TOUCH

- `ops/launch-venues.md` — do not append a 2026-08-23 re-verification block. Main already carries the 2026-08-21 block.
- `.lane/reports/lane1-capterra-vendor-20260823.md` — do not create it. No PR means no lane report.
- `.lane/report.md` (shared report) — leave it untouched.
- `venue-policy.json` / `venues.json` / `agent-state/growth-loop/*` — do not edit.
- Any repo source code, routes, data shapes, or customer-facing copy.
- Any branch, PR, `git push`, or `gh pr create`.
- Capterra / Gartner Digital Markets web pages, forms, or accounts — no browser work, no automation, no account creation.

## 5. ACCEPTANCE

Run each command in the worktree. Every check must match.

1. Policy ledger current
2. Guard `check`
3. Guard `validate`
4. Guard `claim` in an isolated sandbox (must exit 4)
5. Bot wall (homepage)
6. Peer profile bot wall
7. Official get-listed path
8. Wayback absence for `aiconverter`
9. Wayback absence for `ai-converter`
10. Main already has the decline
11. No repo churn after retirement
12. Item retired

## 6. OUT OF SCOPE

- Creating, editing, or publishing a Capterra vendor profile.
- Opening a PR or pushing a feature branch.
- Writing a lane-unique `.lane/reports/lane1-capterra-vendor-20260823.md`
- Appending a 2026-08-23 block to `ops/launch-venues.md`
- Any browser automation, CAPTCHA solving, OAuth, or account creation.
- Any change to `venue-policy.json` or the allowlist.
- Any other venue, product feature, or deployment.

## 7. UNKNOWNS

None for the 2026-08-23 re-check. If any acceptance check returns a different result, stop and escalate before retiring.
