# Feature Specification: Self-Serve SaaS Upgrade

**Feature Branch**: `codex/aiconverter-11-saas`
**Created**: 2026-05-21
**Status**: Draft
**Input**: Product audit and expert side reviews for making AI Converter a stronger self-serve SaaS.

## User Scenarios & Testing

### User Story 1 - Bank Statement Proof Before Upload (Priority: P1)

A first-time visitor immediately understands the narrow job: bank statement PDFs can be previewed and turned into reviewable CSV/QBO/OFX/QIF-style exports, with a fictional no-upload sample showing rows, warnings, and export choices.

**Why this priority**: The strongest competitor gap is trust before payment. A generic all-file converter homepage hides the paid workflow.

**Independent Test**: Open the homepage with no file selected and verify that the first screen leads with bank statements, shows a no-upload sample, keeps live pricing phrased as preview/unlock, and does not claim direct accounting-app integrations.

**Acceptance Scenarios**:

1. **Given** no file is selected, **When** the homepage renders, **Then** the H1 and supporting copy are bank-statement-first.
2. **Given** no file is selected, **When** the visitor reviews the first screen, **Then** they can see fictional extracted rows, validation checks, and export options without opening the file picker.
3. **Given** a mobile viewport, **When** the first screen renders, **Then** the demo proof remains visible and the primary touch targets are at least 44px high.

### User Story 2 - Validation Becomes The Sales Moment (Priority: P2)

After a preview or sample, the user can see which checks passed and what still needs review before paying or importing.

**Why this priority**: The repo already has validation/report logic; surfacing it improves confidence without adding risky new infrastructure.

**Independent Test**: Run preview UI regression checks and open the local UI to verify validation chips, review guidance, and validation-report actions appear around the preview.

**Acceptance Scenarios**:

1. **Given** a preview-ready bank result, **When** the result panel renders, **Then** it shows row count, date coverage, amount coverage, balance continuity, duplicate review, and import-review guidance.
2. **Given** a complete editable bank CSV result, **When** the row editor opens, **Then** the copy explains that saved edits affect the downloaded file.

### User Story 3 - Bookkeeper Batch Labels (Priority: P3)

A bookkeeper handling multiple client statements can label each queued file by client, period, and account nickname, then receive a ZIP grouped by those labels with a useful manifest.

**Why this priority**: Batch/client organization is more valuable than generic conversion for professional users and reuses the existing batch download flow.

**Independent Test**: Run batch ZIP tests and verify labels create foldered ZIP entries and manifest lines without requiring accounts.

**Acceptance Scenarios**:

1. **Given** multiple completed files with labels, **When** the ZIP is downloaded, **Then** exports and validation reports are grouped under sanitized client/period/account folders.
2. **Given** no labels are provided, **When** the ZIP is downloaded, **Then** existing export naming still works.

### User Story 4 - Google Sheets-Ready Export (Priority: P4)

A user who works in Google Sheets can choose a Sheets-ready CSV export without connecting a Google account.

**Why this priority**: It captures spreadsheet workflow demand without OAuth, token storage, revocation, or consent work.

**Independent Test**: Export bank rows as Google Sheets CSV and verify headers/amounts are spreadsheet-friendly.

**Acceptance Scenarios**:

1. **Given** bank rows, **When** `google-sheets-csv` is selected, **Then** the export returns a CSV with clean date, description, money in, money out, balance, signed amount, and review columns.
2. **Given** public copy references Google Sheets, **When** scanned, **Then** it says Sheets-ready CSV and not connected Google account or Drive sync.

### User Story 5 - Integration Gates (Priority: P5)

QuickBooks and Xero direct integrations remain visibly gated until OAuth, scoped permissions, audit logs, receipts, rollback, support, and verified import proof exist.

**Why this priority**: Direct integrations can create trust and security risk if implied before they are real.

**Independent Test**: Search public copy and docs for direct integration claims and verify the repo contains an integration gate plan.

**Acceptance Scenarios**:

1. **Given** a visitor chooses QuickBooks or Xero outputs, **When** they read the UI, **Then** they see file-based CSV/QBO/OFX prep, not direct app connection.
2. **Given** the repo is reviewed, **When** integration work is considered, **Then** the gate checklist is documented before implementation.

### User Story 6 - Canonical Row Corrections (Priority: P1)

A paid bank-statement user can review and correct normalized transaction rows, then regenerate the selected export from those corrected rows.

**Why this priority**: Editing only the final CSV is not enough for a bookkeeper workflow. Corrections must live as job-scoped source data so QuickBooks CSV, Xero CSV, Sheets CSV, and plain CSV can stay consistent.

**Independent Test**: Save edited canonical rows for a paid bank job and verify the corrected rows are persisted, the selected export is regenerated, and the validation report marks the file as edited.

**Acceptance Scenarios**:

1. **Given** a paid bank CSV job has canonical extracted rows, **When** the row editor loads, **Then** it shows normalized transaction fields rather than only the mapped export columns.
2. **Given** a user saves corrected rows, **When** they download the result, **Then** the selected output is regenerated from the corrected rows.
3. **Given** corrected rows are saved, **When** the validation report is downloaded, **Then** it reflects the edited row count and review warning.

