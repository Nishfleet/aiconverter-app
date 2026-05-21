# Tasks: Self-Serve SaaS Upgrade

**Input**: `/Users/nish/Vibecoded projects/aiconverter-app-11-saas/specs/001-self-serve-saas-upgrade/`

## Phase 1: Setup

- [x] T001 Create repo-local Spec Kit feature directory and current-plan links.
- [x] T002 Capture expert review constraints in spec and plan.

## Phase 2: Bank Statement Proof Before Upload

- [x] T003 Update `/Users/nish/Vibecoded projects/aiconverter-app-11-saas/src/main.jsx` hero to bank-statement-first messaging.
- [x] T004 Replace decorative no-file preview with accessible fictional bank-statement demo proof.
- [x] T005 Replace animated popular ticker with static bank-specific route chips.
- [x] T006 Update `/Users/nish/Vibecoded projects/aiconverter-app-11-saas/src/styles.css` for desktop/mobile demo proof and 44px nav/upload targets.
- [x] T007 Add UI regression checks for bank-first hero, sample output, static route chips, and truthful pricing wording.

## Phase 3: Validation Workspace

- [x] T008 Add visible validation/review proof to the no-upload demo.
- [x] T009 Add richer validation/import-review guidance around preview result UI.
- [x] T010 Add UI regression checks for validation proof and row-review guidance.

## Phase 4: Bookkeeper Batch Labels

- [x] T011 Add optional client, period, and account labels to queued files in `/Users/nish/Vibecoded projects/aiconverter-app-11-saas/src/main.jsx`.
- [x] T012 Send labels to `/api/batch-download` without requiring accounts.
- [x] T013 Update `/Users/nish/Vibecoded projects/aiconverter-app-11-saas/functions/api/batch-download.js` to sanitize labels and group ZIP exports/reports.
- [x] T014 Add batch ZIP tests for labeled and unlabeled behavior.

## Phase 5: Google Sheets-Ready CSV

- [x] T015 Add `google-sheets-csv` to bank output formats in `/Users/nish/Vibecoded projects/aiconverter-app-11-saas/src/data/converters.json`.
- [x] T016 Implement Sheets-ready CSV mapping and download naming in `/Users/nish/Vibecoded projects/aiconverter-app-11-saas/functions/lib/accounting-exports.js`.
- [x] T017 Add accounting export tests for Sheets-ready CSV.

## Phase 6: Integration Gates

- [x] T018 Add repo documentation for QuickBooks/Xero/Google direct integration gates.
- [x] T019 Update public agent-readable copy where needed to avoid direct integration claims.

## Phase 7: Verification

- [x] T020 Run targeted tests for accounting exports, batch ZIP, and UI regression.
- [x] T021 Run pricing check, full test suite, audit, and build.
- [x] T022 Run local rendered browser verification on desktop and mobile.

## Phase 8: Money Loop Proof Boundary

- [x] T023 Run private monitor with canonical monitor credentials loaded outside the worktree.
- [x] T024 Run admin checkout stress drill and record that it proves checkout handoff only.
- [ ] T025 Keep real-card paid finalize/download/redo/refund proof as an explicit launch blocker until a human payment is completed.

## Phase 9: Canonical Row Corrections

- [x] T026 Persist bank preview/full extracted rows as private R2 JSON artifacts.
- [x] T027 Load canonical/corrected rows in the row-review API before falling back to final CSV parsing.
- [x] T028 Save corrected canonical rows and regenerate selected exports plus validation reports.
- [x] T029 Persist bookkeeper labels against authorized jobs for ZIP reuse.
- [x] T030 Add tests for canonical corrections regenerating Clean CSV, QuickBooks CSV, and Xero CSV shapes.

## Phase 10: Pricing Truth

- [x] T031 Remove fixed public INR prices from customer-facing static HTML and agent-readable Markdown.
- [x] T032 Change frontend pricing display to Dodo preview or visible unavailable state.
- [x] T033 Rewrite pricing checks to fail on hardcoded public plan prices.
- [x] T034 Document whether repo config pushes Dodo prices or Dodo dashboard remains canonical.

## Phase 11: Final Verification

- [x] T035 Run targeted money/pricing/row-review tests.
- [x] T036 Run pricing check, full tests, audit, build, stress checks, and browser verification.
