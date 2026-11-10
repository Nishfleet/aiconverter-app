// Global bindings for the Functions modules, declared once here from the
// bindings in `cloudflare.config.ts`; the reference is the `Env` type used in
// JSDoc annotations throughout functions/.
interface Env {
  // Bindings (cloudflare.config.ts)
  AI: Ai;
  AICONVERTER_BUCKET: R2Bucket;
  AICONVERTER_DB: D1Database;

  // Vars and secrets. Declared optional because each one is absent on a
  // branch/preview deployment; the functions already guard for that.
  ADMIN_TOKEN?: string;
  ALLOW_CLOUDFLARE_FALLBACK?: string;
  ALLOW_RUNTIME_RATE_LIMIT_SALT?: string;
  AUTO_REFUND_AFTER_DOWNLOAD?: string;
  AUTO_REFUNDS_ENABLED?: string;
  AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT?: string;
  AZURE_DOCUMENT_INTELLIGENCE_KEY?: string;
  CHECKOUT_BATCH_URL?: string;
  CHECKOUT_CURRENCY?: string;
  CHECKOUT_PRO_URL?: string;
  CHECKOUT_STARTER_URL?: string;
  CHECKOUT_URL?: string;
  CLOUDCONVERT_API_KEY?: string;
  CLOUDCONVERT_DAILY_JOB_LIMIT?: string;
  CLOUDCONVERT_MIN_CREDITS?: string;
  CLOUDCONVERT_REQUIRE_CREDIT_CHECK?: string;
  CLOUDCONVERT_TASK_TIMEOUT_SECONDS?: string;
  CONVERTIO_API_KEY?: string;
  CONVERTIO_DAILY_JOB_LIMIT?: string;
  DODO_ADAPTIVE_CURRENCY?: string;
  DODO_ADAPTIVE_CURRENCY_FEES_INCLUSIVE?: string;
  DODO_ADAPTIVE_PRICING?: string;
  DODO_API_KEY?: string;
  DODO_BATCH_PRODUCT_ID?: string;
  DODO_BUSINESS_ID?: string;
  DODO_CURRENCY?: string;
  DODO_ENVIRONMENT?: string;
  DODO_MODE?: string;
  DODO_PAYMENTS_API_KEY?: string;
  DODO_PAYMENTS_BUSINESS_ID?: string;
  DODO_PAYMENTS_WEBHOOK_KEY?: string;
  DODO_PAYMENTS_WEBHOOK_SECRET?: string;
  DODO_PRODUCT_BATCH_ID?: string;
  DODO_PRODUCT_PRO_ID?: string;
  DODO_PRODUCT_STARTER_ID?: string;
  DODO_PRO_PRODUCT_ID?: string;
  DODO_STARTER_PRODUCT_ID?: string;
  DODO_WEBHOOK_SECRET?: string;
  ENABLE_AZURE_FALLBACK?: string;
  FREE_DOWNLOADS_ENABLED?: string;
  GOOGLE_SHEETS_ADDON_CLIENT_IDS?: string;
  MISTRAL_API_KEY?: string;
  PAYMENT_CURRENCY?: string;
  RATE_LIMIT_MAX_PER_HOUR?: string;
  RATE_LIMIT_SALT?: string;
  TURNSTILE_SECRET_KEY?: string;
  TURNSTILE_SITE_KEY?: string;
}

/**
 * One row of the jobs table (D1). TEXT/INTEGER/REAL columns, so a value is
 * a string or a number, and every column except the NOT NULL keys may be
 * absent in the row object D1 returns (NULL columns come back as null and
 * are treated as missing).
 */
interface JobRow {
  id: string;
  token_hash: string;
  status: string;
  plan_id: string;
  email?: string;
  source_key?: string;
  result_key?: string;
  original_file_name?: string;
  file_size?: number;
  estimated_pages?: number;
  row_count?: number;
  confidence?: number;
  error?: string;
  paid_at?: string;
  source_deleted_at?: string;
  created_at: string;
  updated_at: string;
  expires_at: string;
  preview_key?: string;
  payment_id?: string;
  checkout_session_id?: string;
  full_started_at?: string;
  completed_at?: string;
  extractor?: string;
  file_hash?: string;
  ip_hash?: string;
  user_agent_hash?: string;
  redo_count?: number;
  last_redo_at?: string;
  refund_status?: string;
  refund_id?: string;
  refund_requested_at?: string;
  download_count?: number;
  batch_id?: string;
  converter_id?: string;
  input_mime_type?: string;
  external_provider?: string;
  external_job_id?: string;
  external_task_id?: string;
  external_status?: string;
  external_result_name?: string;
  external_result_url?: string;
  external_updated_at?: string;
  output_format?: string;
  accounting_metadata_json?: string;
  validation_report_key?: string;
}

/** A priced plan from the PLANS map in functions/lib/jobs.js. */
interface Plan {
  id: string;
  name: string;
  price: string;
  amount: number;
  currency: string;
  pages: number;
}

interface ConversionResult {
  ok: boolean;
  pending?: boolean;
  status?: string;
  message?: string;
  confidence?: number;
  rowCount?: number;
  provider?: string;
  outputFormat?: string;
  refundStatus?: string;
  previewRows?: Record<string, string>[];
  columns?: { key: string; label: string }[];
  guardrails?: unknown;
  attempts?: { provider: string; message: string }[];
}

interface ProviderUsage {
  started: number;
  jobsStarted?: number;
  reserved?: number;
  complete: number;
  failed: number;
  converting: number;
  startedAt: string;
  error?: string;
}
