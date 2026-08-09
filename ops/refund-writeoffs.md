# Refund Write-Off Decisions

This file is the durable record of refunds the operator has explicitly decided
to write off instead of paying out. A write-off is recorded only after the
operator acknowledges the reason with the literal `WRITE-OFF` token through the
admin endpoint below, and it lands as a `written_off` row in `dodo_refund_events`
plus a `written_off` status on the job so the live admin alert stops firing.

## Tooling

- Refund retry: `POST /api/admin/refund-drill` with `{ jobId, confirmJobId }`.
- Write-off: same endpoint with `{ jobId, confirmJobId, writeOff: true, reason }`
  where `reason` must contain `WRITE-OFF` (explicit operator acknowledgment).
  Only `checkout_drill_*` jobs in `refund_due`/`credit_due` can be written off.

## Decision 2026-08-10: ₹299 operator drill refund written off

- Job: `checkout_drill_e0406ef6fa9d442bba8ffb73d2e1f13f`
- Payment: `pay_0Nf62770HL6D5D5zJUVgd` (Dodo, starter plan, ₹299.00 INR = 29900 paise, succeeded 2026-05-18)
- Reason recorded in Dodo: "Operator write-off decision; no cash refund."
- Decision status: recorded in this file and in the codebase (admin write-off
  action on `/api/admin/refund-drill`). The D1 rows below are applied by the
  operator through that endpoint once the tooling is deployed; until then the
  job stays in `refund_due` and the live warning keeps firing by design.
- D1 rows written by the write-off action:
  - `jobs.refund_status = 'written_off'` on the job,
  - an audit event row `status = 'written_off'` in `dodo_refund_events`,
  - a `refund` attempt row `status = 'written_off'` in `job_attempts`.

### Why

- The Dodo cash refund was attempted five times — 2026-05-18 ×3, 2026-05-21,
  and a final operator retry 2026-08-09 — and every attempt was rejected by
  Dodo with "Insufficient funds in wallet". The wallet has not held ₹299 for
  three months, so the refund could not be executed through normal tooling.
- The payment is operator-owned drill money (admin-drill@aiconverter.app,
  checkout-drill-statement.pdf), not a customer obligation. The drill already
  proved the checkout, webhook, paid finalize, download, and redo legs plus the
  refund-due handling; the remaining leg is a cash payout that needs wallet
  funds that were never added.
- Topping up the Dodo wallet solely to refund the operator's own ₹299 drill
  payment is not worth the accounting effort, so the explicit decision is to
  write the refund off.

### Effect on live behavior

Once the write-off action has been applied (see above), the admin
"Drill refund retry needed" warning stops firing for this job because
`refund_status` is `written_off`, which the refund-due overview query does not
select. The audit trail stays complete: `dodo_refund_events` keeps every failed
attempt row (with the Dodo error) plus the `written_off` decision row.

### Re-opening

If the Dodo wallet is ever funded and the operator wants the cash back anyway:
reset the job to `refund_due` (or `credit_due`) and run the refund retry through
`POST /api/admin/refund-drill`. The payment is still refundable at Dodo; nothing
about this decision blocks that path.
