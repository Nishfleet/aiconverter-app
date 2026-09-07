# PROPOSAL — two brief conflicts for the senior judge

The sealed packet and the judge spec disagree in two places. The worker follows the spec (spec wins). Recording the conflicts so a senior judge can rule if a later cycle reopens this item.

## Conflict 1 — PR vs retire-with-no-PR

- Raw packet: "Branch from fresh origin/main, push early, open a PR."
- Spec: retire item `83c4f2d087` as `resolved` with **no PR**, because the decline is already on `main` (PR #147, `1d62a8e`). A docs-only evidence PR for an already-resolved item is churn.

**Worker action:** follow the spec. No branch, no push, no PR.

## Conflict 2 — lane report vs no-churn

- Raw packet: write evidence to `.lane/reports/<your-branch-name>.md`.
- Spec: do **not** create `.lane/reports/lane1-capterra-vendor-20260823.md` and do **not** append a 2026-08-23 block to `ops/launch-venues.md`. Main already carries the 2026-08-21 decline and kit. Evidence for this run lives in the dispatch report only.

**Worker action:** follow the spec. No lane report, no `ops/launch-venues.md` edit.

## Not a conflict (already decided)

- Claims stay `[]` because no repo paths change.
- `fleet-resolve-item` is the only allowed side-effect.
- Fleet-dispatch incremental report is required and is written outside the product repo.
