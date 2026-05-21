const LABEL_MAX_LENGTH = 80;

export function sanitizeJobLabels(value = {}) {
  const input = typeof value === "string" ? parseJson(value) : value || {};
  return {
    clientLabel: cleanLabel(input.clientLabel),
    periodLabel: cleanLabel(input.periodLabel),
    accountLabel: cleanLabel(input.accountLabel)
  };
}

export function jobLabelFields(labels = {}) {
  const clean = sanitizeJobLabels(labels);
  return {
    client_label: clean.clientLabel,
    period_label: clean.periodLabel,
    account_label: clean.accountLabel
  };
}

export function labelsFromJob(job = {}, fallback = {}) {
  const fallbackLabels = sanitizeJobLabels(fallback);
  return {
    clientLabel: fallbackLabels.clientLabel || cleanLabel(job.client_label),
    periodLabel: fallbackLabels.periodLabel || cleanLabel(job.period_label),
    accountLabel: fallbackLabels.accountLabel || cleanLabel(job.account_label)
  };
}

function cleanLabel(value = "") {
  return String(value || "")
    .replace(/[\r\n\t]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, LABEL_MAX_LENGTH);
}

function parseJson(value) {
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
}
