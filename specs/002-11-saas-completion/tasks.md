# Tasks: 11/10 Self-Serve SaaS Completion

**Input**: `specs/002-11-saas-completion/`

## Phase 1: Setup

- [x] T001 Update `.specify/feature.json` to point at `specs/002-11-saas-completion`.
- [x] T002 Update `AGENTS.md` Spec Kit plan link to `specs/002-11-saas-completion/plan.md`.
- [x] T003 Add database migration for recovery tokens and support/billing fields in `migrations/0012_self_serve_saas.sql`.

## Phase 2: Recovery And Billing Foundations

- [x] T004 Add recovery token helpers in `functions/lib/recovery.js`.
- [x] T005 Add billing summary helpers in `functions/lib/billing-summary.js`.
- [x] T006 Add support ticket helpers in `functions/lib/support-tickets.js`.
- [x] T007 Add email adapter/logging helper in `functions/lib/email.js`.
- [x] T008 Add tests for recovery token hashing, expiry, scope, and safe email payloads in `tests/recovery.test.mjs`.
- [x] T009 Add tests for billing summaries from paid/refund/pending jobs in `tests/billing-summary.test.mjs`.
- [x] T010 Add tests for ticket ids, support status, and sanitization in `tests/support-tickets.test.mjs`.

## Phase 3: Customer Recovery Surface

- [x] T011 Add `functions/api/recovery/request.js` for email-scoped recovery requests.
- [x] T012 Add `functions/api/recovery/jobs.js` for recovery-token job summaries.
- [x] T013 Add `functions/api/billing/summary.js` for authorized billing summaries.
- [x] T014 Extend `functions/api/support.js` to return ticket ids and status.
- [x] T015 Add recovery, billing, and support UI states in `src/main.jsx`.
- [x] T016 Add recovery/account/billing styling in `src/styles.css`.
- [x] T017 Add UI regression coverage for recovery, billing, support status, and truthful unavailable states in `tests/preview-ui-regression.test.mjs`.

## Phase 4: Import Confidence And Bookkeeper SaaS Proof

- [x] T018 Enrich import-confidence report generation in `functions/lib/accounting-exports.js`.
- [x] T019 Surface import-readiness status in preview/result UI in `src/main.jsx`.
- [x] T020 Add import-confidence tests for clean, weak-balance, duplicate, missing-date, and weak-OCR fixtures in `tests/import-confidence.test.mjs`.
- [ ] T021 Add bookkeeper recovery grouping and labels reuse tests in `tests/recovery.test.mjs`.
- [x] T022 Update public trust/pricing/agent-readable copy to describe current self-serve recovery without claiming full accounts, subscriptions, or direct integrations.

## Phase 5: Failure Matrix And Stress To Failure

- [x] T023 Add local failure matrix script in `scripts/failure-matrix.mjs`.
- [x] T024 Add failure matrix tests in `tests/failure-matrix.test.mjs`.
- [x] T025 Extend stress scripts to cover recovery, billing, support, row edits, batch ZIP, pricing unavailable, webhook mismatch, redo abuse, refund due, provider fallback, rate limits, and headers.
- [ ] T026 Add rendered Playwright audit script for homepage, recovery, billing, support, and mobile layout in `scripts/rendered-ui-audit.mjs`.

## Phase 6: Verification And Launch Boundary

- [x] T027 Run targeted new tests for recovery, billing, support, import confidence, and failure matrix.
- [x] T028 Run pricing check, full tests, dependency audit, and build.
- [ ] T029 Run converter stress, live stress, checkout stress, readiness, private monitor, and rendered UI audit.
- [ ] T030 Create or reuse a paid-drill checkout and keep verify/refund blocked until a human payment is complete.
- [ ] T031 Document final 11/10 status with explicit proof table and remaining human-paid-card gate.

## MVP First

The smallest meaningful increment is recovery request, recovery job list, billing summary, ticketed support, and failure matrix tests. Direct integrations, teams, and subscriptions stay gated until paid path and recovery are proven.
