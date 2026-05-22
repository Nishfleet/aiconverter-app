ALTER TABLE jobs ADD COLUMN customer_email_hash TEXT DEFAULT '';
ALTER TABLE jobs ADD COLUMN receipt_email TEXT DEFAULT '';
ALTER TABLE jobs ADD COLUMN dodo_customer_id TEXT DEFAULT '';
ALTER TABLE jobs ADD COLUMN dodo_subscription_id TEXT DEFAULT '';
ALTER TABLE jobs ADD COLUMN dodo_receipt_url TEXT DEFAULT '';
ALTER TABLE jobs ADD COLUMN dodo_invoice_url TEXT DEFAULT '';
ALTER TABLE jobs ADD COLUMN recovery_visible_until TEXT DEFAULT '';

CREATE INDEX IF NOT EXISTS idx_jobs_customer_email_hash ON jobs(customer_email_hash, created_at);
CREATE INDEX IF NOT EXISTS idx_jobs_dodo_customer ON jobs(dodo_customer_id, created_at);

CREATE TABLE IF NOT EXISTS customer_recovery_tokens (
  id TEXT PRIMARY KEY,
  email_hash TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  used_at TEXT,
  created_at TEXT NOT NULL,
  request_ip_hash TEXT,
  user_agent_hash TEXT
);

CREATE INDEX IF NOT EXISTS idx_customer_recovery_tokens_hash ON customer_recovery_tokens(token_hash, expires_at);
CREATE INDEX IF NOT EXISTS idx_customer_recovery_tokens_email ON customer_recovery_tokens(email_hash, created_at);

CREATE TABLE IF NOT EXISTS outbound_email_events (
  id TEXT PRIMARY KEY,
  email_hash TEXT NOT NULL,
  email_hint TEXT,
  template TEXT NOT NULL,
  provider TEXT,
  provider_id TEXT,
  status TEXT NOT NULL,
  error TEXT,
  metadata_json TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_outbound_email_events_email ON outbound_email_events(email_hash, created_at);
CREATE INDEX IF NOT EXISTS idx_outbound_email_events_status ON outbound_email_events(status, created_at);

ALTER TABLE support_requests ADD COLUMN ticket_id TEXT DEFAULT '';
ALTER TABLE support_requests ADD COLUMN customer_email_hash TEXT DEFAULT '';
ALTER TABLE support_requests ADD COLUMN topic TEXT DEFAULT '';
ALTER TABLE support_requests ADD COLUMN public_status_note TEXT DEFAULT '';
ALTER TABLE support_requests ADD COLUMN updated_at TEXT DEFAULT '';

CREATE INDEX IF NOT EXISTS idx_support_requests_ticket ON support_requests(ticket_id);
CREATE INDEX IF NOT EXISTS idx_support_requests_customer ON support_requests(customer_email_hash, created_at);
CREATE INDEX IF NOT EXISTS idx_support_requests_status_updated ON support_requests(status, updated_at);

CREATE TABLE IF NOT EXISTS support_status_events (
  id TEXT PRIMARY KEY,
  support_request_id TEXT NOT NULL,
  old_status TEXT,
  new_status TEXT NOT NULL,
  actor TEXT NOT NULL DEFAULT 'system',
  note TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_support_status_events_request ON support_status_events(support_request_id, created_at);

ALTER TABLE dodo_payment_events ADD COLUMN customer_id TEXT DEFAULT '';
ALTER TABLE dodo_payment_events ADD COLUMN subscription_id TEXT DEFAULT '';
ALTER TABLE dodo_payment_events ADD COLUMN receipt_email TEXT DEFAULT '';
ALTER TABLE dodo_payment_events ADD COLUMN receipt_url TEXT DEFAULT '';
ALTER TABLE dodo_payment_events ADD COLUMN invoice_url TEXT DEFAULT '';

CREATE INDEX IF NOT EXISTS idx_dodo_payment_events_customer ON dodo_payment_events(customer_id, created_at);
CREATE INDEX IF NOT EXISTS idx_dodo_payment_events_subscription ON dodo_payment_events(subscription_id, created_at);
