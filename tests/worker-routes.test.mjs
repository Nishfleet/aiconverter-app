import test from "node:test";
import assert from "node:assert/strict";
import { readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import worker, { ROUTE_PATHS } from "../worker/index.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const apiDirectory = path.join(root, "functions", "api");
const ORIGIN = "https://aiconverter.app";

async function apiRouteFiles(directory = apiDirectory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map((entry) => {
      const full = path.join(directory, entry.name);
      return entry.isDirectory() ? apiRouteFiles(full) : [full];
    })
  );
  return files.flat().filter((file) => file.endsWith(".js"));
}

function routePathFor(file) {
  const relative = path.relative(apiDirectory, file).split(path.sep).join("/");
  return `/api/${relative.replace(/\.js$/, "")}`;
}

function requestFor(routePath, method = "GET") {
  return new Request(new URL(routePath, ORIGIN), { method });
}

function fakeDatabase() {
  return {
    prepare(sql) {
      const statement = {
        sql,
        bind() {
          return statement;
        },
        async first() {
          return null;
        },
        async all() {
          return { results: [] };
        },
        async run() {
          return { success: true, meta: { changes: 0 } };
        }
      };
      return statement;
    }
  };
}

function fakeBucket() {
  return {
    async get() {
      return null;
    },
    async head() {
      return null;
    },
    async put() {},
    async delete() {}
  };
}

function stubEnv(assetRequests) {
  return {
    ASSETS: {
      async fetch(request) {
        const pathname = new URL(request.url).pathname;
        assetRequests.push(pathname);
        return new Response(`asset:${pathname}`, {
          status: 200,
          headers: { "Content-Type": "text/plain; charset=utf-8" }
        });
      }
    },
    AICONVERTER_DB: fakeDatabase(),
    AICONVERTER_BUCKET: fakeBucket(),
    RATE_LIMIT_SALT: "worker-routes-test-salt-value-1234",
    FREE_DOWNLOADS_ENABLED: "false"
  };
}

function executionContext() {
  return { waitUntil: () => {} };
}

async function responseShape(response) {
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    return { status: response.status, body: await response.text() };
  }
  const body = await response.json();
  delete body.generatedAt;
  return { status: response.status, body };
}

test("every functions/api file has a Worker route mapping", async () => {
  const files = await apiRouteFiles();
  const expected = files.map(routePathFor).sort();
  assert.ok(expected.length > 0, "the functions/api directory must hold route files");
  assert.deepEqual([...ROUTE_PATHS], expected);
});

test("every Worker route answers with its own Pages function handler", async () => {
  const files = await apiRouteFiles();
  for (const file of files) {
    const routePath = routePathFor(file);
    const routeModule = await import(pathToFileURL(file).href);
    const handler = routeModule.onRequestGet || routeModule.onRequest;
    assert.equal(typeof handler, "function", `${routePath} must export a request handler`);

    const assetRequests = [];
    const env = stubEnv(assetRequests);
    const response = await worker.fetch(requestFor(routePath), env, executionContext());

    assert.deepEqual(assetRequests, [], `${routePath} must not fall through to the asset server`);
    assert.match(response.headers.get("content-security-policy") || "", /default-src 'self'/);
    assert.equal(response.headers.get("cache-control"), "no-store");
    assert.match(response.headers.get("vary") || "", /Accept/, `${routePath} must pass through the middleware`);

    const direct = await handler({
      request: requestFor(routePath),
      env,
      params: {},
      data: {},
      waitUntil: () => {},
      next: async () => new Response("next")
    });
    assert.deepEqual(
      await responseShape(response),
      await responseShape(direct),
      `${routePath} must answer with the response of its own handler`
    );
  }
});

test("an unknown path reaches the asset server", async () => {
  const assetRequests = [];
  const response = await worker.fetch(requestFor("/not-a-route"), stubEnv(assetRequests), executionContext());

  assert.equal(response.status, 200);
  assert.equal(await response.text(), "asset:/not-a-route");
  assert.deepEqual(assetRequests, ["/not-a-route"]);
});

test("a method the route does not handle answers 405", async () => {
  const assetRequests = [];
  const response = await worker.fetch(requestFor("/api/health", "PUT"), stubEnv(assetRequests), executionContext());

  assert.equal(response.status, 405);
  assert.deepEqual(assetRequests, []);
  assert.equal(response.headers.get("allow"), "GET, POST");
  assert.match((await response.json()).error, /method not allowed/i);
});

test("a POST request calls the POST handler of the route module", async () => {
  const assetRequests = [];
  const env = stubEnv(assetRequests);
  const response = await worker.fetch(requestFor("/api/health", "POST"), env, executionContext());

  assert.equal(response.status, 405);
  assert.equal(response.headers.get("allow"), "GET");
  assert.match((await response.json()).error, /use get/i);
  assert.deepEqual(assetRequests, []);
});

test("the Pages middleware runs before the route and the asset server", async () => {
  const assetRequests = [];
  const env = stubEnv(assetRequests);
  const response = await worker.fetch(
    new Request(new URL("/pricing", ORIGIN), { headers: { Accept: "text/markdown" } }),
    env,
    executionContext()
  );

  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") || "", /text\/markdown/);
  assert.match(await response.text(), /AI Converter/);
  assert.deepEqual(assetRequests, [], "the middleware answers page requests before the asset server");

  const assetResponse = await worker.fetch(requestFor("/not-a-route"), env, executionContext());
  assert.match(assetResponse.headers.get("content-security-policy") || "", /default-src 'self'/);
});

test("a HEAD request without a HEAD handler answers 405", async () => {
  const assetRequests = [];
  const response = await worker.fetch(requestFor("/api/health", "HEAD"), stubEnv(assetRequests), executionContext());

  assert.equal(response.status, 405);
  assert.equal(await response.text(), "");
  assert.deepEqual(assetRequests, []);
});
