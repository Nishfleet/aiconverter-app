import js from "@eslint/js";
import noComments from "eslint-plugin-no-comments";
import globals from "globals";

const WORKAROUND_TERMS = [
  "todo",
  "fixme",
  "xxx",
  "hack",
  "workaround",
  "work around",
  "for now",
  "temporary",
  "temporarily",
  "not ideal",
  "should be",
  "ideally",
  "revisit",
  "later",
];

export default [
  { ignores: ["dist/**", "node_modules/**", "public/**", "var/**", "tests/**", "prototype-context/**", "marketing/**", ".agents/**"] },
  js.configs.recommended,
  {
    files: ["**/*.{js,jsx,mjs}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: { ...globals.browser, ...globals.node, ...globals.serviceworker },
    },
    linterOptions: { noInlineConfig: true, reportUnusedDisableDirectives: "error" },
  },
  { rules: { "no-unused-vars": ["error", { ignoreRestSiblings: true }] } },
  {
    files: ["src/**/*.{js,jsx,mjs}", "functions/**/*.js"],
    plugins: { "no-comments": noComments },
    rules: {
      "no-comments/disallowComments": ["error", { allow: ["eslint", "global", "upstream: https://"] }],
      "no-inline-comments": "error",
      "no-warning-comments": ["error", { terms: WORKAROUND_TERMS, location: "anywhere" }],
    },
  },
];
