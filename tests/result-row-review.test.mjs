import test from "node:test";
import assert from "node:assert/strict";
import { onRequestPost as loadRows } from "../functions/api/result-rows.js";
import { onRequestPost as saveRows } from "../functions/api/update-result-rows.js";
import { sha256 } from "../functions/lib/jobs.js";

test("paid bank CSV export rows can be loaded and saved", async () => {
  const token = "tok_rows";
  const tokenHash = await sha256(token);
  const updates = [];
  const objects = new Map([
    ["jobs/job_rows/result.csv", "Date,Description,Amount\n05/01/2026,Stripe,1000.00\n"]
  ]);
  const job = {
    id: "job_rows",
    token_hash: tokenHash,
    status: "complete",
    paid_at: "2026-05-18T00:00:00.000Z",
    converter_id: "bank",
    output_format: "quickbooks-csv",
    result_key: "jobs/job_rows/result.csv",
    validation_report_key: "jobs/job_rows/validation.txt",
    original_file_name: "statement.pdf",
    expires_at: "2026-05-25T00:00:00.000Z"
  };
  const env = fakeEnv(job, objects, updates);

  const loadResponse = await loadRows({
    env,
    request: new Request("https://aiconverter.app/api/result-rows", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId: job.id, token })
    })
  });
  assert.equal(loadResponse.status, 200);
  const loaded = await loadResponse.json();
  assert.equal(loaded.outputFormat, "quickbooks-csv");
  assert.deepEqual(loaded.columns.map((column) => column.key), ["Date", "Description", "Amount"]);
  assert.equal(loaded.rows[0].Description, "Stripe");

  const saveResponse = await saveRows({
    env,
    request: new Request("https://aiconverter.app/api/update-result-rows", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jobId: job.id,
        token,
        columns: loaded.columns,
        rows: [{ Date: "05/01/2026", Description: "Stripe payout", Amount: "1000.00" }]
      })
    })
  });
  assert.equal(saveResponse.status, 200);
  assert.match(objects.get("jobs/job_rows/result.csv"), /Stripe payout/);
  assert.match(objects.get("jobs/job_rows/validation.txt"), /Rows saved: 1/);
  assert.equal(updates.length, 1);
  assert.equal(updates[0].fields.row_count, 1);
});

test("bank-feed exports do not expose row editor", async () => {
  const token = "tok_ofx";
  const tokenHash = await sha256(token);
  const job = {
    id: "job_ofx",
    token_hash: tokenHash,
    status: "complete",
    paid_at: "2026-05-18T00:00:00.000Z",
    converter_id: "bank",
    output_format: "ofx",
    result_key: "jobs/job_ofx/result.ofx"
  };
  const response = await loadRows({
    env: fakeEnv(job, new Map([["jobs/job_ofx/result.ofx", "OFXHEADER:100\n"]]), []),
    request: new Request("https://aiconverter.app/api/result-rows", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId: job.id, token })
    })
  });
  assert.equal(response.status, 400);
  assert.match((await response.json()).error, /bank-feed file/);
});

test("canonical bank rows load before mapped result CSV and regenerate clean CSV", async () => {
  const token = "tok_canonical_csv";
  const tokenHash = await sha256(token);
  const objects = new Map([
    ["jobs/job_canonical_csv/result.csv", "Date,Description,Money In,Money Out,Balance\n2026-05-01,Old,,1.00,999.00\n"],
    [
      "jobs/job_canonical_csv/extracted-rows.json",
      JSON.stringify({
        rows: [{ date: "2026-05-01", description: "Old", money_in: "", money_out: "1.00", balance: "999.00" }],
        validation: { confidence: 0.91 },
        revision: 1
      })
    ]
  ]);
  const job = paidBankJob({ id: "job_canonical_csv", tokenHash, outputFormat: "csv" });
  const env = fakeEnv(job, objects, []);

  const loadResponse = await loadRows({
    env,
    request: jsonRequest("/api/result-rows", { jobId: job.id, token })
  });
  const loaded = await loadResponse.json();
  assert.equal(loadResponse.status, 200);
  assert.deepEqual(loaded.columns.map((column) => column.key), ["date", "description", "money_in", "money_out", "balance", "review_note"]);

  const saveResponse = await saveRows({
    env,
    request: jsonRequest("/api/update-result-rows", {
      jobId: job.id,
      token,
      columns: loaded.columns,
      rows: [{ date: "2026-05-01", description: "Corrected deposit", money_in: "1000.00", money_out: "", balance: "1000.00" }]
    })
  });
  assert.equal(saveResponse.status, 200);
  assert.match(objects.get("jobs/job_canonical_csv/result.csv"), /Money In,Money Out,Balance/);
  assert.match(objects.get("jobs/job_canonical_csv/result.csv"), /Corrected deposit,1000\.00,,1000\.00/);
  assert.match(objects.get("jobs/job_canonical_csv/row-corrections.json"), /Corrected deposit/);
  assert.match(objects.get("jobs/job_canonical_csv/validation.txt"), /Edited row review/);
});

