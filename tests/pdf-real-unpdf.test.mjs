import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { extractText, getDocumentProxy } from "unpdf";
import { convertPdfToCsv } from "../functions/lib/extract.js";

const fixture = await readFile(new URL("./fixtures/statement.pdf", import.meta.url));
const fixtureBytes = () => new Uint8Array(fixture);

test("the installed unpdf extracts text and converts a real fixture PDF", async () => {
  const pdf = await getDocumentProxy(fixtureBytes());
  const { totalPages, text } = await extractText(pdf, { mergePages: false });
  await pdf.loadingTask.destroy();

  assert.equal(totalPages, 1);
  assert.match(text.join("\n"), /Northwind Bank/);

  const arrayBuffer = fixtureBytes().buffer;
  const result = await convertPdfToCsv({}, "statement.pdf", arrayBuffer, {});

  assert.equal(result.ok, true);
  assert.equal(result.provider, "native-pdf");
  assert.equal(result.rowCount, 5);
  assert.match(result.csv, /2026-05-02,Coffee Shop,,4\.50,995\.50/);
});
