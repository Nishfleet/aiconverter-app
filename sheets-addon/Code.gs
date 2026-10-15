/**
 * AI Converter: PDF to Sheets (Google Sheets editor add-on).
 *
 * The sidebar sends a PDF or image here; this script forwards it to
 * aiconverter.app with the user's Google identity token, shows the free
 * preview, opens checkout, and writes the full rows into a new sheet tab.
 */

var API_BASE = 'https://aiconverter.app';
var CLIENT_ID = 'sheets-addon';
var LAST_JOB_KEY = 'aiconverter.lastJob';

var KINDS = {
  bank: { converterId: 'bank', label: 'Bank statement' },
  table: { converterId: 'screenshot', label: 'Table' },
  receipt: { converterId: 'receipt', label: 'Receipt' },
  invoice: { converterId: 'invoice', label: 'Invoice' }
};

function onInstall(e) {
  onOpen(e);
}

function onOpen() {
  SpreadsheetApp.getUi()
    .createAddonMenu()
    .addItem('Import PDF', 'showSidebar')
    .addToUi();
}

function showSidebar() {
  var html = HtmlService.createHtmlOutputFromFile('Sidebar').setTitle('AI Converter');
  SpreadsheetApp.getUi().showSidebar(html);
}

/** Uploads one file and returns the free preview. */
function convertFile(upload) {
  var kind = KINDS[upload && upload.kind] || KINDS.bank;
  if (!upload || !upload.data) throw new Error('Choose a PDF or image first.');

  var bytes = Utilities.base64Decode(upload.data);
  var blob = Utilities.newBlob(bytes, upload.type || 'application/pdf', upload.name || 'upload.pdf');
  var form = {
    file: blob,
    converterId: kind.converterId,
    outputFormat: 'csv'
  };
  if (upload.password) form.pdfPassword = String(upload.password);

  var result = callApi_('/api/convert', { method: 'post', payload: form });
  if (result.status !== 'preview_ready') {
    throw new Error(result.message || result.error || 'This file could not be converted.');
  }

  saveLastJob_({
    jobId: result.jobId,
    token: result.token,
    fileName: upload.name || 'upload.pdf',
    kind: upload.kind || 'bank'
  });

  return {
    jobId: result.jobId,
    fileName: upload.name || 'upload.pdf',
    kindLabel: kind.label,
    columns: result.columns || [],
    previewRows: result.previewRows || [],
    rowCount: result.rowCount || 0,
    plan: result.plan || null,
    message: result.message || ''
  };
}

/** Inserts the free preview rows (already shown in the sidebar) into a new tab. */
function insertPreview(preview) {
  var job = requireLastJob_();
  var rows = (preview && preview.previewRows) || [];
  if (!rows.length) throw new Error('No preview rows are available for this file.');
  var columns = (preview.columns || []).filter(function (column) {
    return column && Object.prototype.hasOwnProperty.call(rows[0], column.key);
  });
  if (!columns.length) columns = columnsFromRows_(rows);
  return writeRows_(job.fileName + ' (preview)', columns, rows);
}

/** Creates a checkout link for the full extraction. */
function startCheckout() {
  var job = requireLastJob_();
  var result = callApi_('/api/checkout', {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify({ jobId: job.jobId, token: job.token, client: CLIENT_ID })
  });
  if (result.mode === 'checkout' && result.checkoutUrl) return { checkoutUrl: result.checkoutUrl };
  return { alreadyPaid: true };
}

/** After payment, runs the full extraction and writes every row into a new tab. */
function importAllRows() {
  var job = requireLastJob_();
  var finalized = callApi_('/api/finalize', {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify({ jobId: job.jobId, token: job.token })
  });
  if (finalized.status !== 'complete') {
    throw new Error(finalized.message || 'The full extraction is not ready yet. Try again in a minute.');
  }

  var rows = callApi_('/api/result-rows', {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify({ jobId: job.jobId, token: job.token })
  });
  var columns = (rows.columns || []).map(function (column) {
    return typeof column === 'string' ? { key: column, label: column } : column;
  });
  var written = writeRows_(job.fileName, columns, rows.rows || []);
  written.truncated = Boolean(rows.truncated);
  return written;
}

function getLastJob() {
  var job = loadLastJob_();
  return job ? { jobId: job.jobId, fileName: job.fileName, kind: job.kind } : null;
}

function callApi_(path, options) {
  var params = {
    method: options.method || 'post',
    muteHttpExceptions: true,
    headers: Object.assign(
      {
        Authorization: 'Bearer ' + ScriptApp.getIdentityToken(),
        'X-AIConverter-Client': CLIENT_ID
      },
      options.headers || {}
    )
  };
  if (options.payload !== undefined) params.payload = options.payload;
  if (options.contentType) params.contentType = options.contentType;

  var response = UrlFetchApp.fetch(API_BASE + path, params);
  var code = response.getResponseCode();
  var body = {};
  try {
    body = JSON.parse(response.getContentText() || '{}');
  } catch (error) {
    body = {};
  }
  if (code === 402) throw new Error('Payment has not arrived yet. Finish checkout, wait a moment, then try again.');
  if (code >= 400) throw new Error(body.error || 'AI Converter returned an error (' + code + ').');
  return body;
}

function writeRows_(title, columns, rows) {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = spreadsheet.insertSheet(uniqueSheetName_(spreadsheet, title));
  var header = columns.map(function (column) { return safeCell_(column.label || column.key); });
  var values = [header].concat(
    rows.map(function (row) {
      return columns.map(function (column) {
        return safeCell_(row[column.key]);
      });
    })
  );
  if (header.length) {
    sheet.getRange(1, 1, values.length, header.length).setValues(values);
    sheet.getRange(1, 1, 1, header.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  spreadsheet.setActiveSheet(sheet);
  return { sheetName: sheet.getName(), rowCount: rows.length };
}

/**
 * Converted text comes from uploaded documents, so a cell such as
 * "=IMPORTDATA(...)" must stay text instead of becoming a live formula.
 * Plain numbers like "-12.50" are left alone so they stay numbers.
 */
function safeCell_(value) {
  if (value === undefined || value === null) return '';
  if (typeof value !== 'string') return value;
  if (/^[-+]?\d[\d,]*(\.\d+)?$/.test(value.trim())) return value;
  return /^[\s\u0000-\u001f]*[=+\-@]/.test(value) ? "'" + value : value;
}

function columnsFromRows_(rows) {
  return Object.keys(rows[0] || {}).map(function (key) { return { key: key, label: key }; });
}

function uniqueSheetName_(spreadsheet, title) {
  var base = String(title || 'AI Converter').replace(/[\[\]\*\?\/\\:]/g, ' ').slice(0, 90).trim() || 'AI Converter';
  var name = base;
  var counter = 2;
  while (spreadsheet.getSheetByName(name)) {
    name = base + ' ' + counter;
    counter += 1;
  }
  return name;
}

function saveLastJob_(job) {
  PropertiesService.getUserProperties().setProperty(LAST_JOB_KEY, JSON.stringify(job));
}

function loadLastJob_() {
  var raw = PropertiesService.getUserProperties().getProperty(LAST_JOB_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (error) {
    return null;
  }
}

function requireLastJob_() {
  var job = loadLastJob_();
  if (!job || !job.jobId || !job.token) throw new Error('Upload a file first.');
  return job;
}
