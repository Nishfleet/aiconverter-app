# Research: 11/10 Self-Serve SaaS Completion

## Decision: Use email-scoped recovery before full accounts

**Rationale**: Email recovery fixes lost links, abandoned checkout, and repeat-buyer confidence without adding password auth, OAuth, team RBAC, or permanent storage too early.

## Decision: Billing summaries are derived from provider/job state

**Rationale**: Dodo remains the payment source of truth. Customer-facing billing should show what is actually known: plan, amount, currency, payment id, checkout session, receipt email, refund status, and support fallback.

## Decision: Support becomes ticketed but not CRM-backed

**Rationale**: Ticket IDs and statuses give customers a durable state without adding a third-party CRM or exposing sensitive file contents.

## Decision: Import confidence is a reportable product surface

**Rationale**: Bank-statement buyers need confidence before import. Existing validation logic should become visible proof: balance continuity, duplicate checks, date/amount coverage, confidence, and import-readiness.

## Decision: Stress testing is split into local failure matrix and live-safe checks

**Rationale**: Local failure tests can hammer edge cases without provider spend. Live checks prove production health, pricing, monitor, checkout handoff, and rendering without destructive customer/provider effects.
