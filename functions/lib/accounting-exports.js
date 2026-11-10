export const BANK_OUTPUT_FORMATS = [
  "csv",
  "quickbooks-csv",
  "xero-csv",
  "wave-csv",
  "gnucash-csv",
  "qif",
  "ofx",
  "qbo"
];

/** @typedef {Object} BankRow
 * * @property {string} date * @property {string} description
 * @property {string | number} money_in
 * @property {string | number} money_out
 * @property {string | number} balance
 * @property {number} confidence
 */

/** @typedef {Object} CsvColumn
 * @property {string} key
 * @property {string} [label]
 */

/** @typedef {Object} ValidationInput
 * @property {string[]} [warnings]
 * @property {Record<string, Record<string, unknown>>} [checks]
 * @property {number} [confidence]
 * @property {number} [trustScore]
 * @property {string} [provider]
 */

/** @typedef {Object} BankExportResult
 * @property {boolean} ok
 * @property {string} [message]
 * @property {string} outputFormat
 * @property {string} [content]
 * @property {string} [csv]
 * @property {string} [contentType]
 * @property {string} [fileExtension]
 * @property {CsvColumn[]} [columns]
 * @property {Array<Record<string, string>>} [previewRows]
 * @property {string} [validationReport]
 */

const DEFAULT_METADATA = {
  bankName: "Bank",
  bankId: "",
  accountId: "",
  accountType: "CHECKING",
  currency: "USD",
  country: "USA",
  dateFormat: "MM/DD/YYYY",
  intuitBankId: ""
};

const ACCOUNT_TYPES = new Set(["CHECKING", "SAVINGS", "MONEYMRKT", "CREDITLINE", "CD"]);

/** @param {string} [format]
 * @returns {boolean}
 */
export function isBankOutputFormat(format = "") {
  return BANK_OUTPUT_FORMATS.includes(String(format || "").toLowerCase());
}

/** @param {string} [format]
 * @returns {string}
 */
export function normalizeBankOutputFormat(format = "") {
  const normalized = String(format || "").trim().toLowerCase();
  return isBankOutputFormat(normalized) ? normalized : "csv";
}

/** @param {string} [format]
 * @returns {string}
 */
export function bankOutputFileExtension(format = "") {
  const normalized = normalizeBankOutputFormat(format);
  if (normalized.endsWith("-csv")) return "csv";
  if (normalized === "csv") return "csv";
  return normalized;
}

/** @param {string} [format]
 * @returns {string}
 */
export function bankOutputContentType(format = "") {
  const normalized = normalizeBankOutputFormat(format);
  if (normalized === "qif") return "application/x-qif; charset=utf-8";
  if (normalized === "ofx") return "application/x-ofx; charset=utf-8";
  if (normalized === "qbo") return "application/vnd.intu.qbo; charset=utf-8";
  return "text/csv; charset=utf-8";
}

/** @param {string} [format]
 * @returns {string}
 */
export function bankOutputLabel(format = "") {
  /** @type {Record<string, string>} */
  const labels = {
    csv: "Clean CSV",
    "quickbooks-csv": "QuickBooks CSV",
    "xero-csv": "Xero CSV",
    "wave-csv": "Wave CSV",
    "gnucash-csv": "GnuCash CSV",
    qif: "QIF",
    ofx: "OFX",
    qbo: "QBO"
  };
  return labels[normalizeBankOutputFormat(format)] || "CSV";
}

/** @param {string} [format]
 * @param {string} [originalName]
 * @returns {string}
 */
export function bankDownloadFileName(format = "", originalName = "bank-statement") {
  const normalized = normalizeBankOutputFormat(format);
  const extension = bankOutputFileExtension(normalized);
  const stem = cleanFileStem(originalName || "bank-statement");
  /** @type {Record<string, string>} */
  const suffixes = {
    csv: "clean",
    "quickbooks-csv": "quickbooks",
    "xero-csv": "xero",
    "wave-csv": "wave",
    "gnucash-csv": "gnucash",
    qif: "qif",
    ofx: "ofx",
    qbo: "qbo"
  };
  return `aiconverter-${stem}-${suffixes[normalized] || "export"}.${extension}`;
}

