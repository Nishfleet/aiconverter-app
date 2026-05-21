# Implementation Plan: Self-Serve SaaS Upgrade

**Branch**: `codex/aiconverter-11-saas`
**Spec**: `/Users/nish/Vibecoded projects/aiconverter-app-11-saas/specs/001-self-serve-saas-upgrade/spec.md`
**Date**: 2026-05-21

## Technical Context

AI Converter is a React/Vite frontend with Cloudflare Pages Functions for conversion, D1 job state, R2 storage, Dodo payment checkout, and existing no-login job tokens. The upgrade must deepen the current hosted workflow rather than adding accounts or direct third-party OAuth.

## Scope

- Reposition first screen around bank statement PDFs and reviewable accounting exports.
- Replace generic animated popular ticker with static bank-specific routes.
- Add fictional no-upload sample proof above the fold.
- Surface validation/review proof in sample and preview result UI.
- Add optional batch labels in the frontend and grouped ZIP output in `/api/batch-download`.
- Add Google Sheets-ready CSV as a bank export preset.
- Add docs/copy gates for direct QuickBooks/Xero/Google connections.
- Persist canonical bank rows as private R2 artifacts and regenerate exports from saved corrections.
- Make Dodo preview the only source for visible customer pricing; static plan amounts remain internal config.
- Verify public readiness, private monitor, and admin checkout handoff while keeping real-card paid proof explicit.

## Non-Goals

- No user accounts, team workspace, client portal, or permanent history.
- No Google Drive/Sheets OAuth or write-to-sheet integration.
- No direct QuickBooks/Xero connection or official integration claim.
- No guaranteed accuracy, reconciliation, categorization, or accounting advice.
- No real-card payment or refund action without explicit human/operator completion.

## Constitution Check

- Spec exists before implementation.
- Tests must cover export behavior, batch labels, and UI regression hooks.
- Browser verification is required for the changed homepage and mobile layout.
- Client code will not call platform/admin/payment/model-provider secrets directly.
- Release gates stay: pricing check, tests, audit, build; live deploy remains separate.
- Row corrections stay inside the existing D1/R2/job-token model; no accounts are added.

## Verification Plan

- `node --test tests/accounting-exports.test.mjs tests/batch-download.test.mjs tests/preview-ui-regression.test.mjs`
- `node --test tests/result-row-review.test.mjs tests/pricing-truth.test.mjs`
- `npm run check:pricing`
- `node --test tests/*.test.mjs`
- `npm audit --audit-level=moderate`
- `npm run build`
- Local rendered browser verification for desktop and mobile homepage.
- With monitor credentials loaded outside the repo: `npm run monitor:live` and `npm run stress:checkout`.

## Risks

- Public copy could accidentally imply direct integrations. Mitigation: add explicit gates and regression text checks.
- Batch labels could leak unsafe path characters into ZIP entries. Mitigation: sanitize labels server-side and test special characters.
- Google Sheets wording could sound like OAuth. Mitigation: use "Sheets-ready CSV" only.
- Corrected rows could diverge from selected exports. Mitigation: save canonical rows first, then regenerate the selected output server-side.
- Pricing could mislead if Dodo is unavailable. Mitigation: visible pricing unavailable state blocks checkout rather than using public fixed prices.
- Admin checkout drills can create unpaid handoffs. Mitigation: exclude drill jobs from customer-alert interpretation and keep real-card proof separate.
