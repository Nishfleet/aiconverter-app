export const BANK_REVIEW_COLUMNS = [
  { key: "date", label: "Date" },
  { key: "description", label: "Description" },
  { key: "money_in", label: "Money In" },
  { key: "money_out", label: "Money Out" },
  { key: "balance", label: "Balance" },
  { key: "review_note", label: "Review Note" }
];

const MAX_CELL_LENGTH = 500;

export function bankRowsArtifactKey(jobId, kind = "extracted") {
  const safeId = String(jobId || "").replace(/[^a-zA-Z0-9_-]/g, "");
  const names = {
    preview: "extracted-preview-rows.json",
    extracted: "extracted-rows.json",
    corrected: "row-corrections.json"
  };
  return `jobs/${safeId}/${names[kind] || names.extracted}`;
}

export async function storeBankRowsArtifact(env, job, rows, options = {}) {
  if (!env?.AICONVERTER_BUCKET || !job?.id || !Array.isArray(rows)) return "";
  const kind = options.kind || "extracted";
  const key = bankRowsArtifactKey(job.id, kind);
  const payload = {
    schema: "aiconverter.bankRows.v1",
    kind,
    jobId: job.id,
    outputFormat: options.outputFormat || job.output_format || "csv",
    sourceFileName: options.sourceFileName || job.original_file_name || "uploaded bank statement",
    rows: normalizeCanonicalBankRows(rows),
    validation: options.validation || {},
    revision: Number(options.revision || 1),
    corrected: kind === "corrected",
    createdAt: options.createdAt || new Date().toISOString()
  };
  await env.AICONVERTER_BUCKET.put(key, JSON.stringify(payload, null, 2), {
    httpMetadata: { contentType: "application/json; charset=utf-8" },
    customMetadata: {
      jobId: job.id,
      purpose: `bank-${kind}-rows`,
      deleteAfter: job.expires_at || ""
    }
  });
  return key;
}

export async function readBankRowsArtifact(env, job, kinds = ["corrected", "extracted"]) {
  if (!env?.AICONVERTER_BUCKET || !job?.id) return null;
  for (const kind of kinds) {
    const key = bankRowsArtifactKey(job.id, kind);
    const object = await env.AICONVERTER_BUCKET.get(key).catch(() => null);
    if (!object) continue;
    try {
      const payload = JSON.parse(await object.text());
      const rows = normalizeCanonicalBankRows(payload.rows || []);
      if (rows.length) return { ...payload, key, kind, rows };
    } catch {
      continue;
    }
  }
  return null;
}

export function normalizeCanonicalBankRows(rows) {
  return (Array.isArray(rows) ? rows : [])
    .map((row) => ({
      date: cleanCell(row.date),
      description: cleanCell(row.description),
      money_in: cleanMoneyCell(row.money_in ?? row.moneyIn ?? row.deposit),
      money_out: cleanMoneyCell(row.money_out ?? row.moneyOut ?? row.withdrawal),
      balance: cleanMoneyCell(row.balance),
      review_note: cleanCell(row.review_note ?? row.reviewNote)
    }))
    .filter((row) => row.date || row.description || row.money_in || row.money_out || row.balance);
}

export function canonicalRowsFromReviewRows(rows) {
  return normalizeCanonicalBankRows(rows);
}

function cleanCell(value) {
  return String(value ?? "").replace(/\r?\n/g, " ").trim().slice(0, MAX_CELL_LENGTH);
}

function cleanMoneyCell(value) {
  const text = cleanCell(value);
  if (!text) return "";
  return text.replace(/[^\d.,()\-+]/g, "").trim();
}
