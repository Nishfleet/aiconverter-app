// Covers the three Workers AI limits behind issue #243:
//   1. the statement extractor had no max_tokens, and Workers AI defaults it to
//      256 (Workers AI changelog 2025-02-21), so long statements came back as
//      truncated JSON that parseAiJson rejected;
//   2. the vision HTML route capped a full page at 4096 tokens and never looked
//      at the stop reason;
//   3. no Workers AI call was routed through AI Gateway, so no usage was logged.
import test from "node:test";
import assert from "node:assert/strict";
import { convertFileToCsv } from "../functions/lib/extract.js";

const PNG_BYTES = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).buffer;
const STATEMENT_MODEL = "@cf/meta/llama-3.1-8b-instruct-fast";

// The statement route parses the PDF first (assertPdfDecryptable), so these
// tests need real PDF bytes rather than a stub buffer.
function buildPdf(lines) {
  const stream = [
    "BT",
    "/F1 10 Tf",
    "50 760 Td",
    ...lines.flatMap((line, index) => [...(index ? ["0 -16 Td"] : []), `(${String(line).replace(/([\\()])/g, "\\$1")}) Tj`]),
    "ET"
  ].join("\n");

  const objects = [
    "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n",
    "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n",
    "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n",
    "4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n",
    `5 0 obj\n<< /Length ${stream.length} >>\nstream\n${stream}\nendstream\nendobj\n`
  ];

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  for (const object of objects) {
    offsets.push(pdf.length);
    pdf += object;
  }
  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let index = 1; index < offsets.length; index += 1) {
    pdf += `${String(offsets[index]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Root 1 0 R /Size ${objects.length + 1} >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  return new TextEncoder().encode(pdf).buffer;
}

const STATEMENT_PDF = buildPdf([
  "Date Description Money Out Money In Balance",
  "2026-04-01 Opening Deposit 0.00 1000.00 1000.00",
  "2026-04-02 Coffee Shop 4.50 0.00 995.50"
]);

function transactionRow(date, description, moneyOut, balance) {
  return {
    date,
    description,
    money_in: null,
    money_out: moneyOut,
    balance,
    page: 1,
    confidence: 0.9
  };
}

// A statement whose running balance actually adds up, so the trust checks in
// validate-statement.js pass and a failure points at chunking, not at the
// fixture.
function balancedRows(count) {
  const rows = [];
  let balance = 5000;
  for (let row = 0; row < count; row += 1) {
    const moneyOut = Number((20 + row * 1.5).toFixed(2));
    balance = Number((balance - moneyOut).toFixed(2));
    rows.push(
      transactionRow(
        `2026-04-${String((row % 28) + 1).padStart(2, "0")}`,
        `Payment to merchant ${row} of a fairly long description here`,
        moneyOut,
        balance
      )
    );
  }
  return rows;
}

function statementPage(rows) {
  return rows
    .map((row) => `${row.date}  ${row.description}  ${row.money_out}  ${row.balance}`)
    .join("\n");
}

function multiPageStatement(pages) {
  return pages.map((rows) => `## Account activity\n\n${statementPage(rows)}`).join("\f\n");
}

const SIMPLE_STATEMENT = multiPageStatement([
  [
    transactionRow("2026-04-01", "Opening coffee", 4.5, 1200),
    transactionRow("2026-04-02", "Grocery store", 62.1, 1137.9)
  ]
]);

function envWithAi(run, extra = {}) {
  return {
    AI: {
      async toMarkdown() {
        return { format: "markdown", mimetype: "application/pdf", data: SIMPLE_STATEMENT };
      },
      run
    },
    ALLOW_CLOUDFLARE_FALLBACK: "true",
    ...extra
  };
}

// The built-in PDF parser runs first and would win on this fixture, so these
// tests take the Workers AI route only. `forceProvider: "mistral"` skips the
// native parser and, with no Mistral credentials configured, falls through to
// the cloudflare-ai fallback these tests are about.
const AI_ROUTE = { forceProvider: "mistral" };

