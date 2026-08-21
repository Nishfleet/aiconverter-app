// Module loader that mocks unpdf for password-protected PDF tests.
// Replaces unpdf.getDocumentProxy with a function that:
//  - throws "password required" when no password is provided
//  - throws "incorrect password" when a non-empty password is provided
//    but does not equal "secret"
//  - returns a 3-page PDF document proxy when password === "secret"
//
// Activated only when registered via node:module register from
// tests/pdf-password.test.mjs. Other tests are unaffected because they
// do not register this loader.

const MOCK_PAGES = 3;
const CORRECT_PASSWORD = "secret";

export async function resolve(specifier, context, nextResolve) {
  const result = await nextResolve(specifier, context);
  if (result.url && result.url.includes("/node_modules/unpdf/")) {
    return { ...result, url: result.url + "?mock=pwd" };
  }
  return result;
}

export async function load(url, context, nextLoad) {
  if (!url.includes("/node_modules/unpdf/")) {
    return nextLoad(url, context);
  }
  const source = `
const pdfjsMock = {
  numPages: ${MOCK_PAGES},
  destroy: async () => {},
  getPage: async () => ({
    getTextContent: async () => ({ items: [] })
  })
};

export async function getDocumentProxy(data, options = {}) {
  const providedPassword = options && typeof options.password === "string" ? options.password : "";
  if (!providedPassword) {
    const error = new Error("Password required to open this PDF.");
    error.name = "PasswordException";
    throw error;
  }
  if (providedPassword !== ${JSON.stringify(CORRECT_PASSWORD)}) {
    const error = new Error("Incorrect password.");
    error.name = "PasswordException";
    throw error;
  }
  return pdfjsMock;
}

export async function extractText(pdf, options = {}) {
  return { totalPages: pdf.numPages, text: Array.from({ length: pdf.numPages }, () => "") };
}

export async function extractTextItems(pdf) {
  return [];
}

export async function extractImages(pdf, pageNumber) {
  return [];
}

export async function extractLinks(pdf, pageNumber) {
  return [];
}

export async function getMeta(pdf) {
  return { info: {}, metadata: null };
}

export async function renderPageAsImage() {
  throw new Error("renderPageAsImage not implemented in mock");
}

export async function getResolvedPDFJS() {
  return {};
}

export async function resolvePDFJSImport() {}

export async function configureUnPDF() {}

export function createIsomorphicCanvasFactory() {
  return { reset() {}, destroy() {} };
}

export function definePDFJSModule() {}

const isPDFDocumentProxy = (data) => data && "_pdfInfo" in data;
export { isPDFDocumentProxy };
`;
  return { format: "module", source, shortCircuit: true };
}
