# Monitoring And Guardrails

## Live Checks

Run the public monitor:

```bash
npm run monitor:live
```

With the private dashboard checks enabled:

```bash
AICONVERTER_ADMIN_TOKEN="..." npm run monitor:live
```

The monitor fails on:

- `/api/health` not returning `ok: true` and `status: ready`
- any critical private admin alert when an admin token is available

## CloudConvert Guardrails

Configured in `wrangler.jsonc`:

- `CLOUDCONVERT_DAILY_JOB_LIMIT`: max provider jobs started per UTC day
- `CLOUDCONVERT_MIN_CREDITS`: reserve threshold before starting new provider jobs
- `CLOUDCONVERT_REQUIRE_CREDIT_CHECK`: when true, blocks new provider jobs if credits cannot be checked

The private admin page shows credits, started/remaining jobs for today, provider failures, and stuck provider jobs.

## Dodo Alerts

The private admin page flags:

- failed Dodo webhook events
- unmatched Dodo payment events
- refund or credit due jobs

## Human-Only Launch Checks

These still require a real operator action:

- browser upload with a human-solved Turnstile challenge
- real-card Dodo checkout return, webhook, paid finalize, download, redo, and refund path