test("statement extraction merges every chunk of a multi-page statement", async () => {
  // 120 rows of real-size statement text is over 8000 characters, so this is
  // the shape that forced the old single call past the platform's 256-token
  // default and produced truncated JSON.
  const allRows = balancedRows(120);
  const statement = statementPage(allRows);
  assert.ok(statement.length > 8000, `fixture must exceed one chunk, got ${statement.length}`);

  const calls = [];
  const env = {
    AI: {
      async toMarkdown() {
        return {
          format: "markdown",
          mimetype: "application/pdf",
          data: statement
        };
      },
      async run(model, input) {
        calls.push({ model, input });
        const chunk = input.messages[1].content;
        const rows = allRows.filter((row) => chunk.includes(row.description));
        return {
          response: JSON.stringify({ confidence: 0.9, currency: "USD", transactions: rows, warnings: [] }),
          finish_reason: "stop"
        };
      }
    },
    ALLOW_CLOUDFLARE_FALLBACK: "true"
  };

  const result = await convertFileToCsv(env, "bank", "statement.pdf", "application/pdf", STATEMENT_PDF, AI_ROUTE);

  assert.equal(result.ok, true);
  // More than one AI call means the statement was split instead of asked for in
  // one response that cannot hold it.
  assert.ok(calls.length >= 2, `expected more than one AI call, got ${calls.length}`);
  assert.equal(result.provider, "cloudflare-ai");
  assert.equal(result.rowCount, allRows.length);
  for (const row of [allRows[0], allRows[59], allRows[60], allRows[119]]) {
    assert.ok(result.csv.includes(row.description.slice(0, 20)), `missing row: ${row.description}`);
  }
});

test("statement extraction sends max_tokens and an AI Gateway on every call", async () => {
  const calls = [];
  const env = envWithAi(async (model, input, options) => {
    calls.push({ model, input, options });
    return {
      response: JSON.stringify({
        confidence: 0.9,
        transactions: [transactionRow("2026-04-01", "Opening coffee", 4.5, 1200)],
        warnings: []
      }),
      finish_reason: "stop"
    };
  });

  const result = await convertFileToCsv(env, "bank", "statement.pdf", "application/pdf", STATEMENT_PDF, AI_ROUTE);

  assert.equal(result.ok, true);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].model, STATEMENT_MODEL);
  // Without this the platform caps the response at 256 tokens and the JSON is
  // cut in half. The gateway header keeps the usage metadata row but never the
  // statement text itself.
  assert.equal(calls[0].input.max_tokens, 4096);
  assert.deepEqual(calls[0].options, {
    gateway: { id: "default" },
    extraHeaders: { "cf-aig-collect-log-payload": "false" }
  });
});

test("a response cut at the ceiling is caught even when finish_reason is missing", async () => {
  // Some Workers AI models never report finish_reason; the usage counts are the
  // fallback truncation signal, because completion tokens at the ceiling mean
  // the tail of the JSON is gone.
  const env = envWithAi(async () => ({
    response: JSON.stringify({
      confidence: 0.9,
      transactions: [transactionRow("2026-04-01", "Opening coffee", 4.5, 1200)],
      warnings: []
    }),
    usage: { prompt_tokens: 2100, completion_tokens: 4096, total_tokens: 6196 }
  }));

  const result = await convertFileToCsv(env, "bank", "statement.pdf", "application/pdf", STATEMENT_PDF, AI_ROUTE);

  assert.equal(result.ok, false);
  assert.match(result.message, /response limit/);
});

test("document conversion is not routed through the gateway option", async () => {
  // toMarkdown takes conversion options as its second argument (Workers AI docs,
  // Markdown Conversion > Workers Binding), so passing gateway options there
  // would be dead weight at best and junk input at worst.
  const calls = [];
  const env = {
    AI: {
      async toMarkdown(...args) {
        calls.push(args);
        return { format: "markdown", mimetype: "application/pdf", data: SIMPLE_STATEMENT };
      },
      async run() {
        return {
          response: JSON.stringify({
            confidence: 0.9,
            transactions: [transactionRow("2026-04-01", "Opening coffee", 4.5, 1200)],
            warnings: []
          }),
          finish_reason: "stop"
        };
      }
    },
    ALLOW_CLOUDFLARE_FALLBACK: "true"
  };

  const result = await convertFileToCsv(env, "bank", "statement.pdf", "application/pdf", STATEMENT_PDF, AI_ROUTE);

  assert.equal(result.ok, true);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].length, 1, `toMarkdown must take only the document, got ${calls[0].length} arguments`);
});

