import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));

export const FAILURE_MATRIX = [
  {
    component: "Secure config and upload gate",
    failureMode: "Missing bindings, Turnstile failure, oversized files, invalid page estimate",
    evidence: ["tests/turnstile-api.test.mjs", "tests/turnstile-ui-regression.test.mjs", "tests/page-limit.test.mjs"]
  },
  {
    component: "Preview extraction",
    failureMode: "Parser/OCR failure, low confidence, private corpus regressions",
    evidence: ["tests/validate-statement.test.mjs", "tests/fixture-corpus.test.mjs", "scripts/private-corpus.mjs"]
  },
  {
    component: "Live pricing",
    failureMode: "Dodo price fetch failure, stale hardcoded fallback, checkout should pause",
    evidence: ["tests/pricing-truth.test.mjs", "scripts/check-pricing.mjs", "tests/preview-ui-regression.test.mjs"]
  },
  {
    component: "Checkout",
    failureMode: "Checkout creation failure, duplicate payment reuse, batch checkout mismatch",
    evidence: ["tests/checkout.test.mjs", "tests/batch-checkout-flow.test.mjs", "scripts/stress-checkout-live.mjs"]
  },
  {
    component: "Dodo webhooks and payment restore",
    failureMode: "Webhook replay, payment mismatch, cancelled or failed payment status",
    evidence: ["tests/job-payment-status.test.mjs", "tests/dodo-adaptive-currency.test.mjs", "tests/admin-checkout-drill.test.mjs"]
  },
  {
    component: "Finalize and download",
    failureMode: "Paid job cannot finalize, result object missing, expired result",
    evidence: ["tests/checkout.test.mjs", "tests/batch-download.test.mjs", "scripts/paid-drill-live.mjs"]
  },
  {
    component: "Redo and refund",
    failureMode: "Redo unavailable after source deletion, refund or credit status not recorded",
    evidence: ["tests/admin-refund-drill.test.mjs", "tests/delete-job.test.mjs", "scripts/drill-failover-live.mjs"]
  },
  {
    component: "Row review and accounting exports",
    failureMode: "Edited rows dropped, validation report missing, import confidence unclear",
    evidence: ["tests/result-row-review.test.mjs", "tests/accounting-exports.test.mjs", "tests/import-confidence.test.mjs"]
  },
  {
    component: "Bookkeeper batch workflow",
    failureMode: "ZIP labels missing, queued jobs lose client or period context",
    evidence: ["tests/job-labels.test.mjs", "tests/batch-download.test.mjs", "public/bank-statement-converter-for-bookkeepers/index.md"]
  },
  {
    component: "Self-serve recovery",
    failureMode: "Lost conversion link, expired recovery token, wrong email job leakage",
    evidence: ["tests/recovery.test.mjs", "functions/api/recovery/request.js", "functions/api/recovery/jobs.js"]
  },
  {
    component: "Billing summary",
    failureMode: "Receipt email, refund, invoice, or support path missing after payment",
    evidence: ["tests/billing-summary.test.mjs", "functions/api/billing/summary.js", "functions/lib/dodo.js"]
  },
  {
    component: "Support status",
    failureMode: "Support request has no ticket ID, topic, customer hash, or public status",
    evidence: ["tests/support-tickets.test.mjs", "functions/api/support.js", "public/support/index.html"]
  },
  {
    component: "Provider fallback",
    failureMode: "CloudConvert or Convertio job stuck, failover not visible",
    evidence: ["tests/generic-converters.test.mjs", "tests/stack-failsafe-regression.test.mjs", "scripts/drill-failover-live.mjs"]
  },
  {
    component: "Admin and monitoring",
    failureMode: "No funnel, health, readiness, or monitor signal for production support",
    evidence: ["tests/admin-funnel-overview.test.mjs", "scripts/monitor-live.mjs", "scripts/readiness-live.mjs"]
  },
  {
    component: "Rendered UI and static SEO",
    failureMode: "Missing self-serve UI, broken crawlable pages, stale agent-readable truth",
    evidence: ["tests/preview-ui-regression.test.mjs", "tests/seo-static-regression.test.mjs", "public/llms.txt"]
  },
  {
    component: "Live stress",
    failureMode: "Production routes fail under repeated preview/readiness/converter checks",
    evidence: ["scripts/stress-converters.mjs", "scripts/stress-live.mjs", "scripts/upload-preview-live.mjs"]
  }
];

export function validateFailureMatrix() {
  return FAILURE_MATRIX.map((item) => {
    const missing = item.evidence.filter((relativePath) => !existsSync(join(root, relativePath)));
    const empty = item.evidence.filter((relativePath) => {
      const absolutePath = join(root, relativePath);
      return existsSync(absolutePath) && !readFileSync(absolutePath, "utf8").trim();
    });
    return { ...item, missing, empty, ok: missing.length === 0 && empty.length === 0 };
  });
}

function printMatrix(results) {
  for (const item of results) {
    const status = item.ok ? "PASS" : "FAIL";
    console.log(`${status} ${item.component}`);
    console.log(`  Failure mode: ${item.failureMode}`);
    console.log(`  Evidence: ${item.evidence.join(", ")}`);
    if (item.missing.length) console.log(`  Missing: ${item.missing.join(", ")}`);
    if (item.empty.length) console.log(`  Empty: ${item.empty.join(", ")}`);
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] || "").href) {
  const results = validateFailureMatrix();
  if (process.argv.includes("--json")) {
    console.log(JSON.stringify(results, null, 2));
  } else {
    printMatrix(results);
  }
  if (results.some((item) => !item.ok)) process.exit(1);
}
