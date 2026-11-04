# Paid path: checkout, payment webhook, download, redo, refund

A buyer picks a plan, pays on Dodo checkout, and gets the full file. Dodo then calls the payment webhook, which marks the job paid. The buyer can download the result, ask for one redo, and get a refund when the conversion failed. AGENTS.md counts each of these as a separate check: checkout creation alone is not paid-path proof.

## Sub-features

- `paid-checkout` creates a Dodo checkout session for a job (`functions/api/checkout.js`, batch: `batch-checkout.js`).
- `paid-webhook` verifies the Dodo signature and marks the job paid (`functions/api/webhooks/dodo.js`).
- `paid-finalize` runs the full conversion after payment (`functions/api/finalize.js`).
- `paid-download` returns the paid file (`functions/api/download.js`, batch: `batch-download.js`).
- `paid-redo` reruns a paid job once (`functions/api/redo.js`).
- `paid-refund` refunds a failed paid job (admin refund drill: `functions/api/admin/refund-drill.js`).

## How to get to it (user POV)

- On `/`, upload a file, see the free preview, then choose a plan on the pricing card.
- After paying, the browser returns to `/` with the job, and the download button appears.
- The redo and refund paths appear on a finished paid job.

## Driving it with node --test and the live gates

Preconditions:

- `npm ci` has run.
- Nobody pays real money from this harness. The live drills below need the owner's admin credential and are owner-run.

- **Unit proof (any agent).** Run `node --test tests/checkout.test.mjs tests/batch-checkout-flow.test.mjs tests/dodo-webhook.test.mjs tests/job-payment-status.test.mjs tests/download-gate.test.mjs tests/redo-money-gate.test.mjs tests/admin-refund-drill.test.mjs`. Every file ends `# fail 0`.
- **Live readiness (any agent).** Run `npm run readiness:live`. It needs `/api/health` with `ok: true`, `status: "ready"` and `missing: []`. Then run `curl -fsS https://aiconverter.app/api/health | jq .capabilities.dodo.webhookConfigured`. It prints `true`.
- **Live drills (owner only).** `npm run stress:checkout` creates a real checkout session. `node tests/live/paid-drill-live.mjs` drives a payment drill. Both need the admin credential, so an agent reports them as not run.

## Gotchas

- The local Vite preview has no Functions runtime. `/api/checkout` on `127.0.0.1:4180` returns the SPA page with 200. That is not a checkout.
- The webhook test signs with the Standard Webhooks scheme (`webhook-id`, `webhook-timestamp`, `webhook-signature: v1,<base64>`). A signature older than 5 minutes is refused on purpose.
- Drill job ids start with `checkout_drill_`. The success query in AGENTS.md leaves them out, so a drill never counts as a sale.
