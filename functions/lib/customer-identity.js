import { sha256 } from "./jobs.js";

export function normalizeCustomerEmail(email = "") {
  return String(email || "").trim().toLowerCase().slice(0, 160);
}

export function isValidCustomerEmail(email = "") {
  const normalized = normalizeCustomerEmail(email);
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized);
}

export async function customerEmailHash(env, email = "") {
  const normalized = normalizeCustomerEmail(email);
  if (!normalized) return "";
  return sha256(`${customerEmailSalt(env)}:email:${normalized}`);
}

export function emailHint(email = "") {
  const normalized = normalizeCustomerEmail(email);
  const [local, domain] = normalized.split("@");
  if (!local || !domain) return "";
  const first = local.slice(0, 1);
  const last = local.length > 2 ? local.slice(-1) : "";
  return `${first}${"*".repeat(Math.max(2, Math.min(6, local.length - 1)))}${last}@${domain}`;
}

function customerEmailSalt(env = {}) {
  return String(env.CUSTOMER_EMAIL_SALT || env.RATE_LIMIT_SALT || "aiconverter-local-customer-email-salt").trim();
}