test("a statement response that stops at the token limit fails instead of parsing half a file", async () => {
  const env = envWithAi(async () => ({
    // What the model returns when it hits max_tokens: valid JSON up to the cut.
    response: JSON.stringify({
      confidence: 0.9,
      transactions: [transactionRow("2026-04-01", "Opening coffee", 4.5, 1200)],
      warnings: []
    }).slice(0, 60),
    finish_reason: "length"
  }));

  const result = await convertFileToCsv(env, "bank", "statement.pdf", "application/pdf", STATEMENT_PDF, AI_ROUTE);

  assert.equal(result.ok, false);
  assert.match(result.message, /response limit/);
  assert.match(result.message, /No charge was made/);
});

test("STATEMENT_MAX_TOKENS overrides the default response ceiling", async () => {
  let seen = null;
  const env = envWithAi(
    async (model, input) => {
      seen = input.max_tokens;
      return {
        response: JSON.stringify({
          confidence: 0.9,
          transactions: [transactionRow("2026-04-01", "Opening coffee", 4.5, 1200)],
          warnings: []
        }),
        finish_reason: "stop"
      };
    },
    { STATEMENT_MAX_TOKENS: "12000" }
  );

  await convertFileToCsv(env, "bank", "statement.pdf", "application/pdf", STATEMENT_PDF, AI_ROUTE);

  assert.equal(seen, 12000);
});

test("AI_GATEWAY_ENABLED=false leaves the gateway off", async () => {
  let seen = "unset";
  const env = envWithAi(
    async (model, input, options) => {
      seen = options;
      return {
        response: JSON.stringify({
          confidence: 0.9,
          transactions: [transactionRow("2026-04-01", "Opening coffee", 4.5, 1200)],
          warnings: []
        }),
        finish_reason: "stop"
      };
    },
    { AI_GATEWAY_ENABLED: "false" }
  );

  await convertFileToCsv(env, "bank", "statement.pdf", "application/pdf", STATEMENT_PDF, AI_ROUTE);

  assert.equal(seen, undefined);
});

// Chunks never overlap, so a transaction row comes back from exactly one call.
// The merge must therefore keep rows as they arrive: deduplicating identical
// rows would drop genuine repeat charges (same date, description and amounts
// with no balance to tell them apart) and understate the customer's totals.
test("genuinely identical repeat charges are not silently dropped", async () => {
  const rows = balancedRows(20).map((row) => ({ ...row, balance: null }));
  // A statement can hold two charges that look exactly alike and are both real:
  // the model returns 21 rows for 20 statement lines plus one repeat.
  const modelRows = [...rows, rows[5]];
  const env = {
    AI: {
      async toMarkdown() {
        return { format: "markdown", mimetype: "application/pdf", data: statementPage(rows) };
      },
      async run(model, input) {
        const chunk = input.messages[1].content;
        const returned = modelRows.filter((row) => chunk.includes(row.description));
        return {
          response: JSON.stringify({ confidence: 0.9, transactions: returned, warnings: [] }),
          finish_reason: "stop"
        };
      }
    },
    ALLOW_CLOUDFLARE_FALLBACK: "true"
  };

  const result = await convertFileToCsv(env, "bank", "statement.pdf", "application/pdf", STATEMENT_PDF, AI_ROUTE);

  assert.equal(result.ok, true);
  assert.equal(result.rowCount, modelRows.length);
});

