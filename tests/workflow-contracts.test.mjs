import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const WORKFLOWS_DIR = path.join(REPO_ROOT, ".github", "workflows");
const OFF_SWITCH_HEADING = "## Automation Off-Switches";
const FULL_SHA = /^[0-9a-f]{40}$/;
const TRIGGER_ALIAS = new Map([
  ["push", /push|merge/i],
  ["pull_request", /pull request(?!-? event)|\bpr\b/i],
  ["pull_request_target", /pull-?request event/i],
  ["pull_request_review", /review submitted|pull-request review/i],
  ["workflow_dispatch", /manual|dispatch/i],
  ["schedule", /utc|schedule|cron|daily|weekly|hour/i],
  ["workflow_run", /after .*deploy|deploy succeeds|successful deploy|completed .*run/i],
  ["workflow_call", /called by another workflow|reusable/i],
  ["issues", /issue/i],
  ["issue_comment", /comment/i],
  ["label", /label event|labeled event/i],
  ["create", /tag pushed|branch pushed|new tag/i],
  ["delete", /branch or tag deleted/i],
  ["release", /release published/i],
  ["discussion", /discussion/i],
  ["merge_group", /merge queue/i]
]);

function triggerNames(name) {
  return [...triggerBlock(name).matchAll(/^ {2}([a-z_]+):/gm)].map((match) => match[1]);
}

function workflowNames() {
  return readdirSync(WORKFLOWS_DIR)
    .filter((name) => name.endsWith(".yml") || name.endsWith(".yaml"))
    .sort();
}

function workflowSource(name) {
  return readFileSync(path.join(WORKFLOWS_DIR, name), "utf8");
}

function triggerBlock(name) {
  const source = workflowSource(name);
  const start = source.search(/^on:/m);
  assert.notEqual(start, -1, `${name} declares no top-level on: block`);
  const rest = source.slice(start);
  const end = rest.search(/^(permissions|concurrency|env|defaults|jobs):/m);
  assert.notEqual(end, -1, `${name} on: block has no top-level terminator`);
  return rest.slice(0, end);
}

function offSwitchRows() {
  const readme = readFileSync(path.join(REPO_ROOT, "README.md"), "utf8");
  const heading = readme.indexOf(OFF_SWITCH_HEADING);
  assert.notEqual(heading, -1, `README.md carries no "${OFF_SWITCH_HEADING}" section`);
  const sectionEnd = readme.indexOf("\n## ", heading + OFF_SWITCH_HEADING.length);
  const section =
    sectionEnd === -1 ? readme.slice(heading) : readme.slice(heading, sectionEnd);
  return section
    .split("\n")
    .filter((line) => line.startsWith("| `"))
    .map((line) => line.split("|").slice(1, -1).map((cell) => cell.trim()));
}

test("every workflow file has a README off-switch row", () => {
  const documented = new Set(offSwitchRows().map((cells) => cells[0].replace(/`/g, "")));
  for (const name of workflowNames()) {
    assert.ok(documented.has(name), `README.md documents no off-switch for ${name}`);
  }
});

test("each off-switch row names what fires the workflow and one way to stop it", () => {
  const rows = offSwitchRows();
  assert.ok(rows.length > 0, "the off-switch table has no rows");
  for (const cells of rows) {
    assert.ok(cells.length >= 3, `off-switch row "${cells[0]}" is missing a column`);
    const [file, fires, offSwitch] = cells;
    const declared = triggerNames(file.replace(/`/g, ""));
    assert.ok(declared.length > 0, `off-switch row "${cells[0]}" names no real workflow file`);
    const claimed = [...TRIGGER_ALIAS]
      .filter(([, alias]) => alias.test(fires))
      .map(([trigger]) => trigger);
    assert.deepEqual(
      claimed.slice().sort(),
      declared.slice().sort(),
      `off-switch row "${file}" describes ${claimed.join(", ") || "no trigger"}, ` +
        `but the file declares ${declared.join(", ")}`
    );
    assert.ok(offSwitch.length > 20, `off-switch row "${file}" does not say how to stop it`);
    assert.match(
      offSwitch,
      /delete|remove/i,
      `off-switch row "${file}" names no delete or remove step`
    );
  }
});

test("deploy.yml runs on a push to main and a manual dispatch, with no schedule", () => {
  const triggers = triggerBlock("deploy.yml");
  assert.match(triggers, /^ {2}push:$/m);
  assert.match(triggers, /^ {6}- main$/m);
  assert.match(triggers, /^ {2}workflow_dispatch:$/m);
  assert.doesNotMatch(
    triggers,
    /schedule/,
    "the daily self-heal net expired once the Pages deploy settings were provisioned"
  );
});

test("agent-dispatch.yml stays a trigger stub that delegates to the fleet-ops dispatcher", () => {
  const source = workflowSource("agent-dispatch.yml");
  assert.match(
    source,
    /uses:\s*Nishfleet\/fleet-ops\/\.github\/workflows\/agent-dispatch\.yml@\S+/
  );
  assert.doesNotMatch(source, /runs-on:/, "the stub grew a runner job instead of delegating");
  assert.match(
    triggerBlock("agent-dispatch.yml"),
    /schedule:/,
    "the 6-hour sweep is what drains the labelled issue queue"
  );
});

test("lighthouse.yml audits the live pages through a SHA-pinned fleet-ops workflow", () => {
  const source = workflowSource("lighthouse.yml");
  const calls = [...source.matchAll(/uses:\s*(\S+)/g)].map((match) => match[1]);
  assert.ok(calls.length > 0, "lighthouse.yml calls no reusable workflow");
  for (const call of calls) {
    const parts = call.match(/^(\S+)@(\S+)$/);
    assert.ok(parts, `lighthouse.yml calls "${call}" without a ref`);
    const [, ref, sha] = parts;
    assert.ok(
      ref.startsWith("Nishfleet/fleet-ops/.github/workflows/"),
      `lighthouse.yml calls an unexpected reusable workflow: ${ref}`
    );
    assert.ok(
      FULL_SHA.test(sha),
      `${ref} is pinned to "${sha}", which is not a full commit SHA`
    );
  }
  assert.match(source, /urls:\s*\|\s*\n\s+https:\/\/aiconverter\.app\//);
  const audited = source.match(/https:\/\/aiconverter\.app\/[^\s|]*/g) ?? [];
  assert.ok(audited.length >= 3, `lighthouse.yml audits ${audited.length} page(s)`);
});

test("every required check context is reported by a job in this tree", () => {
  const required = ["Build", "Gitleaks", "Pricing check", "Unit tests", "actionlint", "semgrep"];
  const reported = new Map();
  for (const name of workflowNames()) {
    const source = workflowSource(name);
    const jobs = source.slice(source.search(/^jobs:/m));
    for (const context of required) {
      if (new RegExp(`^ {4}name: ${context}$`, "m").test(jobs)) {
        reported.set(context, name);
      }
    }
  }
  const missing = required.filter((context) => !reported.has(context));
  assert.deepEqual(missing, [], `no workflow in this tree reports: ${missing.join(", ")}`);
});

test("the check reporters fire on pull_request so a PR never waits on a silent check", () => {
  for (const name of ["ci.yml", "secret-scan.yml"]) {
    assert.match(
      triggerBlock(name),
      /^ {2}pull_request:$/m,
      `${name} does not fire on pull_request`
    );
  }
});
