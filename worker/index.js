import { onRequest as middleware } from "../functions/_middleware.js";
import { methodNotAllowed } from "../functions/lib/http.js";
import * as adminCheckoutDrill from "../functions/api/admin/checkout-drill.js";
import * as adminDodoPrices from "../functions/api/admin/dodo-prices.js";
import * as adminFailoverDrill from "../functions/api/admin/failover-drill.js";
import * as adminOverview from "../functions/api/admin/overview.js";
import * as adminRefundDrill from "../functions/api/admin/refund-drill.js";
import * as batchCheckout from "../functions/api/batch-checkout.js";
import * as batchDownload from "../functions/api/batch-download.js";
import * as checkout from "../functions/api/checkout.js";
import * as config from "../functions/api/config.js";
import * as conversionBrief from "../functions/api/conversion-brief.js";
import * as convert from "../functions/api/convert.js";
import * as deleteJob from "../functions/api/delete-job.js";
import * as download from "../functions/api/download.js";
import * as finalize from "../functions/api/finalize.js";
import * as funnelEvent from "../functions/api/funnel-event.js";
import * as health from "../functions/api/health.js";
import * as job from "../functions/api/job.js";
import * as previewDownload from "../functions/api/preview-download.js";
import * as pricingPreview from "../functions/api/pricing-preview.js";
import * as redo from "../functions/api/redo.js";
import * as resultRows from "../functions/api/result-rows.js";
import * as support from "../functions/api/support.js";
import * as updateResultRows from "../functions/api/update-result-rows.js";
import * as validationReport from "../functions/api/validation-report.js";
import * as dodoWebhook from "../functions/api/webhooks/dodo.js";

/** @typedef {{
 *   ASSETS?: { fetch: (request: Request) => Promise<Response> },
 *   [key: string]: unknown
 * }} WorkerEnv
 */

/** @typedef {{
 *   request: Request,
 *   env: WorkerEnv,
 *   params: Record<string, string>,
 *   data: Record<string, unknown>,
 *   waitUntil: (promise: Promise<unknown>) => void,
 *   next: () => Promise<Response>
 * }} PagesContext
 */

/** @typedef {{
 *   onRequest?: (context: PagesContext) => Response | Promise<Response>,
 *   onRequestGet?: (context: PagesContext) => Response | Promise<Response>,
 *   onRequestPost?: (context: PagesContext) => Response | Promise<Response>,
 *   onRequestPut?: (context: PagesContext) => Response | Promise<Response>,
 *   onRequestPatch?: (context: PagesContext) => Response | Promise<Response>,
 *   onRequestDelete?: (context: PagesContext) => Response | Promise<Response>,
 *   onRequestHead?: (context: PagesContext) => Response | Promise<Response>,
 *   onRequestOptions?: (context: PagesContext) => Response | Promise<Response>
 * }} RouteModule
 */

/** @type {Map<string, RouteModule>} Every file under functions/api/ maps to the URL Pages serves it on: functions/api/x.js serves /api/x and functions/api/admin/x.js serves /api/admin/x. tests/worker-routes.test.mjs reads the functions/api/ file list and fails when a route file has no mapping here. */
const ROUTES = new Map([
  ["/api/admin/checkout-drill", adminCheckoutDrill],
  ["/api/admin/dodo-prices", adminDodoPrices],
  ["/api/admin/failover-drill", adminFailoverDrill],
  ["/api/admin/overview", adminOverview],
  ["/api/admin/refund-drill", adminRefundDrill],
  ["/api/batch-checkout", batchCheckout],
  ["/api/batch-download", batchDownload],
  ["/api/checkout", checkout],
  ["/api/config", config],
  ["/api/conversion-brief", conversionBrief],
  ["/api/convert", convert],
  ["/api/delete-job", deleteJob],
  ["/api/download", download],
  ["/api/finalize", finalize],
  ["/api/funnel-event", funnelEvent],
  ["/api/health", health],
  ["/api/job", job],
  ["/api/preview-download", previewDownload],
  ["/api/pricing-preview", pricingPreview],
  ["/api/redo", redo],
  ["/api/result-rows", resultRows],
  ["/api/support", support],
  ["/api/update-result-rows", updateResultRows],
  ["/api/validation-report", validationReport],
  ["/api/webhooks/dodo", dodoWebhook]
]);