test("a page longer than one chunk is split on line boundaries, never mid-row", async () => {
  // A statement with a form-feed page whose rows overrun a single chunk. A cut
  // at an arbitrary offset lands inside a row line; line packing cannot. (With
  // no page breaks the text already splits on lines, so this fixture needs the
  // page marker to reach the oversized-page path.)
  const fixedRow = (index) => {
    const date = `2026-04-${String((index % 28) + 1).padStart(2, "0")}`;
    const description = `Payment to merchant ${String(index).padStart(3, "0")}`.padEnd(40, ".");
    const moneyOut = String((20 + index * 1.5).toFixed(2)).padStart(8, " ");
    const balance = String((9000 - index * 1.5).toFixed(2)).padStart(10, " ");
    return `${date}  ${description}  ${moneyOut}  ${balance}`;
  };
  const openerRow = fixedRow(200);
  const pageRows = Array.from({ length: 140 }, (_, index) => fixedRow(index));
  const statement = `${openerRow}\f\n${pageRows.join("\n")}`;
  assert.ok(pageRows.join("\n").length > 8000, `fixture page must exceed one chunk, got ${pageRows.join("\n").length}`);
  const fullLines = new Set([openerRow, ...pageRows]);
  const allRows = balancedRows(140).map((row, index) => ({
    ...row,
    description: `Payment to merchant ${String(index).padStart(3, "0")}`
  }));

  const env = {
    AI: {
      async toMarkdown() {
        return { format: "markdown", mimetype: "application/pdf", data: statement };
      },
      async run(model, input) {
        const chunk = input.messages[1].content;
        // Every chunk must end on a complete statement line. A chunk whose last
        // line is not a real row means the boundary cut a transaction in half.
        const lastLine = chunk.split("\n").pop();
        if (lastLine && !fullLines.has(lastLine)) {
          throw new Error(`chunk boundary cut a row: ${JSON.stringify(lastLine)}`);
        }
        const rows = allRows.filter((row) => chunk.includes(row.description));
        return {
          response: JSON.stringify({ confidence: 0.9, transactions: rows, warnings: [] }),
          finish_reason: "stop"
        };
      }
    },
    ALLOW_CLOUDFLARE_FALLBACK: "true"
  };

  const result = await convertFileToCsv(env, "bank", "statement.pdf", "application/pdf", STATEMENT_PDF, AI_ROUTE);

  assert.equal(result.ok, true);
  assert.equal(result.rowCount, allRows.length);
});

test("preview still reads only the first section of an over-budget statement", async () => {
  const page = statementPage(balancedRows(48));
  const statement = Array.from({ length: 16 }, () => page).join("\f\n");
  const env = {
    AI: {
      async toMarkdown() {
        return { format: "markdown", mimetype: "application/pdf", data: statement };
      },
      async run() {
        return {
          response: JSON.stringify({ confidence: 0.9, transactions: balancedRows(2), warnings: [] }),
          finish_reason: "stop"
        };
      }
    },
    ALLOW_CLOUDFLARE_FALLBACK: "true"
  };

  const result = await convertFileToCsv(env, "bank", "statement.pdf", "application/pdf", STATEMENT_PDF, {
    ...AI_ROUTE,
    previewPages: true
  });

  // Preview takes the first section only, so the section budget never trips.
  assert.equal(result.ok, true);
});

test("a statement needing more sections than the budget fails instead of dropping pages", async () => {
  // 16 pages of just over 4000 characters: no two pages fit in one chunk, so
  // the text needs 16 sections against a budget of 15. Slicing used to drop
  // the 16th page with no error and an export that looked complete.
  const pageRows = balancedRows(52);
  const page = statementPage(pageRows);
  assert.ok(page.length > 4000 && page.length < 8000, `fixture page must be over half a chunk, got ${page.length}`);
  const statement = Array.from({ length: 16 }, () => page).join("\f\n");
  let calls = 0;
  const env = {
    AI: {
      async toMarkdown() {
        return { format: "markdown", mimetype: "application/pdf", data: statement };
      },
      async run() {
        calls += 1;
        return {
          response: JSON.stringify({ confidence: 0.9, transactions: pageRows, warnings: [] }),
          finish_reason: "stop"
        };
      }
    },
    ALLOW_CLOUDFLARE_FALLBACK: "true"
  };

  const result = await convertFileToCsv(env, "bank", "statement.pdf", "application/pdf", STATEMENT_PDF, AI_ROUTE);

  assert.equal(result.ok, false);
  assert.match(result.message, /too long to read in full/);
  // The guard runs before any paid call.
  assert.equal(calls, 0);
});