/** @param {Record<string, unknown> | string} [value]
 * @returns {{ bankName: string, bankId: string, accountId: string, accountType: string, currency: string, country: string, dateFormat: string, intuitBankId: string }}
 */
export function sanitizeBankMetadata(value = {}) {
  const input = typeof value === "string" ? parseJson(value) : asRecord(value || {});
  const country = cleanCode(input.country || DEFAULT_METADATA.country, 3) || DEFAULT_METADATA.country;
  const currency = cleanCode(input.currency || DEFAULT_METADATA.currency, 3) || DEFAULT_METADATA.currency;
  const accountType = String(input.accountType || DEFAULT_METADATA.accountType).trim().toUpperCase();
  return {
    bankName: cleanText(input.bankName || DEFAULT_METADATA.bankName, 80) || DEFAULT_METADATA.bankName,
    bankId: cleanBankId(input.bankId || ""),
    accountId: cleanAccountId(input.accountId || ""),
    accountType: ACCOUNT_TYPES.has(accountType) ? accountType : DEFAULT_METADATA.accountType,
    currency,
    country,
    dateFormat: cleanDateFormat(input.dateFormat || DEFAULT_METADATA.dateFormat),
    intuitBankId: cleanBankId(input.intuitBankId || "")
  };
}

/** @param {string} [format]
 * @param {Record<string, unknown>} [metadata]
 * @returns {string[]}
 */
export function missingBankMetadata(format = "", metadata = {}) {
  const normalized = normalizeBankOutputFormat(format);
  if (!["ofx", "qbo"].includes(normalized)) return [];
  const clean = sanitizeBankMetadata(metadata);
  const missing = [];
  if (!clean.bankId) missing.push("bankId");
  if (!clean.accountId) missing.push("accountId");
  if (normalized === "qbo" && !clean.intuitBankId) missing.push("intuitBankId");
  return missing;
}

/** @param {BankRow[]} rows
 * * @param {string} [format] * @param {{ accountingMetadata?: Record<string, unknown>, bankMetadata?: Record<string, unknown>, validation?: ValidationInput, sourceFileName?: string, format?: string }} [options]
 * @returns {BankExportResult}
 */
export function exportBankRows(rows, format = "csv", options = {}) {
  const normalized = normalizeBankOutputFormat(format);
  const metadata = sanitizeBankMetadata(options.accountingMetadata || options.bankMetadata || {});
  const missing = missingBankMetadata(normalized, metadata);
  if (missing.length) {
    return {
      ok: false,
      message: missingMetadataMessage(normalized, missing),
      outputFormat: normalized
    };
  }

  const normalizedRows = normalizeRows(rows);
  const validationReport = buildValidationReport(normalizedRows, {
    format: normalized,
    metadata,
    validation: options.validation || {},
    sourceFileName: options.sourceFileName || ""
  });

  if (normalized === "qif") {
    return output({
      content: rowsToQif(normalizedRows, metadata),
      format: normalized,
      rows: normalizedRows,
      validationReport
    });
  }

  if (normalized === "ofx" || normalized === "qbo") {
    return output({
      content: rowsToOfx(normalizedRows, metadata, { quickBooks: normalized === "qbo" }),
      format: normalized,
      rows: normalizedRows,
      validationReport
    });
  }

  const { columns, mappedRows } = rowsToAccountingCsv(normalizedRows, normalized, metadata);
  return output({
    content: rowsToCsv(mappedRows, columns),
    format: normalized,
    rows: normalizedRows,
    columns,
    previewRows: mappedRows.slice(0, 5),
    validationReport
  });
}

/** @param {BankRow[]} rows
 * @param {{ validation?: ValidationInput, metadata?: Record<string, unknown>, format?: string, sourceFileName?: string }} [options]
 * @returns {string}
 */
