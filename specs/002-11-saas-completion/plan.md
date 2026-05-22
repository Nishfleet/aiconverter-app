# Implementation Plan: 11/10 Self-Serve SaaS Completion

**Branch**: `codex/aiconverter-11-saas-completion`
**Spec**: `specs/002-11-saas-completion/spec.md`
**Date**: 2026-05-22

## Technical Context

AI Converter is a React/Vite app on Cloudflare Pages Functions with D1 for job/payment/support state, R2 for private source/result artifacts, Dodo for checkout/webhooks/refunds, Turnstile/rate limits for abuse prevention, and existing no-login job tokens. The completion layer adds email-scoped recovery, billing summaries, support ticket status, confidence reporting, and failure stress coverage without unsupported direct integrations or subscriptions.

## Scope

- Add short-lived email recovery tokens and recovery APIs.
- Add a customer recovery/account surface for recent jobs.
- Add billing summaries from existing job/payment/refund records.
- Add support ticket ids/statuses and expose matching cases in recovery.
- Upgrade import-confidence output and visible review language.
- Add stress/failure matrix tests and scripts for critical components.
- Keep Dodo pricing/payment as source of truth.
- Keep real-card proof as an explicit external gate until human payment is complete.

## Non-Goals

- No password account system, OAuth login, SSO, RBAC, or enterprise team seats.
- No direct QuickBooks, Xero, Google Drive/Sheets, Zapier, Make, or API integration.
- No SOC 2, GDPR certification, HIPAA, or compliance badge claims.
- No fake invoices, fake subscription plans, or fake customer portal.
- No source file storage beyond the current short lifecycle.

## Constitution Check

- Spec exists before implementation.
- Customer-facing claims must stay truthful to live behavior.
- Client code must not call platform, database, payment, or provider secrets directly.
- New recovery/billing/support endpoints must fail closed.
- Dodo remains the visible pricing/payment source of truth.
- Verification must include tests, browser rendering, live-safe checks, and explicit paid-path proof boundary.

## Research Decisions

- **Recovery model**: Use optional email-scoped, short-lived recovery links before full accounts.
- **Billing model**: Show provider-derived payment/refund summaries and a support fallback.
- **Support model**: Extend stored support requests into ticketed cases with status fields.
- **Confidence model**: Reuse statement validation outputs and enrich reports/UI with import-readiness status.
- **Stress model**: Add a local failure matrix plus live-safe health/pricing/monitor/rendering checks.

## Data Model

- `customer_recovery_tokens`: id, email_hash, token_hash, expires_at, used_at, created_at, request_ip_hash, user_agent_hash.
- `jobs`: expose customer email hash/hint, receipt email, billing status, and recovery visibility.
- `support_requests`: ticket_id, customer_email_hash, status, topic, public_status_note, updated_at.
- `billing_summary`: derived provider/job view with plan, amount, currency, payment/refund status, receipt email, and portal/support status.

## API Contracts

- `POST /api/recovery/request`: request a short-lived recovery link for an email.
- `POST /api/recovery/jobs`: return safe authorized job summaries for a recovery token.
- `POST /api/billing/summary`: return billing status for an authorized job or recovery token.
- `POST /api/support`: return ticket id and status for accepted support requests.

## Verification Plan

- `node --test tests/recovery.test.mjs tests/billing-summary.test.mjs tests/support-tickets.test.mjs tests/import-confidence.test.mjs tests/failure-matrix.test.mjs`
- `npm run check:pricing`
- `node --test tests/*.test.mjs`
- `npm audit --audit-level=moderate`
- `npm run build`
- `npm run stress:converters`
- `npm run stress:live`
- `npm run stress:checkout`
- `npm run readiness:live`
- `npm run monitor:live` with canonical monitor credentials
- Rendered Playwright checks for desktop/mobile recovery, billing, support, and homepage paths
- Paid drill create/verify/refund, with verify/refund blocked until a human card payment is complete

## Risks

- Recovery links can become weak auth. Mitigation: hash tokens, short TTL, email scope, no source-file access without job token, no raw tokens in logs.
- Billing copy can overclaim. Mitigation: provider-derived status only and clear unavailable states.
- Support can collect sensitive file data. Mitigation: copy warnings, length caps, sanitization, job IDs instead of pasted file contents.
- Stress tests can create live spend. Mitigation: local failure matrix first; guarded live mutation.
