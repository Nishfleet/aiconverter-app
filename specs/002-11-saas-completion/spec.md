# Feature Specification: 11/10 Self-Serve SaaS Completion

**Feature Branch**: `codex/aiconverter-11-saas-completion`
**Created**: 2026-05-22
**Status**: Draft
**Input**: Turn AI Converter into a true 11/10 self-serve SaaS and stress test every component to failure.

## User Scenarios & Testing

### User Story 1 - Paid Path Is Proven End-to-End (Priority: P1)

A buyer starts from a useful preview, pays through Dodo, returns to an unlocked job, finalizes the full output, downloads it, uses the stronger redo when needed, and gets a recorded refund or credit path when the paid result fails.

**Independent Test**: Run automated checkout, webhook, finalize, download, redo, and refund simulations; then run the live paid-drill checklist up to the human card-payment gate.

### User Story 2 - Customer Can Recover Jobs Without Support (Priority: P1)

A customer who provided an email can recover recent jobs, payment status, download links, deletion controls, and support/refund status from a secure recovery link.

**Independent Test**: Create jobs with a customer email, request a recovery link, verify that the link reveals only matching authorized jobs, and confirm expired/invalid links fail closed.

### User Story 3 - Billing And Receipts Are Self-Serve (Priority: P1)

A paying customer can see plan, amount, currency, payment status, refund status, receipt metadata, and a provider/support handoff when configured.

**Independent Test**: Use test payment records and webhook events to verify billing summaries, receipt fields, refund fields, and safe portal-unavailable states.

### User Story 4 - Support Requests Become Trackable Cases (Priority: P2)

A customer who needs help can submit a support, deletion, security, refund, or conversion case and later see the case status from recovery.

**Independent Test**: Submit support cases for authorized jobs, verify ticket ids/statuses are stored, and confirm recovery shows only matching cases.

### User Story 5 - Import Confidence Is First-Class (Priority: P2)

A bank-statement user can tell whether the export is import-ready, needs review, or should not be paid for, using visible checks and a downloadable report.

**Independent Test**: Run statement validation fixtures that force clean, weak-balance, duplicate, missing-date, and weak-OCR paths and verify UI plus report output.

### User Story 6 - Bookkeeper Workflow Supports Repeat Use (Priority: P3)

A repeat bookkeeper can label jobs, group outputs by client/period/account, recover recent jobs, and understand current one-time packs without fake subscriptions or direct app integrations.

**Independent Test**: Run batch label, recovery, billing, and pricing tests for multiple jobs under one customer email.

### User Story 7 - Components Are Stress Tested To Failure (Priority: P1)

The product has an explicit failure matrix for upload, preview, pricing, checkout, webhook, finalize, download, redo, refund, row edits, batch ZIP, support, recovery, provider fallback, admin, rendering, rate limits, and headers.

**Independent Test**: Run local failure tests and live-safe production checks without destructive provider spend.

## Requirements

- **FR-001**: Paid-path verification MUST separately prove checkout, signed payment/webhook, finalize, download, redo, and refund/credit recording.
- **FR-002**: Jobs MUST support optional customer email for recovery, billing, and support without requiring an account before upload.
- **FR-003**: Recovery links MUST be short-lived, hashed at rest, and scoped to jobs matching the requested email.
- **FR-004**: Recovery MUST show recent job status, output, payment state, download eligibility, redo eligibility, deletion state, billing summary, and support status.
- **FR-005**: Billing summaries MUST use provider/payment records and must not invent invoices, subscriptions, customer portals, or tax/compliance claims.
- **FR-006**: Support requests MUST create ticket ids, topics, statuses, timestamps, and job/customer links when authorized.
- **FR-007**: Import-confidence UI and reports MUST include row count, confidence score, date coverage, amount coverage, running-balance check, duplicate check, opening/closing balance, and import-readiness status.
- **FR-008**: Public copy MUST distinguish current one-time packs from roadmap subscriptions, team seats, direct integrations, or API access.
- **FR-009**: Recovery, billing, support, and download paths MUST fail closed for invalid, expired, mismatched, or unauthorized tokens.
- **FR-010**: Stress scripts MUST include local failure tests and live-safe checks for every major product component.
- **FR-011**: Real-card paid-path proof MUST remain incomplete until a human/operator completes a Dodo checkout and the verifier confirms webhook/finalize/download/redo/refund behavior.

## Key Entities

- **Customer Recovery Token**: Short-lived hashed token for email-scoped job recovery.
- **Customer Job Summary**: Safe job-status view used by recovery and billing surfaces.
- **Billing Summary**: Provider-derived payment, plan, amount, currency, receipt email, refund, and portal status.
- **Support Case**: Trackable request with topic, status, sanitized message, job id, customer email, and timestamps.
- **Import Confidence Report**: Machine-readable and human-readable validation state for bank outputs.
- **Failure Matrix**: Test inventory mapping each component to happy, edge, and failure cases.

## Success Criteria

- **SC-001**: A customer can request and use a recovery link for recent jobs without support.
- **SC-002**: Recovery returns no job data for expired, invalid, mismatched, or reused tokens.
- **SC-003**: Billing summaries accurately reflect Dodo payment/refund records in tests and live-safe checks.
- **SC-004**: Support submissions return a ticket id and recovery displays matching ticket status.
- **SC-005**: Import confidence appears in UI and downloadable reports for clean and weak bank-statement fixtures.
- **SC-006**: Stress/failure tests cover upload, preview, pricing, checkout, webhook, finalize, download, redo, refund, row edits, batch ZIP, support, recovery, provider fallback, admin, rendering, rate limits, and headers.
- **SC-007**: Release checks pass: pricing, full tests, dependency audit, build, converter stress, live readiness, monitor, checkout stress, and rendered UI verification.
- **SC-008**: Launch summary separates automated proof from the human real-card paid-path proof.

## Assumptions

- No password account system is required for this sequence; email recovery is the first SaaS layer.
- No direct QuickBooks, Xero, Google Drive, Zapier, Make, or API integration is added until auth, consent, audit, import proof, and support contracts are ready.
- Dodo remains the visible pricing and payment source of truth.
- D1 and R2 remain the workflow storage layer.
- Real-card proof cannot be completed by Codex without a human/operator paying the checkout.