export function buildValidationReport(rows, options = {}) {
  const validation = options.validation || {};
  const metadata = sanitizeBankMetadata(options.metadata || {});
  const dates = rows.map((row) => row.date).filter(Boolean).sort();
  const deposits = rows.reduce((sum, row) => sum + Number(row.money_in || 0), 0);
  const withdrawals = rows.reduce((sum, row) => sum + Number(row.money_out || 0), 0);
  const balances = rows.map((row) => row.balance).filter(hasNumber);
  const duplicateCount = countDuplicateRows(rows);
  const warnings = [...new Set([...(validation.warnings || []), ...(duplicateCount ? [`${duplicateCount} possible duplicate row${duplicateCount === 1 ? "" : "s"}.`] : [])])];
  const checks = validation.checks || {};
  const dateCheck = checks.dateCoverage || {};
  const amountCheck = checks.amountCoverage || {};
  const balanceCheck = checks.runningBalance || {};
  const pageCheck = checks.pageCoverage || {};
  const lines = [
    "AI Converter validation report",
    "",
    `Source file: ${options.sourceFileName || "uploaded bank statement"}`,
    `Output: ${bankOutputLabel(options.format)}`,
    `Rows extracted: ${rows.length}`,
    `Date coverage: ${dates[0] || "unknown"} to ${dates[dates.length - 1] || "unknown"}`,
    `Rows with valid dates: ${countCheck(dateCheck.valid, rows.length)}`,
    `Rows with amounts: ${countCheck(amountCheck.valid, rows.length)}`,
    `Money in: ${formatAmount(deposits)}`,
    `Money out: ${formatAmount(withdrawals)}`,
    `Opening balance: ${balances.length ? formatAmount(balances[0]) : "not available"}`,
    `Closing balance: ${balances.length ? formatAmount(balances[balances.length - 1]) : "not available"}`,
    `Confidence score: ${Math.round(Number(validation.confidence || average(rows.map((row) => Number(row.confidence || 0))) || 0) * 100)}%`,
    `Balance check: ${balanceCheckSummary(balanceCheck)}`,
    `Duplicate check: ${duplicateCount ? "needs review" : "no obvious duplicate rows found"}`,
    `Page coverage: ${pageCoverageSummary(pageCheck)}`,
    "",
    "Bank metadata used",
    `Bank: ${metadata.bankName}`,
    `Bank ID: ${metadata.bankId || "not used for this output"}`,
    `Account ID: ${metadata.accountId ? maskAccount(metadata.accountId) : "not used for this output"}`,
    `Account type: ${metadata.accountType}`,
    `Currency: ${metadata.currency}`,
    "",
    "Review before import",
    "Check the opening/closing balance, duplicates, date range, and account selection inside your accounting app before accepting the import.",
    ...(warnings.length ? ["", "Warnings", ...warnings.map((warning) => `- ${warning}`)] : [])
  ];
  return `${lines.join("\n")}\n`;
}

/** @param {BankRow[]} rows
 * @param {string} format
 * @param {{ bankName: string, bankId: string, accountId: string, accountType: string, currency: string, country: string, dateFormat: string, intuitBankId: string }} metadata
 * @returns {{ columns: CsvColumn[], mappedRows: Array<Record<string, string>> }}
 */
