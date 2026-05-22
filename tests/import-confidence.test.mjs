import test from "node:test";
import assert from "node:assert/strict";
import { buildValidationReport } from "../functions/lib/accounting-exports.js";

test("validation report reads as an import-confidence report", () => {
  const report = buildValidationReport(
    [
      { date: "2026-05-01", description: "Opening deposit", money_in: "1000.00", money_out: "", balance: "1000.00", confidence: 0.98 },
      { date: "2026-05-02", description: "Coffee", money_in: "", money_out: "4.50", balance: "995.50", confidence: 0.95 }
    ],
    {
      sourceFileName: "statement.pdf",
      format: "quickbooks-csv",
      validation: {
        confidence: 0.96,
        checks: {
          dateCoverage: { valid: 2 },
          amountCoverage: { valid: 2 },
          runningBalance: { checked: 1, matched: 1 }
        }
      }
    }
  );

  assert.match(report, /AI Converter validation report/);
  assert.match(report, /Rows extracted: 2/);
  assert.match(report, /Confidence score: 96%/);
  assert.match(report, /Import readiness: ready for review before import/);
  assert.match(report, /Balance check: no obvious issue found \(1\/1 checked rows matched\)/);
  assert.match(report, /Review before import/);
});