/** @type {Record<string, string>} */
const METHOD_HANDLERS = {
  GET: "onRequestGet",
  HEAD: "onRequestHead",
  POST: "onRequestPost",
  PUT: "onRequestPut",
  PATCH: "onRequestPatch",
  DELETE: "onRequestDelete",
  OPTIONS: "onRequestOptions"
};

export const ROUTE_PATHS = [...ROUTES.keys()].sort();

export default {
  /** @param {Request} request
   * @param {WorkerEnv} env
   * @param {{ waitUntil?: (promise: Promise<unknown>) => void }} [ctx]
   * @returns {Promise<Response>} */
  async fetch(request, env, ctx) {
    const route = ROUTES.get(new URL(request.url).pathname) || null;
    const data = {};
    const next = () => (route ? runRoute(route, request, env, ctx, data) : fetchAssets(request, env));
    return middleware({
      request,
      env,
      params: {},
      data,
      waitUntil: bindWaitUntil(ctx),
      next
    });
  }
};

/** @param {RouteModule} route
 * @param {Request} request
 * @param {WorkerEnv} env
 * @param {{ waitUntil?: (promise: Promise<unknown>) => void }} [ctx]
 * @param {Record<string, unknown>} data
 * @returns {Promise<Response>} */
async function runRoute(route, request, env, ctx, data) {
  const method = request.method.toUpperCase();
  const handler = selectHandler(route, method);
  if (!handler) {
    return withoutBodyIfHead(methodNotAllowed(allowedMethods(route)), method);
  }
  const response = await handler({
    request,
    env,
    params: {},
    data,
    waitUntil: bindWaitUntil(ctx),
    next: () => fetchAssets(request, env)
  });
  return withoutBodyIfHead(response, method);
}

/** @param {RouteModule} route
 * @param {string} method
 * @returns {((context: PagesContext) => Response | Promise<Response>) | null} */
function selectHandler(route, method) {
  const name = METHOD_HANDLERS[method] || "";
  const specific = name ? route[name] : null;
  if (typeof specific === "function") return specific;
  if (typeof route.onRequest === "function") return route.onRequest;
  return null;
}

/** @param {RouteModule} route
 * @returns {string} */
function allowedMethods(route) {
  if (typeof route.onRequest === "function") return "GET, POST, PUT, PATCH, DELETE, OPTIONS";
  const allowed = Object.values(METHOD_HANDLERS)
    .filter((name) => typeof route[name] === "function")
    .map((name) => name.replace("onRequest", "").toUpperCase());
  return allowed.join(", ") || "GET";
}

/** @param {Request} request
 * @param {WorkerEnv} env
 * @returns {Promise<Response>} */
async function fetchAssets(request, env) {
  if (!env.ASSETS || typeof env.ASSETS.fetch !== "function") {
    return new Response("Not found", {
      status: 404,
      headers: { "Content-Type": "text/plain; charset=utf-8" }
    });
  }
  return env.ASSETS.fetch(request);
}

/** @param {Response} response
 * @param {string} method
 * @returns {Response} */
function withoutBodyIfHead(response, method) {
  if (method !== "HEAD") return response;
  return new Response(null, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers
  });
}

/** @param {{ waitUntil?: (promise: Promise<unknown>) => void }} [ctx]
 * @returns {(promise: Promise<unknown>) => void} */
function bindWaitUntil(ctx) {
  if (!ctx || typeof ctx.waitUntil !== "function") return () => {};
  return ctx.waitUntil.bind(ctx);
}
