import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

loadLocalMonitorEnv();

const baseUrl = process.env.AICONVERTER_MONITOR_URL || process.env.AICONVERTER_STRESS_URL || "https://aiconverter.app";
const adminToken =
  process.env.AICONVERTER_MONITOR_ADMIN_TOKEN || process.env.AICONVERTER_ADMIN_TOKEN || process.env.ADMIN_TOKEN || "";
const publicOnly = process.env.AICONVERTER_MONITOR_PUBLIC_ONLY === "true";
const strictWarnings = process.env.AICONVERTER_MONITOR_STRICT === "true" || process.argv.includes("--strict");

const failures = [];
const warnings = [];
const started = Date.now();

const health = await checkHealth();
const overview = adminToken ? await checkAdminOverview(adminToken) : null;
if (!adminToken) {
  const missingAdmin = { check: "admin-overview", status: "skipped", reason: "admin token not configured" };
  if (publicOnly) warnings.push(missingAdmin);
  else failures.push(missingAdmin);
}
const monitorOk = failures.length === 0 && !(strictWarnings && warnings.length);
const funnelStatus = adminToken ? "active" : "skipped";
const funnelSummary = overview?.funnel && typeof overview.funnel === "object" ? overview.funnel : null;

// Print the funnel status line so operators can grep a single line in the
// routine monitor output: "funnel=active pageView=NNN ..." when the admin
// token is configured, or "funnel=skipped (admin token not configured)"
// when it is not. The green/red behavior is unchanged — only the line is
// added — so a skip never flips the run red on its own.
const funnelLine = adminToken
  ? ["funnel=active", ...formatFunnelSummary(funnelSummary)].join(" ")
  : "funnel=skipped (admin token not configured)";
console.log(funnelLine);

console.log(
  JSON.stringify(
    {
      ok: monitorOk,
      strictWarnings,
      baseUrl,
      elapsed_ms: Date.now() - started,
      funnelStatus,
      funnelSkipReason: adminToken ? null : "admin token not configured",
      funnel: funnelSummary,
      health,
      overview,
      warnings,
      failures
    },
    null,
    2
  )
);

if (!monitorOk) process.exit(1);

function loadLocalMonitorEnv() {
  const envPath = resolve(process.cwd(), ".monitor.env");
  if (!existsSync(envPath)) return;
  const content = readFileSync(envPath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const [key, ...valueParts] = trimmed.split("=");
    const name = key.trim();
    if (!name || process.env[name]) continue;
    process.env[name] = valueParts.join("=").trim().replace(/^["']|["']$/g, "");
  }
}

async function checkHealth() {
  const response = await fetch(new URL("/api/health", baseUrl));
  const body = await response.json().catch(() => ({}));
  const ok = response.ok && body.ok === true && body.status === "ready" && Array.isArray(body.missing) && body.missing.length === 0;
  if (!ok) failures.push({ check: "health", status: response.status, body });
  return {
    ok,
    status: response.status,
    runtimeStatus: body.status || "",
    missing: body.missing || []
  };
}

async function checkAdminOverview(token) {
  const response = await fetch(new URL("/api/admin/overview", baseUrl), {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || body.ok !== true) {
    failures.push({ check: "admin-overview", status: response.status, body });
    return { ok: false, status: response.status };
  }

  const alerts = Array.isArray(body.alerts) ? body.alerts : [];
  const criticalAlerts = alerts.filter((alert) => alert?.severity === "critical");
  const warningAlerts = alerts.filter((alert) => alert?.severity === "warning");
  if (criticalAlerts.length) failures.push({ check: "admin-alerts", criticalAlerts });
  if (warningAlerts.length) warnings.push({ check: "admin-alerts", warningAlerts });

  const cloudConvert = body.cloudConvert || {};
  const previewFunnel = Array.isArray(body.previewFunnel) ? body.previewFunnel : [];
  return {
    ok: criticalAlerts.length === 0,
    status: response.status,
    generatedAt: body.generatedAt || "",
    alerts,
    funnel: summarizeFunnel(previewFunnel),
    previewFunnel,
    cloudConvert: {
      configured: Boolean(cloudConvert.configured),
      dailyLimit: cloudConvert.dailyLimit,
      minCredits: cloudConvert.minCredits,
      requireCreditCheck: Boolean(cloudConvert.requireCreditCheck),
      usageToday: cloudConvert.usageToday || null,
      account: cloudConvert.account
        ? {
            ok: Boolean(cloudConvert.account.ok),
            credits: cloudConvert.account.credits ?? null,
            message: cloudConvert.account.message || ""
          }
        : null
    },
    usage24h: body.usage24h || null
  };
}

// Named live funnel visit counts for the last 24 hours, derived from the
// admin overview's per-event rows (page_view, preview_success, checkout_click,
// finalize_success, download_success, ...). Keys are camelCase event types.
function summarizeFunnel(rows) {
  const summary = {};
  for (const row of rows || []) {
    const eventType = String(row.event_type || "").replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    if (!eventType) continue;
    const count = Number(row.count);
    summary[eventType] = Number.isFinite(count) ? count : 0;
  }
  return summary;
}

// Render the funnel summary as `name=value` pairs for the human-readable
// `funnel=active` line. Stable iteration order so the line is grep-friendly.
function formatFunnelSummary(summary) {
  if (!summary || typeof summary !== "object") return [];
  const names = Object.keys(summary).sort();
  return names.map((name) => `${name}=${Number(summary[name]) || 0}`);
}