test("canonical bank row edits regenerate QuickBooks and Xero export shapes", async () => {
  for (const outputFormat of ["quickbooks-csv", "xero-csv"]) {
    const token = `tok_${outputFormat}`;
    const tokenHash = await sha256(token);
    const id = `job_${outputFormat.replaceAll("-", "_")}`;
    const objects = new Map([
      [`jobs/${id}/result.csv`, "placeholder\n"],
      [
        `jobs/${id}/extracted-rows.json`,
        JSON.stringify({
          rows: [{ date: "2026-05-02", description: "Coffee Shop", money_in: "", money_out: "4.50", balance: "995.50" }],
          validation: { confidence: 0.94 },
          revision: 1
        })
      ]
    ]);
    const job = paidBankJob({ id, tokenHash, outputFormat });

    const response = await saveRows({
      env: fakeEnv(job, objects, []),
      request: jsonRequest("/api/update-result-rows", {
        jobId: id,
        token,
        columns: [],
        rows: [{ date: "2026-05-02", description: "Coffee Shop corrected", money_in: "", money_out: "4.50", balance: "995.50" }]
      })
    });

    assert.equal(response.status, 200);
    const csv = objects.get(`jobs/${id}/result.csv`);
    if (outputFormat === "quickbooks-csv") {
      assert.match(csv, /^Date,Description,Amount/m);
      assert.match(csv, /Coffee Shop corrected,-4\.50/);
    } else {
      assert.match(csv, /^Date,Amount,Payee,Description,Reference/m);
      assert.match(csv, /Coffee Shop corrected/);
    }
  }
});

test("inline row editor refuses to save truncated large exports", async () => {
  const token = "tok_large_rows";
  const tokenHash = await sha256(token);
  const csv = [
    "Date,Description,Amount",
    ...Array.from({ length: 5001 }, (_, index) => `05/01/2026,Row ${index + 1},1.00`)
  ].join("\n");
  const objects = new Map([["jobs/job_large/result.csv", `${csv}\n`]]);
  const job = {
    id: "job_large",
    token_hash: tokenHash,
    status: "complete",
    paid_at: "2026-05-18T00:00:00.000Z",
    converter_id: "bank",
    output_format: "quickbooks-csv",
    result_key: "jobs/job_large/result.csv",
    original_file_name: "large-statement.pdf",
    expires_at: "2026-05-25T00:00:00.000Z"
  };

  const response = await saveRows({
    env: fakeEnv(job, objects, []),
    request: new Request("https://aiconverter.app/api/update-result-rows", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jobId: job.id,
        token,
        columns: [
          { key: "Date", label: "Date" },
          { key: "Description", label: "Description" },
          { key: "Amount", label: "Amount" }
        ],
        rows: [{ Date: "05/01/2026", Description: "Only one row", Amount: "1.00" }]
      })
    })
  });

  assert.equal(response.status, 400);
  assert.match((await response.json()).error, /more than 5000 rows/);
  assert.match(objects.get("jobs/job_large/result.csv"), /Row 5001/);
});

function fakeEnv(job, objects, updates) {
  return {
    AICONVERTER_BUCKET: {
      get: async (key) =>
        objects.has(key)
          ? {
              text: async () => objects.get(key),
              arrayBuffer: async () => new TextEncoder().encode(objects.get(key)).buffer
            }
          : null,
      put: async (key, value) => {
        objects.set(key, String(value));
      }
    },
    AICONVERTER_DB: {
      prepare(sql) {
        if (sql.startsWith("SELECT * FROM jobs")) {
          return {
            bind(id, hash) {
              return {
                first: async () => (id === job.id && hash === job.token_hash ? job : null)
              };
            }
          };
        }
        if (sql.startsWith("UPDATE jobs SET")) {
          return {
            bind(...values) {
              return {
                run: async () => {
                  const fields = {};
                  const assignments = sql.match(/SET (.*) WHERE/)?.[1]?.split(", ") || [];
                  assignments.forEach((assignment, index) => {
                    const key = assignment.split(" = ")[0];
                    if (key !== "updated_at") fields[key] = values[index];
                  });
                  updates.push({ sql, values, fields });
                }
              };
            }
          };
        }
        throw new Error(`Unexpected SQL: ${sql}`);
      }
    }
  };
}

function paidBankJob({ id, tokenHash, outputFormat }) {
  return {
    id,
    token_hash: tokenHash,
    status: "complete",
    paid_at: "2026-05-18T00:00:00.000Z",
    converter_id: "bank",
    output_format: outputFormat,
    result_key: `jobs/${id}/result.csv`,
    validation_report_key: `jobs/${id}/validation.txt`,
    original_file_name: "statement.pdf",
    expires_at: "2026-05-25T00:00:00.000Z",
    confidence: 0.92,
    accounting_metadata_json: JSON.stringify({ dateFormat: "MM/DD/YYYY" })
  };
}

function jsonRequest(path, body) {
  return new Request(`https://aiconverter.app${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
}
