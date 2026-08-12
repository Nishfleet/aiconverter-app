import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../src/main.jsx", import.meta.url), "utf8");
const styles = readFileSync(new URL("../src/styles.css", import.meta.url), "utf8");

function heroSection() {
  const start = source.indexOf('<div className="conversion-heading">');
  const end = source.indexOf('className={classNames("converter-workspace"');
  assert.ok(start !== -1 && end !== -1 && end > start, "hero heading and workspace must both exist in source order");
  return source.slice(start, end);
}

test("first viewport names the intended user beside the bank-to-accounting-CSV task statement", () => {
  const hero = heroSection();
  // The audience identifier is truthful to the live job: bank statement PDFs
  // become accounting CSV presets, so the intended users are accountants,
  // bookkeepers, and finance operators, not a generic visitor.
  assert.match(hero, /accountants/i);
  assert.match(hero, /bookkeepers/i);
  assert.match(hero, /finance operators/i);
  assert.match(hero, /accounting imports/i);
});

test("audience identifier stays visible in the 390x844 first viewport", () => {
  const hero = heroSection();
  // Static 390x844 visibility proxy: the line is a <p> inside
  // .conversion-heading (which precedes the converter workspace in source
  // order, i.e. above the fold), and its styling rule is a visible paragraph
  // rule — never display:none or visibility:hidden.
  const line = hero.slice(hero.lastIndexOf("<p>"), hero.indexOf("</div>", hero.lastIndexOf("<p>")));
  assert.match(line, /Built for accountants, bookkeepers, and finance operators/);
  const ruleStart = styles.indexOf(".conversion-heading p {");
  assert.ok(ruleStart !== -1, ".conversion-heading p rule must exist");
  const rule = styles.slice(ruleStart, styles.indexOf("}", ruleStart));
  assert.doesNotMatch(rule, /display\s*:\s*none/i);
  assert.doesNotMatch(rule, /visibility\s*:\s*hidden/i);
});

test("conversion promise and task statement stay intact", () => {
  assert.match(source, /Preview and sample before checkout/);
  assert.match(source, /Bank statement PDFs in/);
  assert.match(source, /Accounting CSV out/);
  assert.match(source, /download a free sample before unlocking the full export/);
  // No horizontal-overflow-prone styles added to the hero paragraph rule.
  const ruleStart = styles.indexOf(".conversion-heading p {");
  const rule = styles.slice(ruleStart, styles.indexOf("}", ruleStart));
  assert.doesNotMatch(rule, /white-space\s*:\s*nowrap/i);
});
