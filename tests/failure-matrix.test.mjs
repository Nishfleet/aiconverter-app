import test from "node:test";
import assert from "node:assert/strict";
import { FAILURE_MATRIX, validateFailureMatrix } from "../scripts/failure-matrix.mjs";

test("failure matrix covers every self-serve SaaS critical path", () => {
  const componentNames = FAILURE_MATRIX.map((item) => item.component).join("\n");
  for (const expected of [
    "Secure config and upload gate",
    "Preview extraction",
    "Live pricing",
    "Checkout",
    "Dodo webhooks and payment restore",
    "Finalize and download",
    "Redo and refund",
    "Row review and accounting exports",
    "Bookkeeper batch workflow",
    "Self-serve recovery",
    "Billing summary",
    "Support status",
    "Provider fallback",
    "Admin and monitoring",
    "Rendered UI and static SEO",
    "Live stress"
  ]) {
    assert.match(componentNames, new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});

test("failure matrix evidence files exist and are not empty", () => {
  const results = validateFailureMatrix();
  const failures = results.filter((item) => !item.ok);
  assert.deepEqual(
    failures.map((item) => ({ component: item.component, missing: item.missing, empty: item.empty })),
    []
  );
});
