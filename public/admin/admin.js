const form = document.getElementById("admin-form");
const tokenInput = document.getElementById("admin-token");
const output = document.getElementById("admin-output");

form?.addEventListener("submit", async (event) => {
  event.preventDefault();
  output.innerHTML = '<div class="admin-empty">Loading live status...</div>';

  try {
    const response = await fetch("/api/admin/overview", {
      headers: {
        Authorization: `Bearer ${tokenInput.value.trim()}`
      }
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || "Admin overview failed.");
    output.innerHTML = renderOverview(payload);
  } catch (error) {
    output.innerHTML = `<div class="admin-error">${escapeHtml(error?.message || "Admin overview failed.")}</div>`;
  }
});

function renderOverview(payload) {
  const health = payload.health || {};
  return [
    renderHealth(health, payload.generatedAt),
    renderStatusCounts(payload.jobStatus || []),
    renderTable("Watchlist", payload.watchlist || [], ["id", "status", "converter_id", "plan_id", "row_count", "confidence", "refund_status", "error", "updated_at"]),
    renderTable("Open support", payload.support || [], ["id", "job_id", "email", "category", "status", "message_excerpt", "created_at"]),
    renderTable("Dodo payments", payload.payments || [], ["event_type", "job_id", "payment_id", "plan_id", "status", "amount", "currency", "match_status", "created_at"]),
    renderTable("Refunds", payload.refunds || [], ["job_id", "payment_id", "refund_id", "status", "reason", "created_at"]),
    renderTable("Webhooks", payload.webhooks || [], ["webhook_id", "event_type", "status", "received_count", "error", "updated_at"])
  ].join("");
}

function renderHealth(health, generatedAt) {
  const missing = health.missing || [];
  return `
    <section class="admin-panel">
      <div class="admin-panel-head">
        <div>
          <h2>Runtime health</h2>
          <p>Generated ${escapeHtml(generatedAt || "")}</p>
        </div>
        <span class="admin-badge ${missing.length ? "is-attention" : "is-ready"}">
          ${missing.length ? "Needs attention" : "Ready"}
        </span>
      </div>
      <div class="admin-health-grid">
        ${healthCard("Storage", health.storageConfigured ? "Configured" : "Missing")}
        ${healthCard("Payments", `${health.payments?.provider || "dodo"} · ${health.payments?.mode || "live"}`)}
        ${healthCard("Mistral", health.extraction?.mistral ? "Configured" : "Missing")}
        ${healthCard("Turnstile", health.protection?.turnstile ? "Configured" : "Not active")}
      </div>
      ${
        missing.length
          ? `<div class="admin-missing"><strong>Missing:</strong> ${missing.map(escapeHtml).join(", ")}</div>`
          : ""
      }
    </section>
  `;
}

function healthCard(label, value) {
  return `
    <div class="admin-health-card">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
    </div>
  `;
}

function renderStatusCounts(rows) {
  return `
    <section class="admin-panel">
      <div class="admin-panel-head">
        <div>
          <h2>Jobs</h2>
          <p>Current status counts</p>
        </div>
      </div>
      <div class="admin-counts">
        ${
          rows.length
            ? rows.map((row) => `<div><strong>${escapeHtml(row.count)}</strong><span>${escapeHtml(row.status)}</span></div>`).join("")
            : '<div><strong>0</strong><span>No jobs yet</span></div>'
        }
      </div>
    </section>
  `;
}

function renderTable(title, rows, columns) {
  return `
    <section class="admin-panel">
      <div class="admin-panel-head">
        <div>
          <h2>${escapeHtml(title)}</h2>
          <p>${rows.length} record${rows.length === 1 ? "" : "s"}</p>
        </div>
      </div>
      ${
        rows.length
          ? `<div class="admin-table-wrap"><table class="admin-table">
              <thead><tr>${columns.map((column) => `<th>${escapeHtml(labelFor(column))}</th>`).join("")}</tr></thead>
              <tbody>
                ${rows
                  .map(
                    (row) =>
                      `<tr>${columns.map((column) => `<td>${formatCell(row[column], column)}</td>`).join("")}</tr>`
                  )
                  .join("")}
              </tbody>
            </table></div>`
          : '<div class="admin-empty">Nothing to show.</div>'
      }
    </section>
  `;
}

function formatCell(value, column) {
  if (value === null || value === undefined || value === "") return '<span class="admin-muted">-</span>';
  if (column === "confidence") return `${Math.round(Number(value || 0) * 100)}%`;
  if (column === "amount") return Number(value || 0) ? `$${(Number(value) / 100).toFixed(2)}` : "-";
  return escapeHtml(String(value));
}

function labelFor(value) {
  return String(value).replaceAll("_", " ");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