function rowsToAccountingCsv(rows, format, metadata) {
  if (format === "quickbooks-csv") {
    const columns = [
      { key: "date", label: "Date" },
      { key: "description", label: "Description" },
      { key: "amount", label: "Amount" }
    ];
    return {
      columns,
      mappedRows: rows.map((row) => ({
        date: formatDate(row.date, metadata.dateFormat),
        description: row.description,
        amount: formatAmount(signedAmount(row))
      }))
    };
  }

  if (format === "xero-csv") {
    const columns = [
      { key: "date", label: "Date" },
      { key: "amount", label: "Amount" },
      { key: "payee", label: "Payee" },
      { key: "description", label: "Description" },
      { key: "reference", label: "Reference" }
    ];
    return {
      columns,
      mappedRows: rows.map((row, index) => ({
        date: formatDate(row.date, "YYYY/MM/DD"),
        amount: formatAmount(signedAmount(row)),
        payee: payeeFromDescription(row.description),
        description: row.description,
        reference: stableTransactionId(row, metadata, index).slice(0, 24)
      }))
    };
  }

  if (format === "wave-csv") {
    const columns = [
      { key: "date", label: "Date" },
      { key: "description", label: "Description" },
      { key: "amount", label: "Amount" }
    ];
    return {
      columns,
      mappedRows: rows.map((row) => ({
        date: formatDate(row.date, "YYYY-MM-DD"),
        description: row.description,
        amount: formatAmount(signedAmount(row))
      }))
    };
  }

  if (format === "gnucash-csv") {
    const columns = [
      { key: "date", label: "Date" },
      { key: "description", label: "Description" },
      { key: "deposit", label: "Deposit" },
      { key: "withdrawal", label: "Withdrawal" }
    ];
    return {
      columns,
      mappedRows: rows.map((row) => ({
        date: row.date,
        description: row.description,
        deposit: hasNumber(row.money_in) ? formatAmount(row.money_in) : "",
        withdrawal: hasNumber(row.money_out) ? formatAmount(row.money_out) : ""
      }))
    };
  }

  const columns = [
    { key: "date", label: "Date" },
    { key: "description", label: "Description" },
    { key: "money_in", label: "Money In" },
    { key: "money_out", label: "Money Out" },
    { key: "balance", label: "Balance" }
  ];
  return {
    columns,
    mappedRows: rows.map((row) => ({
      date: row.date,
      description: row.description,
      money_in: hasNumber(row.money_in) ? formatAmount(row.money_in) : "",
      money_out: hasNumber(row.money_out) ? formatAmount(row.money_out) : "",
      balance: hasNumber(row.balance) ? formatAmount(row.balance) : ""
    }))
  };
}

/** @param {BankRow[]} rows
 * @param {{ bankName: string, bankId: string, accountId: string, accountType: string, currency: string, country: string, dateFormat: string, intuitBankId: string }} metadata
 * @returns {string}
 */
function rowsToQif(rows, metadata) {
  const type = metadata.accountType === "CREDITLINE" ? "CCard" : "Bank";
  const lines = [`!Type:${type}`];
  rows.forEach((row) => {
    lines.push(`D${formatDate(row.date, "MM/DD/YYYY")}`);
    lines.push(`T${formatAmount(signedAmount(row))}`);
    lines.push(`P${qifText(payeeFromDescription(row.description))}`);
    if (row.description) lines.push(`M${qifText(row.description)}`);
    lines.push("^");
  });
  return `${lines.join("\n")}\n`;
}

/** @param {BankRow[]} rows
 * @param {{ bankName: string, bankId: string, accountId: string, accountType: string, currency: string, country: string, dateFormat: string, intuitBankId: string }} metadata
 * @param {{ quickBooks?: boolean }} [options]
 * @returns {string}
 */
