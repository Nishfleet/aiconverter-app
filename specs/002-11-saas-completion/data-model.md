# Data Model: 11/10 Self-Serve SaaS Completion

## CustomerRecoveryToken

- `id`: random identifier.
- `email_hash`: normalized customer email hash.
- `token_hash`: recovery token hash.
- `expires_at`: short expiry timestamp.
- `used_at`: optional timestamp.
- `created_at`: creation timestamp.
- `request_ip_hash`: optional abuse-control hash.
- `user_agent_hash`: optional abuse-control hash.

## CustomerJobSummary

- `id`
- `status`
- `converter`
- `output_format`
- `plan_id`
- `page_count`
- `row_count`
- `confidence`
- `created_at`
- `expires_at`
- `paid_at`
- `download_available`
- `redo_available`
- `delete_available`
- `labels`
- `billing_summary`
- `support_cases`

## BillingSummary

- `job_id`
- `plan_id`
- `amount`
- `currency`
- `payment_status`
- `provider_payment_id`
- `checkout_session_id`
- `receipt_email`
- `refund_status`
- `refund_id`
- `portal_status`
- `support_path`

## SupportCase

- `ticket_id`
- `job_id`
- `customer_email_hash`
- `topic`
- `status`
- `public_status_note`
- `message_excerpt`
- `created_at`
- `updated_at`

## ImportConfidenceReport

- `job_id`
- `output_format`
- `row_count`
- `confidence`
- `date_coverage`
- `amount_coverage`
- `balance_check`
- `duplicate_check`
- `opening_balance`
- `closing_balance`
- `warnings`
- `import_readiness`