test("an over-long statement fails instead of quietly returning only its first pages", async () => {
  let calls = 0;
  const rows = balancedRows(120);
  // Past the 120,000-character read limit of the markdown conversion.
  const statement = Array.from({ length: 30 }, () => statementPage(rows)).join("\n\n");
  assert.ok(statement.length > 120000, `fixture must exceed the read limit, got ${statement.length}`);
  const env = {
    AI: {
      async toMarkdown() {
        return { format: "markdown", mimetype: "application/pdf", data: statement };
      },
      async run() {
        calls += 1;
        return {
          response: JSON.stringify({ confidence: 0.9, transactions: rows, warnings: [] }),
          finish_reason: "stop"
        };
      }
    },
    ALLOW_CLOUDFLARE_FALLBACK: "true"
  };

  const result = await convertFileToCsv(env, "bank", "statement.pdf", "application/pdf", STATEMENT_PDF, AI_ROUTE);

  assert.equal(result.ok, false);
  assert.match(result.message, /too long to read in full/);
  // The guard runs before any paid call.
  assert.equal(calls, 0);
});

test("vision HTML asks for 8192 tokens by default", async () => {
  let seen = null;
  const env = {
    AI: {
      async run(model, input, options) {
        seen = { maxTokens: input.max_tokens, options };
        return {
          response:
            "<!doctype html><html><head><title>Settings</title></head><body><main><h1>Settings</h1></main></body></html>",
          finish_reason: "stop"
        };
      }
    }
  };

  const result = await convertFileToCsv(
    env,
    "screenshot-code",
    "settings.png",
    "image/png",
    PNG_BYTES,
    { allowPaidFallback: true }
  );

  assert.equal(result.ok, true);
  assert.equal(seen.maxTokens, 8192);
  assert.deepEqual(seen.options, {
    gateway: { id: "default" },
    extraHeaders: { "cf-aig-collect-log-payload": "false" }
  });
});

test("SCREENSHOT_CODE_MAX_TOKENS still overrides the vision ceiling", async () => {
  let seen = null;
  const env = {
    AI: {
      async run(model, input) {
        seen = input.max_tokens;
        return {
          response:
            "<!doctype html><html><head><title>Settings</title></head><body><main><h1>Settings</h1></main></body></html>",
          finish_reason: "stop"
        };
      }
    },
    SCREENSHOT_CODE_MAX_TOKENS: "16384"
  };

  const result = await convertFileToCsv(
    env,
    "screenshot-code",
    "settings.png",
    "image/png",
    PNG_BYTES,
    { allowPaidFallback: true }
  );

  assert.equal(result.ok, true);
  assert.equal(seen, 16384);
});

test("vision HTML that stops at the token limit is not shipped as a half page", async () => {
  const env = {
    AI: {
      async run() {
        return {
          response: "<!doctype html><html><head><title>Settings</title><style>body{color:red}",
          finish_reason: "length"
        };
      }
    }
  };

  const result = await convertFileToCsv(
    env,
    "screenshot-code",
    "settings.png",
    "image/png",
    PNG_BYTES,
    { allowPaidFallback: true }
  );

  assert.equal(result.ok, false);
  assert.match(result.message, /complete HTML file/);
});

test("audio transcription routes through AI Gateway too", async () => {
  let seen = "unset";
  const env = {
    AI: {
      async run(model, input, options) {
        seen = { model, task: input.task, options };
        return { text: "invoice total is forty two euros" };
      }
    }
  };

  const result = await convertFileToCsv(env, "audio-transcript", "memo.m4a", "audio/mp4", PNG_BYTES);

  assert.equal(result.ok, true);
  assert.equal(seen.model, "@cf/openai/whisper-large-v3-turbo");
  assert.equal(seen.task, "transcribe");
  assert.deepEqual(seen.options, {
    gateway: { id: "default" },
    extraHeaders: { "cf-aig-collect-log-payload": "false" }
  });
});
