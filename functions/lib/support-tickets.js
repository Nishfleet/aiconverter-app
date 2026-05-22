import { customerEmailHash, emailHint, normalizeCustomerEmail } from "./customer-identity.js";
import { randomId } from "./jobs.js";

const STATUSES = new Set(["open", "triaged", "waiting_customer", "waiting_provider", "resolved", "closed", "spam"]);

export function supportTicketId(now = new Date(), entropy = randomId("ticket")) {
  const day = now.toISOString().slice(0, 10).replaceAll("-", "");
  const suffix = String(entropy).replace(/[^a-zA-Z0-9]/g, "").slice(-6).toUpperCase().padStart(6, "0");
  return `AIC-${day}-${suffix}`;
}

export function sanitizeSupportTopic(value = "other") {
  const topic = String(value || "other").trim().toLowerCase();
  return ["conversion", "payment", "refund", "deletion", "security", "other"].includes(topic) ? topic : "other";
}

export function sanitizeSupportMessage(value = "") {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, 4000);
}

export function publicStatusNote(status = "open") {
  const notes = {
    open: "Received and waiting for review.",
    triaged: "Reviewed and routed to the right queue.",
    waiting_customer: "Waiting for customer details.",
    waiting_provider: "Waiting on payment or conversion provider status.",
    resolved: "Resolved.",
    closed: "Closed.",
    spam: "Closed as spam."
  };
  return notes[status] || notes.open;
}

export async function supportCasesForCustomer(env, { emailHash = "", jobIds = [] }) {
  if (!env?.AICONVERTER_DB || (!emailHash && !jobIds.length)) return [];
  try {
    const cases = [];
    if (emailHash) {
      const result = await env.AICONVERTER_DB.prepare(
        `SELECT id, ticket_id, job_id, category, topic, status, public_status_note, created_at, updated_at
         FROM support_requests
         WHERE customer_email_hash = ?
         ORDER BY created_at DESC
         LIMIT 20`
      )
        .bind(emailHash)
        .all();
      cases.push(...(result.results || []));
    }
    for (const jobId of jobIds.slice(0, 20)) {
      const result = await env.AICONVERTER_DB.prepare(
        `SELECT id, ticket_id, job_id, category, topic, status, public_status_note, created_at, updated_at
         FROM support_requests
         WHERE job_id = ?
         ORDER BY created_at DESC
         LIMIT 10`
      )
        .bind(jobId)
        .all();
      cases.push(...(result.results || []));
    }
    const seen = new Set();
    return cases
      .filter((item) => {
        const key = item.ticket_id || item.id;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .map(publicSupportCase);
  } catch {
    return [];
  }
}

export function publicSupportCase(row = {}) {
  const status = STATUSES.has(row.status) ? row.status : "open";
  return {
    id: row.id || "",
    ticketId: row.ticket_id || row.id || "",
    jobId: row.job_id || "",
    topic: row.topic || row.category || "other",
    status,
    statusNote: row.public_status_note || publicStatusNote(status),
    createdAt: row.created_at || "",
    updatedAt: row.updated_at || row.created_at || ""
  };
}

export async function supportCustomerFields(env, email = "") {
  const normalized = normalizeCustomerEmail(email);
  return {
    email: normalized,
    emailHash: normalized ? await customerEmailHash(env, normalized) : "",
    emailHint: normalized ? emailHint(normalized) : ""
  };
}
