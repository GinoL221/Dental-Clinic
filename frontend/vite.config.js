import { sveltekit } from "@sveltejs/kit/vite";
import { svelteTesting } from "@testing-library/svelte/vite";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [sveltekit(), svelteTesting()],
  // Pin to IPv4 loopback: some environments resolve 'localhost' to '::1'
  // only, which breaks the E2E runner's hardcoded 127.0.0.1 readiness probe.
  preview: {
    host: "127.0.0.1",
  },
  test: {
    include: ["src/**/*.{test,spec}.{js,ts}", "tests/*.test.js"],
    environment: "jsdom",
    globals: true,
    setupFiles: ["src/test/setup.js"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      include: ["src/**/*.{js,svelte}"],
      exclude: [
        "src/**/*.{test,spec}.js",
        "src/test/**",
        "src/routes/**/+page.svelte",
        "src/routes/**/+layout.svelte",
        "src/routes/**/+error.svelte",
      ],
      thresholds: {
        statements: 85,
        branches: 75,
        functions: 80,
        lines: 85,
      },
    },
  },
});
