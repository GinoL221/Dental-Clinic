import js from "@eslint/js";
import prettier from "eslint-config-prettier";
import svelte from "eslint-plugin-svelte";
import globals from "globals";

export default [
  {
    ignores: [
      ".svelte-kit/",
      "build/",
      "coverage/",
      "node_modules/",
      "playwright-report*/",
      "test-results*/",
      "static/",
    ],
  },
  js.configs.recommended,
  ...svelte.configs.recommended,
  prettier,
  ...svelte.configs.prettier,
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        // Loaded globally via static/js/lib/uPlot.min.js (declared in src/global.d.ts)
        uPlot: "readonly",
      },
    },
    rules: {
      "no-var": "error",
      "prefer-const": "error",
    },
  },
  {
    files: ["**/*.svelte", "**/*.svelte.js"],
    rules: {
      // The app is deployed at root (paths.base = "") and intentionally uses
      // literal root-relative href="/..." and goto("/...") links throughout.
      "svelte/no-navigation-without-resolve": "off",
      // In Svelte legacy (non-runes) mode, top-level `let` marks reactive state
      // even when mutated via property writes / `bind:value`.
      "prefer-const": "off",
    },
  },
  {
    files: ["src/**/*.{js,svelte}"],
    rules: {
      "no-console": "error",
    },
  },
  {
    files: ["src/utils/logger-server.js"],
    languageOptions: {
      sourceType: "commonjs",
    },
    rules: {
      "no-console": "off",
    },
  },
  {
    files: ["src/**/*.test.js", "src/test/**/*.js", "tests/**/*.js"],
    rules: {
      "no-console": "off",
    },
  },
];
