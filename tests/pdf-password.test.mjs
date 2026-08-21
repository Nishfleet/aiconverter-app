import test from "node:test";
import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";
import path from "node:path";
import { register } from "node:module";

const mockLoaderUrl = pathToFileURL(path.resolve(process.cwd(), "tests/pdf-password-mock-loader.mjs")).href;
register(mockLoaderUrl, pathToFileURL("./"));

const extract = await import("../functions/lib/extract.js");
const convertModule = await import("../functions/api/convert.js");

const { detectPdfPageCount, convertPdfToCsv, sanitizePdfPassword, PdfPasswordRequiredError, PdfIncorrectPasswordError } = extract;

test("sanitizePdfPassword trims long passwords to 256 chars and treats nullish as empty", () => {
  assert.equal(sanitizePdfPassword(""), "");
  assert.equal(sanitizePdfPassword(null), "");
  assert.equal(sanitizePdfPassword(undefined), "");
  assert.equal(sanitizePdfPassword("secret"), "secret");
  assert.equal(sanitizePdfPassword("a".repeat(300)).length, 256);
});

test("PdfPasswordRequiredError carries user-facing message and stable error code", () => {
  const error = new PdfPasswordRequiredError();
  assert.equal(error.code, "pdf_password_required");
  assert.equal(error.passwordRequired, true);
  assert.match(error.message, /password-protected/i);
});

test("PdfIncorrectPasswordError carries user-facing message and stable error code", () => {
  const error = new PdfIncorrectPasswordError();
  assert.equal(error.code, "pdf_incorrect_password");
  assert.equal(error.passwordIncorrect, true);
  assert.match(error.message, /password/i);
});

test("detectPdfPageCount throws PdfPasswordRequiredError for encrypted PDF without password", async () => {
  await assert.rejects(
    detectPdfPageCount(new Uint8Array([0x25, 0x50, 0x44, 0x46]).buffer),
    (error) => error instanceof PdfPasswordRequiredError && error.code === "pdf_password_required"
  );
});

test("detectPdfPageCount throws PdfIncorrectPasswordError for encrypted PDF with wrong password", async () => {
  await assert.rejects(
    detectPdfPageCount(new Uint8Array([0x25, 0x50, 0x44, 0x46]).buffer, { pdfPassword: "wrong" }),
    (error) => error instanceof PdfIncorrectPasswordError && error.code === "pdf_incorrect_password"
  );
});

test("detectPdfPageCount succeeds with the correct password for encrypted PDF", async () => {
  const pages = await detectPdfPageCount(new Uint8Array([0x25, 0x50, 0x44, 0x46]).buffer, {
    pdfPassword: "secret"
  });
  assert.equal(pages, 3);
});

test("convertPdfToCsv surfaces password_required when PDF is encrypted and no password provided", async () => {
  const result = await convertPdfToCsv({}, "locked.pdf", new Uint8Array([0x25, 0x50, 0x44, 0x46]).buffer);
  assert.equal(result.ok, false);
  assert.equal(result.errorCode, "pdf_password_required");
  assert.equal(result.provider, "pdf-password-required");
  assert.match(result.message, /password/i);
});

test("convertPdfToCsv surfaces incorrect password error code", async () => {
  const result = await convertPdfToCsv(
    {},
    "locked.pdf",
    new Uint8Array([0x25, 0x50, 0x44, 0x46]).buffer,
    { pdfPassword: "wrong" }
  );
  assert.equal(result.ok, false);
  assert.equal(result.errorCode, "pdf_incorrect_password");
  assert.equal(result.provider, "pdf-incorrect-password");
});

test("convert.js returns 400 with password message when PDF is encrypted and no password provided", async () => {
  const env = makeConvertEnv();
  const form = new FormData();
  form.append("file", new File([new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34])], "statement.pdf", { type: "application/pdf" }));
  form.append("converterId", "bank");
  form.append("outputFormat", "csv");
  form.append("estimatedPages", "5");

  const request = new Request("https://aiconverter.app/api/convert", {
    method: "POST",
    body: form
  });

  const response = await convertModule.onRequestPost({ request, env });
  const body = await response.json();
  assert.equal(response.status, 400);
  assert.match(body.error || body.message || "", /password/i);
});

function makeConvertEnv() {
  const bucket = {
    put: async () => {},
    delete: async () => {}
  };
  const db = {
    prepare(sql) {
      return {
        bind() {
          if (sql.startsWith("INSERT INTO jobs")) {
            return { run: async () => ({ meta: { last_row_id: 1 } }) };
          }
          if (sql.startsWith("UPDATE jobs")) {
            return { run: async () => ({}) };
          }
          return {
            run: async () => ({}),
            first: async () => null,
            all: async () => []
          };
        }
      };
    }
  };
  return {
    AICONVERTER_BUCKET: bucket,
    AICONVERTER_DB: db,
    RATE_LIMIT_SALT: "test-salt-for-tests-with-enough-entropy",
    TURNSTILE_SITE_KEY: "",
    TURNSTILE_SECRET_KEY: ""
  };
}