### User Story 7 - Pricing Truth (Priority: P1)

Customer-facing pricing must come from Dodo preview when available, and must fail visibly when live pricing cannot be loaded.

**Why this priority**: A self-serve paid SaaS cannot display stale fixed prices while checkout currency and totals are controlled by Dodo.

**Independent Test**: Run pricing checks that fail on hardcoded public plan prices and verify the UI shows a live-pricing unavailable state instead of INR fallbacks.

**Acceptance Scenarios**:

1. **Given** Dodo pricing preview is available, **When** the app renders pricing, **Then** visible plan prices use the previewed display price/currency.
2. **Given** Dodo pricing preview is unavailable, **When** the app renders pricing, **Then** it shows pricing unavailable and blocks checkout instead of showing fixed INR copy.
3. **Given** public Markdown or static HTML is scanned, **When** pricing copy appears, **Then** it describes preview-first paid unlocks without publishing fixed INR amounts.

### User Story 8 - Money Loop Proof Boundary (Priority: P1)

The repo must distinguish automated checkout drill proof from full real-card paid-path proof.

**Why this priority**: Checkout URL creation is not enough. 11/10 launch requires checkout, signed payment, finalize, download, redo, and refund/credit proof.

**Independent Test**: Run public readiness, private monitor, and admin checkout drill; document that the real-card drill still requires human payment when it has not been completed.

**Acceptance Scenarios**:

1. **Given** admin monitor credentials are available, **When** the private monitor runs, **Then** health/admin alerts are reported without exposing secrets.
2. **Given** admin checkout drill credentials are available, **When** checkout stress runs, **Then** it creates Dodo checkout handoffs without claiming payment completion.
3. **Given** no human card payment has been completed in this sequence, **When** launch readiness is summarized, **Then** real-card proof remains an explicit blocker.

## Requirements

### Functional Requirements

- **FR-001**: The homepage MUST lead with bank statement PDF conversion and keep broad file conversion secondary.
- **FR-002**: The homepage MUST include a fictional no-upload demo with rows, validation checks, and export choices.
- **FR-003**: The product MUST keep paid claims truthful: free preview first, unlock after preview, no guaranteed accuracy, no official QuickBooks/Xero integration claim.
- **FR-004**: Preview/result UI MUST surface validation and review guidance before import.
- **FR-005**: The file queue MUST allow optional client, period, and account labels without requiring login.
- **FR-006**: Batch ZIP download MUST accept optional labels, sanitize them, and group exports/reports while preserving existing behavior without labels.
- **FR-007**: Bank exports MUST include a Google Sheets-ready CSV output format.
- **FR-008**: Public docs MUST include integration gates for direct QuickBooks/Xero/Google account connections.
- **FR-009**: Paid bank row edits MUST persist corrected canonical rows as a job-scoped private artifact.
- **FR-010**: Saved canonical row edits MUST regenerate the selected export and validation report.
- **FR-011**: Public pricing display MUST use Dodo pricing preview or show pricing unavailable; fixed local amounts are internal config only.
- **FR-012**: Pricing checks MUST fail if customer-facing static surfaces publish fixed INR plan prices.
- **FR-013**: Money-loop verification MUST separate checkout handoff, paid webhook/finalize, download, redo, and refund proof.

### Key Entities

- **Bank Demo Sample**: Fictional rows, validation checks, and export choices shown without upload.
- **Batch Label**: Optional client label, period label, and account nickname attached to a queued file for ZIP grouping.
- **Sheets-Ready CSV**: Bank CSV preset designed for Google Sheets import/copy workflows, not direct Google OAuth.
- **Integration Gate**: Documented prerequisites for direct third-party app connections.
- **Canonical Bank Rows**: Normalized private transaction rows used as the source for review edits and regenerated exports.
- **Pricing Preview**: Live Dodo checkout preview result used for visible plan price/currency.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Homepage source and rendered UI contain bank-first messaging and no-upload sample proof.
- **SC-002**: Existing preview UI regression tests cover the bank-first hero, no-upload sample, static bank routes, validation proof, and batch labels.
- **SC-003**: Accounting export tests prove Google Sheets CSV output and stable download naming.
- **SC-004**: Batch ZIP tests prove labels produce foldered exports/reports and unlabeled jobs keep current behavior.
- **SC-005**: Build and core test suite pass before deploy is considered.
- **SC-006**: Row-review tests prove canonical edits persist and regenerate at least two bank CSV output shapes.
- **SC-007**: Pricing tests fail on hardcoded public INR plan prices and pass on Dodo-preview-first copy.
- **SC-008**: Automated admin checkout drill passes, while real-card paid-path proof is reported separately if not completed.

## Assumptions

- No account system is added in this sequence.
- No Google, QuickBooks, or Xero OAuth is added in this sequence.
- Existing Cloudflare D1/R2/job/token architecture stays the base.
- Dodo remains the pricing source of truth; hardcoded pricing copy stays fallback-only.
- No real-card checkout is completed by Codex without explicit human/operator payment.
