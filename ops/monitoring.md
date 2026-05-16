# Monitoring And Guardrails

## Live Checks

Run the private-aware live monitor:

```bash
npm run monitor:live
```

The monitor loads `.monitor.env` when present. It must contain the private admin token unless this is an intentionally public-only check:

```bash
AICONVERTER_ADMIN_TOKEN="..."
```

The monitor fails on:

- `/api/health` not returning `ok: true` and `status: ready`
- missing admin token unless `AICONVERTER_MONITOR_PUBLIC_ONLY=true` is set
- private admin overview not responding
- any critical private admin alert

Run the controlled provider failover drill after deploys that touch provider routing:

```bash
npm run drill:failover
```

The drill uses the admin-only `/api/admin/failover-drill` route. It creates a tiny synthetic provider job, disables CloudConvert only inside that admin drill, and verifies the live app routes to Convertio.

## CloudConvert Guardrails

Configured in `wrangler.jsonc`:

- `CLOUDCONVERT_DAILY_JOB_LIMIT`: max provider jobs started per UTC day
- `CLOUDCONVERT_MIN_CREDITS`: reserve threshold before starting new provider jobs
- `CLOUDCONVERT_REQUIRE_CREDIT_CHECK`: when true, blocks new provider jobs if credits cannot be checked

The private admin page shows credits, started/remaining jobs for today, provider failures, and stuck provider jobs.

## Backup Provider

Set `CONVERTIO_API_KEY` as a secret to enable the backup route for provider-backed universal conversions.

Configured in `wrangler.jsonc`:

- `CONVERTIO_DAILY_JOB_LIMIT`: max backup provider jobs started per UTC day

If CloudConvert is unavailable before a job starts cleanly, the app attempts Convertio before failing/refunding the paid job. The failover drill should stay admin-only and should not change production provider settings for normal users.

## Dodo Alerts

The private admin page flags:

- failed Dodo webhook events
- unmatched Dodo payment events
- refund or credit due jobs

## Human-Only Launch Checks

These still require a real operator action:

- browser upload with a human-solved Turnstile challenge
- real-card Dodo checkout return, webhook, paid finalize, download, redo, and refund path
