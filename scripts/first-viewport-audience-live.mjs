import { chromium } from "playwright";
import { resolve } from "node:path";

const DEFAULT_URL = "https://aiconverter.app/";
const EXPECTED_PHRASE = "Built for accountants, bookkeepers, and finance operators preparing accounting imports from bank statements.";
const WIDTH = 390;
const HEIGHT = 844;

function resolveTarget(arg) {
  if (!arg) return null;
  if (/^https?:\/\//i.test(arg) || arg.startsWith("file://")) return arg;
  return "file://" + resolve(arg);
}

const targetArg = process.argv[2] || process.env.AICONVERTER_LIVE_URL;
const target = resolveTarget(targetArg) || DEFAULT_URL;
const started = new Date().toISOString();
const waitUntil = target.startsWith("file:") ? "load" : "networkidle";

let browser;
let exitCode = 1;
try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: WIDTH, height: HEIGHT }, isMobile: true });
  const response = await page.goto(target, { waitUntil });
  await page.waitForTimeout(2000);

  const evaluated = await page.evaluate(() => {
    const leaves = [...document.querySelectorAll("body *")].filter((el) => {
      const rect = el.getBoundingClientRect();
      const style = getComputedStyle(el);
      return (
        rect.bottom > 0 &&
        rect.top < innerHeight &&
        rect.right > 0 &&
        rect.left < innerWidth &&
        style.display !== "none" &&
        style.visibility !== "hidden" &&
        el.children.length === 0
      );
    });
    return {
      text: leaves
        .map((el) => (el.innerText || "").trim())
        .filter(Boolean)
        .join(" | ")
        .replace(/\s+/g, " ")
        .slice(0, 900),
      sw: document.documentElement.scrollWidth,
      cw: document.documentElement.clientWidth
    };
  });

  const status = response?.status() ?? (target.startsWith("file:") ? 200 : null);
  const ok = evaluated.text.includes(EXPECTED_PHRASE);
  const result = { ...evaluated, target, started, status, ok, phrase: EXPECTED_PHRASE };

  const summary = `${ok ? "PASS" : "FAIL"}: audience sentence ${ok ? "found" : "missing"} at ${target} (status=${status}, sw=${evaluated.sw}, cw=${evaluated.cw}, started=${started})`;
  console.log(summary);
  console.log(JSON.stringify(result, null, 2));
  exitCode = ok ? 0 : 1;
} finally {
  if (browser) await browser.close();
}
process.exit(exitCode);
