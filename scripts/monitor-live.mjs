const baseUrl = process.env.AICONVERTER_MONITOR_URL || process.env.AICONVERTER_STRESS_URL || "https://aiconverter.app";
const adminToken =
  process.env.AICONVERTER_MONITOR_ADMIN_TOKEN || process.env.AICONVERTER_ADMIN_TOKEN || process.env.ADMIN_TOKEN || "";

const failures = [];
const warnings = [];
const started = Date.now();

const health = await checkHealth();
const overview = adminToken ? await checkAdminOverview(adminToken) : null;
if (!adminToken) warnings.push({ check: "admin-overview", status: "skipped", reason: "admin token not configured" });

console.log(
  JSON.stringify(
    {
      ok: failures.length === 0,
      baseUrl,
      elapsed_ms: Date.now() - started,
      health,
      overview,
      warnings,
      failures
    },
    null,
    2
  )
);

if (failures.length) process.exit(1);

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
  return {
    ok: criticalAlerts.length === 0,
    status: response.status,
    generatedAt: body.generatedAt || "",
    alerts,
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
