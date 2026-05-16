const baseUrl = process.env.AICONVERTER_STRESS_URL || "https://aiconverter.app";
const rounds = Number(process.env.CHECKOUT_STRESS_ROUNDS || 2);
const turnstileResponseToken = process.env.TURNSTILE_RESPONSE_TOKEN || "";
const existingJobId = process.env.CHECKOUT_STRESS_JOB_ID || "";
const existingJobToken = process.env.CHECKOUT_STRESS_JOB_TOKEN || "";
const failures = [];
const checkouts = [];
const started = Date.now();
const config = await fetch(new URL("/api/config", baseUrl)).then((response) => response.json()).catch(() => ({}));

if (config.turnstileSiteKey && !turnstileResponseToken && !(existingJobId && existingJobToken)) {
  failures.push({
    step: "turnstile",
    status: "token-required",
    message:
      "Turnstile is active. Provide TURNSTILE_RESPONSE_TOKEN or CHECKOUT_STRESS_JOB_ID/CHECKOUT_STRESS_JOB_TOKEN from a browser-created preview job."
  });
}

for (let round = 0; round < rounds; round += 1) {
  if (failures.length) break;
  const id = `${Date.now()}-${round}-${Math.random().toString(16).slice(2)}`;
  let convertStarted = Date.now();
  let convertBody = { jobId: existingJobId, token: existingJobToken };

  if (!existingJobId || !existingJobToken) {
    const file = new Blob([`Name,Amount\nSynthetic checkout audit ${id},${round + 1}\n`], { type: "text/csv" });
    const form = new FormData();
    form.append("converterId", "document-markdown");
    form.append("outputFormat", "md");
    form.append("planId", "starter");
    form.append("email", "audit@example.com");
    if (turnstileResponseToken) form.append("turnstileToken", turnstileResponseToken);
    form.append("file", file, `checkout-audit-${round}.csv`);

    const convert = await fetch(new URL("/api/convert", baseUrl), { method: "POST", body: form });
    convertBody = await convert.json().catch(async () => ({ raw: await convert.text() }));
    if (!convert.ok || convertBody.status !== "preview_ready" || !convertBody.jobId || !convertBody.token) {
      failures.push({
        round,
        step: "convert",
        status: convert.status,
        body: redact(convertBody),
        elapsedMs: Date.now() - convertStarted
      });
      continue;
    }
  }

  const checkoutStarted = Date.now();
  const checkout = await fetch(new URL("/api/checkout", baseUrl), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jobId: convertBody.jobId,
      token: convertBody.token,
      planId: "starter",
      email: "audit@example.com"
    })
  });
  const checkoutBody = await checkout.json().catch(async () => ({ raw: await checkout.text() }));
  const cookie =
    typeof checkout.headers.getSetCookie === "function"
      ? checkout.headers.getSetCookie().join(";")
      : checkout.headers.get("set-cookie") || "";
  const checkoutHost = checkoutBody.checkoutUrl ? new URL(checkoutBody.checkoutUrl).host : "";

  if (
    !checkout.ok ||
    checkoutBody.mode !== "checkout" ||
    checkoutHost !== "checkout.dodopayments.com" ||
    !cookie.includes("HttpOnly") ||
    !cookie.includes("SameSite=Lax")
  ) {
    failures.push({
      round,
      step: "checkout",
      status: checkout.status,
      host: checkoutHost,
      cookieSet: Boolean(cookie),
      body: redact(checkoutBody),
      elapsedMs: Date.now() - checkoutStarted
    });
    continue;
  }

  checkouts.push({
    round,
    jobId: convertBody.jobId,
    host: checkoutHost,
    convertMs: Date.now() - convertStarted,
    checkoutMs: Date.now() - checkoutStarted
  });
}

console.log(
  JSON.stringify(
    {
      ok: failures.length === 0,
      baseUrl,
      rounds,
      checkouts,
      failures,
      elapsedMs: Date.now() - started
    },
    null,
    2
  )
);

if (failures.length) process.exit(1);

function redact(value) {
  if (!value || typeof value !== "object") return value;
  const copy = { ...value };
  if (copy.token) copy.token = "[redacted]";
  if (copy.checkoutUrl) copy.checkoutUrl = "[redacted]";
  return copy;
}
