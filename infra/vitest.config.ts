/// <reference types="vitest" />

import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["test/**/*.test.ts", "functions/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: ["node_modules/", "test/", "dist/"],
    },
    setupFiles: [],
    logHeapUsage: true,
  },
});
