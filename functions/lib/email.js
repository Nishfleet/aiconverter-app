import { emailHint } from "./customer-identity.js";
import { randomId } from "./jobs.js";

export async function sendRecoveryEmail(env, { email, emailHash, recoveryUrl, tokenId }) {
  const now = new Date().toISOString();
  const provider = env.RESEND_API_KEY && env.RECOVERY_EMAIL_FROM ? "resend" : "queued";
  let status = provider === "resend" ? "sending" : "queued_no_provider";
  let providerId = "";
  let error = "";

  if (provider === "resend") {
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${env.RESEND_API_KEY}`,
          "Idempotency-Key": tokenId
        },
        body: JSON.stringify({
          from: env.RECOVERY_EMAIL_FROM,
          to: [email],
          subject: "Recover your AI Converter jobs",
          text: `Open this private recovery link to view recent AI Converter jobs:\n\n${recoveryUrl}\n\nThe link expires soon. Do not forward it.`,
          html: `<p>Open this private recovery link to view recent AI Converter jobs:</p><p><a href="${escapeHtml(recoveryUrl)}">Recover AI Converter jobs</a></p><p>The link expires soon. Do not forward it.</p>`
        })
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        status = "failed";
        error = payload?.message || "Recovery email could not be sent.";
      } else {
        status = "sent";
        providerId = payload?.id || "";
      }
    } catch (sendError) {
      status = "failed";
      error = sendError?.message || "Recovery email could not be sent.";
    }
  }

  await recordOutboundEmail(env, {
    emailHash,
    emailHint: emailHint(email),
    template: "job_recovery",
    provider,
    providerId,
    status,
    error,
    metadata: { token_id: tokenId, has_provider: provider === "resend" },
    now
  });

  return { provider, status, providerId, error };
}

async function recordOutboundEmail(env, event) {
  if (!env?.AICONVERTER_DB) return;
  try {
    await env.AICONVERTER_DB.prepare(
      `INSERT INTO outbound_email_events (
        id, email_hash, email_hint, template, provider, provider_id, status,
        error, metadata_json, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        randomId("email"),
        event.emailHash || "",
        event.emailHint || "",
        event.template || "",
        event.provider || "",
        event.providerId || "",
        event.status || "",
        String(event.error || "").slice(0, 1000),
        JSON.stringify(event.metadata || {}).slice(0, 4000),
        event.now,
        event.now
      )
      .run();
  } catch {
    // Older local databases may not have the queue table yet; recovery still returns safely.
  }
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => {
    const entities = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
    return entities[char];
  });
}
