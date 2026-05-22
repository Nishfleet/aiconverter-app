# Quickstart: 11/10 Self-Serve SaaS Completion

## Local Checks

```bash
npm run check:pricing
node --test tests/recovery.test.mjs tests/billing-summary.test.mjs tests/support-tickets.test.mjs tests/import-confidence.test.mjs tests/failure-matrix.test.mjs
node --test tests/*.test.mjs
npm audit --audit-level=moderate
npm run build
npm run stress:converters
```

## Live-Safe Checks

```bash
npm run readiness:live
npm run stress:live
npm run monitor:live
npm run stress:checkout
```

## Paid Proof Boundary

```bash
npm run drill:paid create
```

After a human/operator completes the checkout:

```bash
PAID_DRILL_JOB_ID=... PAID_DRILL_JOB_TOKEN=... npm run drill:paid verify
PAID_DRILL_JOB_ID=... PAID_DRILL_JOB_TOKEN=... npm run drill:paid refund
```
