import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../src/main.jsx", import.meta.url), "utf8");
const styles = readFileSync(new URL("../src/styles.css", import.meta.url), "utf8");

test("cold homepage renders the What are you converting chooser before the upload target", () => {
  assert.match(source, /What are you converting\?/);
  const chooserIndex = source.indexOf("discovery-chooser");
  const uploadIndex = source.indexOf('className="upload-target"');
  assert.ok(chooserIndex > -1, "chooser markup must exist");
  assert.ok(uploadIndex > -1, "upload target markup must exist");
  assert.ok(uploadIndex > chooserIndex, "chooser must be placed before the upload target");
  assert.match(source, /discovery-chooser-heading/);
  assert.match(source, /Browse all formats/);
});

test("bank statement stays the obvious primary discovery action", () => {
  assert.match(source, /discovery-option is-primary/);
  assert.match(source, /<strong>Bank statement<\/strong>/);
  assert.match(source, /href="#start"/);
  assert.match(source, /Upload a bank statement for a private preview/);
  assert.match(source, /PDF to accounting CSV/);
});

test("chooser labels non-bank routes truthfully against the live catalog", () => {
  assert.match(source, /<strong>Receipt<\/strong>/);
  assert.match(source, /Image \/ PDF to expense CSV/);
  assert.match(source, /<strong>Invoice<\/strong>/);
  assert.match(source, /PDF \/ image to CSV, JSON/);
  assert.match(source, /<strong>Screenshot<\/strong>/);
  assert.match(source, /PNG \/ JPG to CSV/);
  assert.match(source, /<strong>Audio<\/strong>/);
  assert.match(source, /MP3 \/ WAV \/ M4A to transcript/);
  assert.match(source, /<strong>General formats<\/strong>/);
});

test("chooser routes visitors to the formats surface without overpromising pairs", () => {
  const formatsLinks = source.match(/href="\/formats\/"/g) || [];
  assert.ok(formatsLinks.length >= 6, `expected at least 6 /formats/ links, got ${formatsLinks.length}`);
  assert.match(source, /not every input\/output pair is\s+supported/);
  assert.match(source, /See the full catalog/);
  assert.match(source, /what is\s+coming soon/);
});

test("cold upload target accept behavior is unchanged", () => {
  assert.match(source, /accept=\{allAcceptedTypes\(selectableConverters\)\}/);
  assert.match(source, /onChange=\{handleFileChange\}/);
  assert.match(source, /type="file"/);
  assert.match(source, /multiple/);
});

test("chooser styles ship for keyboard and mobile layouts", () => {
  assert.match(styles, /\.discovery-chooser \{/);
  assert.match(styles, /\.discovery-chooser-options \{/);
  assert.match(styles, /\.discovery-option \{/);
  assert.match(styles, /\.discovery-option\.is-primary \{/);
  assert.match(styles, /\.discovery-chooser-note \{/);
  assert.match(styles, /\.discovery-option:hover/);
  assert.match(styles, /flex-wrap: wrap/);
  assert.match(styles, /\.discovery-chooser \{\s*margin: 0 0 10px;/);
});