function rowsToOfx(rows, metadata, options = {}) {
  const now = ofxDateTime(new Date());
  const start = rows[0]?.date ? ofxDate(rows[0].date) : now;
  const end = rows[rows.length - 1]?.date ? ofxDate(rows[rows.length - 1].date) : now;
  const ledgerBalance = rows.map((row) => row.balance).filter(hasNumber).at(-1);
  const fileUid = stableHash(`${metadata.bankId}:${metadata.accountId}:${start}:${end}:${rows.length}`);
  const transactions = rows
    .map((row, index) => {
      const amount = signedAmount(row);
      return [
        "<STMTTRN>",
        `<TRNTYPE>${amount < 0 ? "DEBIT" : "CREDIT"}`,
        `<DTPOSTED>${ofxDate(row.date)}`,
        `<TRNAMT>${formatAmount(amount)}`,
        `<FITID>${stableTransactionId(row, metadata, index)}`,
        `<NAME>${ofxText(payeeFromDescription(row.description)).slice(0, 64)}`,
        row.description ? `<MEMO>${ofxText(row.description).slice(0, 255)}` : "",
        "</STMTTRN>"
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n");

  return `OFXHEADER:100
DATA:OFXSGML
VERSION:102
SECURITY:NONE
ENCODING:USASCII
CHARSET:1252
COMPRESSION:NONE
OLDFILEUID:NONE
NEWFILEUID:${fileUid}

<OFX>
<SIGNONMSGSRSV1>
<SONRS>
<STATUS>
<CODE>0
<SEVERITY>INFO
</STATUS>
<DTSERVER>${now}
<LANGUAGE>ENG
<FI>
<ORG>${ofxText(metadata.bankName)}
<FID>${ofxText(metadata.bankId)}
</FI>
${options.quickBooks ? `<INTU.BID>${ofxText(metadata.intuitBankId)}\n` : ""}</SONRS>
</SIGNONMSGSRSV1>
<BANKMSGSRSV1>
<STMTTRNRS>
<TRNUID>${fileUid}
<STATUS>
<CODE>0
<SEVERITY>INFO
</STATUS>
<STMTRS>
<CURDEF>${metadata.currency}
<BANKACCTFROM>
<BANKID>${ofxText(metadata.bankId)}
<ACCTID>${ofxText(metadata.accountId)}
<ACCTTYPE>${metadata.accountType}
</BANKACCTFROM>
<BANKTRANLIST>
<DTSTART>${start}
<DTEND>${end}
${transactions}
</BANKTRANLIST>
<LEDGERBAL>
<BALAMT>${hasNumber(ledgerBalance) ? formatAmount(ledgerBalance) : "0.00"}
<DTASOF>${end}
</LEDGERBAL>
</STMTRS>
</STMTTRNRS>
</BANKMSGSRSV1>
</OFX>
`;
}

/** @param {{ content: string, format: string, rows: BankRow[], columns?: CsvColumn[], previewRows?: Array<Record<string, string>>, validationReport?: string }} parts
 * @returns {BankExportResult}
 */
function output({ content, format, rows, columns, previewRows, validationReport }) {
  const normalized = normalizeBankOutputFormat(format);
  const previewColumns = columns || [
    { key: "date", label: "Date" },
    { key: "description", label: "Description" },
    { key: "amount", label: "Amount" }
  ];
  const normalizedPreviewRows =
    previewRows ||
    rows.slice(0, 5).map((row) => ({
      date: row.date,
      description: row.description,
      amount: formatAmount(signedAmount(row))
    }));
  return {
    ok: true,
    content,
    csv: rowsToCsv(normalizedPreviewRows, previewColumns),
    contentType: bankOutputContentType(normalized),
    fileExtension: bankOutputFileExtension(normalized),
    outputFormat: normalized,
    columns: previewColumns,
    previewRows: normalizedPreviewRows,
    validationReport
  };
}

/** @param {unknown} rows
 * @returns {BankRow[]}
 */
function normalizeRows(rows) {
  return (Array.isArray(rows) ? rows : [])
    .map((row) => ({
      date: normalizeDate(row.date),
      description: cleanText(row.description, 220),
      money_in: normalizeNumber(row.money_in),
      money_out: normalizeNumber(row.money_out),
      balance: normalizeNumber(row.balance),
      confidence: Number(row.confidence || 0)
    }))
    .filter((row) => row.date || row.description || hasNumber(row.money_in) || hasNumber(row.money_out));
}

/** @param {Array<Record<string, string>>} rows
 * @param {CsvColumn[]} columns
 * @returns {string}
 */
function rowsToCsv(rows, columns) {
  const header = columns.map((column) => column.key);
  const labels = columns.map((column) => column.label || column.key);
  const lines = [labels.join(",")];
  rows.forEach((row) => {
    lines.push(header.map((key) => csvCell(row[key])).join(","));
  });
  return `${lines.join("\n")}\n`;
}

const CSV_FORMULA_TRIGGER = /^[=+\-@\t\r]/;
const CSV_PLAIN_NUMBER = /^[+-]?[$€£¥₹]?(?:\d{1,3}(?:,\d{3})+|\d+|(?=\.\d))(?:\.\d+)?$/;

/** @param {unknown} value
 * @returns {string}
 */
export function guardCsvFormula(value) {
  if (typeof value === "number") return String(value);
  const text = String(value ?? "");
  if (!CSV_FORMULA_TRIGGER.test(text) || CSV_PLAIN_NUMBER.test(text)) return text;
  return `'${text}`;
}

/** @param {unknown} value
 * @returns {string}
 */
export function unguardCsvFormula(value) {
  const text = String(value ?? "");
  return text.startsWith("'") && CSV_FORMULA_TRIGGER.test(text.slice(1)) ? text.slice(1) : text;
}

/** @param {unknown} value
 * @returns {string}
 */
export function csvCell(value) {
  const text = guardCsvFormula(value).replaceAll('"', '""');
  return /[",\n\r]/.test(text) ? `"${text}"` : text;
}

/** @param {BankRow} row
 * @returns {number}
 */
function signedAmount(row) {
  return roundMoney(Number(row.money_in || 0) - Number(row.money_out || 0));
}

/** @param {unknown} value
 * @returns {string}
 */
function normalizeDate(value) {
  const text = String(value || "").trim();
  const iso = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (iso) return `${iso[1]}-${iso[2].padStart(2, "0")}-${iso[3].padStart(2, "0")}`;
  const slash = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (slash) {
    const year = slash[3].length === 2 ? `20${slash[3]}` : slash[3];
    return `${year}-${slash[1].padStart(2, "0")}-${slash[2].padStart(2, "0")}`;
  }
  return text.slice(0, 10);
}

/** @param {unknown} value
 * @param {string} format
 * @returns {string}
 */
function formatDate(value, format) {
  const iso = normalizeDate(value);
  const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return iso;
  const [, yyyy, mm, dd] = match;
  if (format === "DD/MM/YYYY") return `${dd}/${mm}/${yyyy}`;
  if (format === "YYYY/MM/DD") return `${yyyy}/${mm}/${dd}`;
  if (format === "YYYY-MM-DD") return `${yyyy}-${mm}-${dd}`;
  return `${mm}/${dd}/${yyyy}`;
}

/** @param {unknown} value
 * @returns {string}
 */
function ofxDate(value) {
  const iso = normalizeDate(value);
  const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return match ? `${match[1]}${match[2]}${match[3]}120000` : ofxDateTime(new Date());
}

/** @param {Date} date
 * @returns {string}
 */
function ofxDateTime(date) {
  return [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0"),
    String(date.getUTCHours()).padStart(2, "0"),
    String(date.getUTCMinutes()).padStart(2, "0"),
    String(date.getUTCSeconds()).padStart(2, "0")
  ].join("");
}

/** @param {BankRow} row
 * @param {{ bankName: string, bankId: string, accountId: string, accountType: string, currency: string, country: string, dateFormat: string, intuitBankId: string }} metadata
 * @param {number} index
 * @returns {string}
 */
function stableTransactionId(row, metadata, index) {
  const seed = [
    metadata.bankId,
    metadata.accountId,
    row.date,
    formatAmount(signedAmount(row)),
    row.description,
    index
  ].join("|");
  return `${row.date.replaceAll("-", "")}${String(index + 1).padStart(5, "0")}${stableHash(seed).slice(0, 12)}`.slice(0, 32);
}

/** @param {unknown} value
 * @returns {string}
 */
function stableHash(value) {
  let hash = 2166136261;
  for (const char of String(value || "")) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

/** @param {unknown} [description]
 * @returns {string}
 */
function payeeFromDescription(description = "") {
  return cleanText(String(description).split(/\s{2,}| - | \| /)[0], 80) || "Transaction";
}

/** @param {unknown} value
 * @returns {string}
 */
function qifText(value) {
  return String(value || "").replace(/\r?\n/g, " ").replace(/\^/g, "").trim();
}

/** @param {unknown} value
 * @returns {string}
 */
function ofxText(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replace(/\r?\n/g, " ")
    .trim();
}

/** @param {unknown} value
 * @param {number} [max]
 * @returns {string}
 */
function cleanText(value, max = 120) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, max);
}

/** @param {unknown} value
 * @returns {string}
 */
function cleanBankId(value) {
  return String(value || "").replace(/[^a-zA-Z0-9-]/g, "").slice(0, 32);
}

/** @param {unknown} value
 * @returns {string}
 */
function cleanAccountId(value) {
  return String(value || "").replace(/[^a-zA-Z0-9*-]/g, "").slice(0, 34);
}

/** @param {unknown} value
 * @param {number} max
 * @returns {string}
 */
function cleanCode(value, max) {
  return String(value || "").replace(/[^a-zA-Z]/g, "").slice(0, max).toUpperCase();
}

/** @param {unknown} value
 * @returns {string}
 */
function cleanDateFormat(value) {
  const format = String(value || "").toUpperCase();
  return ["MM/DD/YYYY", "DD/MM/YYYY", "YYYY/MM/DD", "YYYY-MM-DD"].includes(format) ? format : DEFAULT_METADATA.dateFormat;
}

/** @param {unknown} value
 * @returns {string | number}
 */
function normalizeNumber(value) {
  if (value === null || value === undefined || value === "") return "";
  if (typeof value === "number") return Number.isFinite(value) ? value : "";
  const text = String(value);
  const negative = /^\(.*\)$/.test(text) || /-\s*\$?/.test(text);
  const number = Number(text.replace(/[^\d.]/g, ""));
  if (!Number.isFinite(number)) return "";
  return negative ? -number : number;
}

/** @param {unknown} value
 * @returns {boolean}
 */
function hasNumber(value) {
  return value !== "" && value !== null && value !== undefined && Number.isFinite(Number(value));
}

/** @param {unknown} value
 * @returns {string}
 */
function formatAmount(value) {
  if (!hasNumber(value)) return "";
  return Number(value).toFixed(2);
}

/** @param {unknown} value
 * @returns {number}
 */
function roundMoney(value) {
  return Math.round(Number(value || 0) * 100) / 100;
}

/** @param {BankRow[]} rows
 * @returns {number}
 */
function countDuplicateRows(rows) {
  const seen = new Set();
  let count = 0;
  rows.forEach((row) => {
    const key = [row.date, cleanText(row.description, 160).toLowerCase(), formatAmount(signedAmount(row))].join("|");
    if (seen.has(key)) count += 1;
    seen.add(key);
  });
  return count;
}

/** @param {unknown} value
 * @param {unknown} total
 * @returns {string}
 */
function countCheck(value, total) {
  if (!Number.isFinite(Number(value))) return "not checked";
  return `${Number(value)}/${Number(total || 0)}`;
}

/** @param {Record<string, unknown>} [check]
 * @returns {string}
 */
function balanceCheckSummary(check = {}) {
  const checked = Number(check.checked || 0);
  if (!checked) return "not available";
  const matched = Number(check.matched || 0);
  const ratio = checked ? matched / checked : 0;
  const status = ratio >= 0.85 ? "no obvious issue found" : "needs review";
  return `${status} (${matched}/${checked} checked rows matched)`;
}

/** @param {Record<string, unknown>} [check]
 * @returns {string}
 */
function pageCoverageSummary(check = {}) {
  const expected = Number(check.expectedPages || 0);
  const covered = Number(check.coveredPages || 0);
  if (!expected && !covered) return "not checked";
  if (!expected) return `${covered} page${covered === 1 ? "" : "s"} detected`;
  return `${covered}/${expected} expected page${expected === 1 ? "" : "s"}`;
}

/** @param {number[]} values
 * @returns {number}
 */
function average(values) {
  const valid = values.filter(Number.isFinite);
  if (!valid.length) return 0;
  return valid.reduce((sum, value) => sum + value, 0) / valid.length;
}

/** @param {unknown} value
 * @returns {string}
 */
function maskAccount(value) {
  const text = String(value || "");
  if (text.length <= 4) return text ? "••••" : "";
  return `${"•".repeat(Math.min(8, text.length - 4))}${text.slice(-4)}`;
}

/** @param {unknown} value
 * @returns {string}
 */
function cleanFileStem(value) {
  return String(value || "bank-statement")
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "bank-statement";
}

/** @param {string} format
 * @param {string[]} missing
 * @returns {string}
 */
function missingMetadataMessage(format, missing) {
  /** @type {Record<string, string>} */
  const labels = {
    bankId: "routing / bank ID",
    accountId: "account number / account ID",
    intuitBankId: "QuickBooks institution ID"
  };
  return `${bankOutputLabel(format)} needs ${missing.map((item) => labels[item] || item).join(", ")} to create a bank-style import file.`;
}

/** @param {unknown} value
 * @returns {Record<string, unknown>}
 */
function asRecord(value) {
  return value && typeof value === "object" ? /** @type {Record<string, unknown>} */ (value) : {};
}

/** @param {string} value
 * @returns {Record<string, unknown>}
 */
function parseJson(value) {
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
}
