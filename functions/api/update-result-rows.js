import { bankOutputContentType, bankOutputFileExtension, bankOutputLabel } from "../lib/accounting-exports.js";
import { badRequest, json, methodNotAllowed, serverError } from "../lib/http.js";
import {
  getAuthorizedJob,
  hasRequiredBindings,
  jobOutputFormat,
  rowsToCsv,
  tokenFromBodyOrCookie,
  updateJob
} from "../lib/jobs.js";

const MAX_REVIEW_ROWS = 5000;
const MAX_REVIEW_COLUMNS = 20;
const MAX_CELL_LENGTH = 500;

export function onRequestGet() {
  return methodNotAllowed("POST");
}

export async function onRequestPost({ request, env }) {
  if (!hasRequiredBindings(env)) {
    return serverError("Secure conversion storage is not configured yet.");
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return badRequest("Invalid row update request.");
  }

  const jobId = String(body.jobId || "");
  const bodyToken = String(body.token || "");
  const token = tokenFromBodyOrCookie(request, jobId, bodyToken);
  const job = await getAuthorizedJob(env, jobId, token);
  if (!job) return badRequest("Unknown or expired conversion.");
  if (job.status !== "complete") return badRequest("Generate the full export before saving row edits.");
  if (!job.paid_at && env.FREE_DOWNLOADS_ENABLED !== "true") {
    return json({ error: "Payment is required before editing the full export." }, { status: 402 });
  }
  if (job.converter_id !== "bank") return badRequest("Row editing is available for bank CSV exports.");

  const outputFormat = jobOutputFormat(job);
  if (bankOutputFileExtension(outputFormat) !== "csv") {
    return badRequest(`${bankOutputLabel(outputFormat)} is a bank-feed file. Download and review it in your accounting app.`);
  }

  const columns = normalizeColumns(body.columns);
  const rows = normalizeRows(body.rows, columns);
  if (!columns.length) return badRequest("The edited export needs at least one column.");
  if (!rows.length) return badRequest("The edited export needs at least one row.");

  const csv = rowsToCsv(rows, columns);
  await env.AICONVERTER_BUCKET.put(job.result_key, csv, {
    httpMetadata: { contentType: bankOutputContentType(outputFormat) },
    customMetadata: {
      jobId: job.id,
      purpose: "customer-edited-result-csv",
      deleteAfter: job.expires_at
    }
  });

  const validationReportKey = job.validation_report_key || `jobs/${job.id}/validation-report.txt`;
  await env.AICONVERTER_BUCKET.put(validationReportKey, editedValidationReport(job, outputFormat, rows.length), {
    httpMetadata: { contentType: "text/plain; charset=utf-8" },
    customMetadata: {
      jobId: job.id,
      purpose: "customer-edited-validation-report",
      deleteAfter: job.expires_at
    }
  });

  await updateJob(env, job.id, {
    row_count: rows.length,
    validation_report_key: validationReportKey
  });

  return json({
    status: "complete",
    jobId: job.id,
    outputFormat,
    columns,
    previewRows: rows.slice(0, 5),
    rowCount: rows.length,
    validationReportAvailable: true,
    message: "Saved. The download now uses your edited rows."
  });
}

function normalizeColumns(value) {
  const input = Array.isArray(value) ? value : [];
  return input
    .map((column) => {
      const key = cleanHeader(column?.key || column?.label || "");
      const label = cleanHeader(column?.label || key);
      return key ? { key, label: label || key } : null;
    })
    .filter(Boolean)
    .slice(0, MAX_REVIEW_COLUMNS);
}

function normalizeRows(value, columns) {
  const input = Array.isArray(value) ? value : [];
  return input.slice(0, MAX_REVIEW_ROWS).map((row) =>
    columns.reduce((nextRow, column) => {
      nextRow[column.key] = cleanCell(row?.[column.key]);
      return nextRow;
    }, {})
  );
}

function cleanHeader(value) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, 80);
}

function cleanCell(value) {
  return String(value ?? "").replace(/\r?\n/g, " ").trim().slice(0, MAX_CELL_LENGTH);
}

function editedValidationReport(job, outputFormat, rowCount) {
  return [
    "AI Converter validation report",
    "",
    `Source file: ${job.original_file_name || "uploaded bank statement"}`,
    `Output: ${bankOutputLabel(outputFormat)}`,
    `Rows saved: ${rowCount}`,
    `Edited: ${new Date().toISOString()}`,
    "",
    "Review before import",
    "These rows were edited after the full export was generated. Check balances, duplicates, date range, and account selection inside your accounting app before accepting the import.",
    ""
  ].join("\n");
}
