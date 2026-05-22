# API Contracts: 11/10 Self-Serve SaaS Completion

## POST /api/recovery/request

Accepts an email and records a short-lived recovery token. The response is the same whether jobs exist or not.

## POST /api/recovery/jobs

Accepts a recovery token and returns safe job summaries, billing summaries, and support cases for matching jobs only.

## POST /api/billing/summary

Accepts a job id plus job token or recovery token and returns safe billing state.

## POST /api/support

Returns a ticket id and public status for accepted support requests.
