import { bankOutputFileExtension, bankOutputLabel } from "../lib/accounting-exports.js";
import { badRequest, json, methodNotAllowed, serverError } from "../lib/http.js";
import {
  getAuthorizedJob,
  hasRequiredBindings,
  jobOutputFormat,
  parseCsvContent,
  tokenFromBodyOrCookie
} from "../lib/jobs.js";

const MAX_REVIEW_ROWS = 5000;
const TABLE_CONVERTERS = new Set(["screenshot", "receipt", "invoice"]);

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
    return badRequest("Invalid row review request.");
  }

  const jobId = String(body.jobId || "");
  const bodyToken = String(body.token || "");
  const token = tokenFromBodyOrCookie(request, jobId, bodyToken);
  const job = await getAuthorizedJob(env, jobId, token);
  if (!job) return badRequest("Unknown or expired conversion.");
  if (job.status !== "complete") return badRequest("Generate the full export before reviewing rows.");
  if (!job.paid_at && env.FREE_DOWNLOADS_ENABLED !== "true") {
    return json({ error: "Payment is required before reviewing the full export." }, { status: 402 });
  }
  const converterId = job.converter_id;
  if (converterId !== "bank" && !TABLE_CONVERTERS.has(converterId)) {
    return badRequest("Row review is available for bank, table, receipt and invoice CSV exports.");
  }

  const outputFormat = jobOutputFormat(job);
  if (converterId === "bank" && bankOutputFileExtension(outputFormat) !== "csv") {
    return badRequest(`${bankOutputLabel(outputFormat)} is a bank-feed file. Download and review it in your accounting app.`);
  }
  if (converterId !== "bank" && outputFormat !== "csv") {
    return badRequest("Rows are only available for CSV exports.");
  }

  const object = await env.AICONVERTER_BUCKET.get(job.result_key);
  if (!object) return badRequest("The converted file has expired.");

  const parsed = parseCsvContent(await object.text(), MAX_REVIEW_ROWS);
  return json({
    jobId: job.id,
    outputFormat,
    outputLabel: converterId === "bank" ? bankOutputLabel(outputFormat) : "CSV",
    columns: parsed.columns,
    rows: parsed.rows,
    totalRows: parsed.totalRows,
    truncated: parsed.truncated,
    maxRows: MAX_REVIEW_ROWS
  });
}
