import test from "node:test";
import assert from "node:assert/strict";
import { csvCell, exportBankRows, guardCsvFormula, unguardCsvFormula } from "../functions/lib/accounting-exports.js";
import { parseCsvContent, rowsToCsv } from "../functions/lib/jobs.js";

const hostile = [
  { date: "2026-05-01", description: "=HYPERLINK(\"http://example.invalid\",\"x\")", money_in: "", money_out: 12.5, balance: 100 },
  { date: "2026-05-02", description: "+cmd", money_in: 3, money_out: "", balance: 103 },
  { date: "2026-05-03", description: "-2+3", money_in: 1, money_out: "", balance: 104 },
  { date: "2026-05-04", description: "@SUM(A1:A2)", money_in: 1, money_out: "", balance: 105 },
  { date: "2026-05-05", description: "\tTabbed", money_in: 1, money_out: "", balance: 106 }
];

test("text cells that start with a formula trigger are prefixed with a single quote", () => {
  assert.equal(guardCsvFormula("=1+1"), "'=1+1");
  assert.equal(guardCsvFormula("+cmd"), "'+cmd");
  assert.equal(guardCsvFormula("-2+3"), "'-2+3");
  assert.equal(guardCsvFormula("@SUM(A1)"), "'@SUM(A1)");
  assert.equal(guardCsvFormula("\tx"), "'\tx");
  assert.equal(guardCsvFormula("\rx"), "'\rx");
  assert.equal(guardCsvFormula("+1 555 0100"), "'+1 555 0100");
  assert.equal(csvCell("=1+1"), "'=1+1");
  assert.equal(csvCell('=HYPERLINK("a","b")'), '"\'=HYPERLINK(""a"",""b"")"');
});

test("plain numbers and ordinary text are left untouched", () => {
  assert.equal(guardCsvFormula("-12.50"), "-12.50");
  assert.equal(guardCsvFormula("+12.50"), "+12.50");
  assert.equal(guardCsvFormula("-1,234.56"), "-1,234.56");
  assert.equal(guardCsvFormula("-$25.00"), "-$25.00");
  assert.equal(guardCsvFormula("-.5"), "-.5");
  assert.equal(guardCsvFormula(-12.5), "-12.5");
  assert.equal(guardCsvFormula("Stripe payout"), "Stripe payout");
  assert.equal(guardCsvFormula("2026-05-01"), "2026-05-01");
  assert.equal(guardCsvFormula(""), "");
  assert.equal(guardCsvFormula(null), "");
  assert.equal(guardCsvFormula("'=already"), "'=already");
});

test("every accounting CSV preset guards descriptions but keeps signed amounts numeric", () => {
  for (const format of ["csv", "quickbooks-csv", "xero-csv", "wave-csv", "gnucash-csv"]) {
    const result = exportBankRows(hostile, format);
    assert.equal(result.ok, true, format);
    const body = result.content.split("\n").slice(1).join("\n");
    assert.doesNotMatch(body, /(^|,)"?[=+@\t]/m, format);
    assert.doesNotMatch(body, /(^|,)"?-[^\d.$]/m, format);
    assert.match(body, /'=HYPERLINK/, format);
    assert.match(body, /'-2\+3/, format);
  }
  assert.match(exportBankRows(hostile, "quickbooks-csv").content, /,-12\.50\n/);
  assert.match(exportBankRows(hostile, "xero-csv").content, /2026\/05\/01,-12\.50,/);
});

test("job CSV writer guards cells and the review parser shows the original text", () => {
  const columns = ["date", "description", "amount"];
  const csv = rowsToCsv(
    [
      { date: "2026-05-01", description: "=cmd|'/c calc'!A0", amount: "-12.50" },
      { date: "2026-05-02", description: "Coffee", amount: "-4.00" }
    ],
    columns
  );
  assert.equal(csv, "date,description,amount\n2026-05-01,'=cmd|'/c calc'!A0,-12.50\n2026-05-02,Coffee,-4.00\n");
  const parsed = parseCsvContent(csv);
  assert.equal(parsed.rows[0].description, "=cmd|'/c calc'!A0");
  assert.equal(parsed.rows[0].amount, "-12.50");
  assert.equal(rowsToCsv(parsed.rows, columns), csv);
  assert.equal(unguardCsvFormula("'Tis"), "'Tis");
});
