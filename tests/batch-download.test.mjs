import test from "node:test";
import assert from "node:assert/strict";
import { onRequestPost as batchDownload } from "../functions/api/batch-download.js";
import { sha256 } from "../functions/lib/jobs.js";

test("batch ZIP includes available exports and skips expired selections", async () => {
  const token = "tok_batch";
  const tokenHash = await sha256(token);
  const jobs = new Map([
    [
      "job_batch_1",
      {
        id: "job_batch_1",
        token_hash: tokenHash,
        status: "complete",
        paid_at: "2026-05-18T00:00:00.000Z",
        converter_id: "bank",
        output_format: "quickbooks-csv",
        result_key: "jobs/job_batch_1/result.csv",
        validation_report_key: "jobs/job_batch_1/validation.txt",
        original_file_name: "May Statement.pdf",
        expires_at: "2026-05-25T00:00:00.000Z",
        download_count: 0
      }
    ]
  ]);
  const objects = new Map([
    ["jobs/job_batch_1/result.csv", "Date,Description,Amount\n05/01/2026,Stripe,100.00\n"],
    ["jobs/job_batch_1/validation.txt", "AI Converter validation report\n"]
  ]);

  const response = await batchDownload({
    env: fakeEnv(jobs, objects),
    request: new Request("https://aiconverter.app/api/batch-download", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jobs: [
          { jobId: "job_batch_1", token },
          { jobId: "job_expired", token: "missing" }
        ]
      })
    })
  });

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-type"), "application/zip");
  const zipText = new TextDecoder().decode(await response.arrayBuffer());
  assert.match(zipText, /exports\/aiconverter-May-Statement-quickbooks\.csv/);
  assert.match(zipText, /reports\/aiconverter-May-Statement-validation-report\.txt/);
  assert.match(zipText, /job_expired: skipped, unknown or expired/);
  assert.equal(jobs.get("job_batch_1").download_count, 1);
});

test("batch ZIP groups labeled bookkeeper exports by sanitized client folders", async () => {
  const token = "tok_labeled_batch";
  const tokenHash = await sha256(token);
  const jobs = new Map([
    [
      "job_labeled_1",
      {
        id: "job_labeled_1",
        token_hash: tokenHash,
        status: "complete",
        paid_at: "2026-05-18T00:00:00.000Z",
        converter_id: "bank",
        output_format: "xero-csv",
        result_key: "jobs/job_labeled_1/result.csv",
        validation_report_key: "jobs/job_labeled_1/validation.txt",
        original_file_name: "April Statement.pdf",
        expires_at: "2026-05-25T00:00:00.000Z",
        download_count: 0
      }
    ]
  ]);
  const objects = new Map([
    ["jobs/job_labeled_1/result.csv", "Date,Amount,Payee,Description,Reference\n2026/04/01,100.00,Stripe,Stripe,ref\n"],
    ["jobs/job_labeled_1/validation.txt", "AI Converter validation report\n"]
  ]);

  const response = await batchDownload({
    env: fakeEnv(jobs, objects),
    request: new Request("https://aiconverter.app/api/batch-download", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jobs: [
          {
            jobId: "job_labeled_1",
            token,
            clientLabel: "Acme / India",
            periodLabel: "2026-04",
            accountLabel: "Checking 1234"
          }
        ]
      })
    })
  });

  assert.equal(response.status, 200);
  const zipText = new TextDecoder().decode(await response.arrayBuffer());
  assert.match(zipText, /clients\/Acme-India\/2026-04\/Checking-1234\/exports\/aiconverter-April-Statement-xero\.csv/);
  assert.match(zipText, /clients\/Acme-India\/2026-04\/Checking-1234\/reports\/aiconverter-April-Statement-validation-report\.txt/);
  assert.match(zipText, /April Statement\.pdf: included as clients\/Acme-India\/2026-04\/Checking-1234\/exports/);
});

test("batch ZIP uses persisted job labels when request labels are missing", async () => {
  const token = "tok_persisted_labels";
  const tokenHash = await sha256(token);
  const jobs = new Map([
    [
      "job_persisted_labels",
      {
        id: "job_persisted_labels",
        token_hash: tokenHash,
        status: "complete",
        paid_at: "2026-05-18T00:00:00.000Z",
        converter_id: "bank",
        output_format: "google-sheets-csv",
        result_key: "jobs/job_persisted_labels/result.csv",
        validation_report_key: "",
        original_file_name: "May Checking.pdf",
        expires_at: "2026-05-25T00:00:00.000Z",
        client_label: "Client Books",
        period_label: "2026-05",
        account_label: "Operating"
      }
    ]
  ]);
  const objects = new Map([
    ["jobs/job_persisted_labels/result.csv", "Date,Description,Money In,Money Out,Balance\n2026-05-01,Deposit,100.00,,100.00\n"]
  ]);

  const response = await batchDownload({
    env: fakeEnv(jobs, objects),
    request: new Request("https://aiconverter.app/api/batch-download", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobs: [{ jobId: "job_persisted_labels", token }] })
    })
  });

  assert.equal(response.status, 200);
  const zipText = new TextDecoder().decode(await response.arrayBuffer());
  assert.match(zipText, /clients\/Client-Books\/2026-05\/Operating\/exports\/aiconverter-May-Checking-google-sheets\.csv/);
});

function fakeEnv(jobs, objects) {
  return {
    AICONVERTER_BUCKET: {
      get: async (key) =>
        objects.has(key)
          ? {
              text: async () => objects.get(key),
              arrayBuffer: async () => new TextEncoder().encode(objects.get(key)).buffer
            }
          : null
    },
    AICONVERTER_DB: {
      prepare(sql) {
        if (sql.startsWith("SELECT * FROM jobs WHERE id = ? AND token_hash = ?")) {
          return {
            bind(id, tokenHash) {
              return {
                first: async () => {
                  const job = jobs.get(id);
                  return job && tokenHash === job.token_hash ? job : null;
                }
              };
            }
          };
        }
        if (sql.startsWith("UPDATE jobs SET")) {
          return {
            bind(...values) {
              return {
                run: async () => {
                  const assignments = sql.match(/SET (.*) WHERE/)?.[1]?.split(", ") || [];
                  const id = values.at(-1);
                  const job = jobs.get(id) || {};
                  assignments.forEach((assignment, index) => {
                    const key = assignment.split(" = ")[0];
                    if (key !== "updated_at") job[key] = values[index];
                  });
                  jobs.set(id, job);
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
