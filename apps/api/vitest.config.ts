import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],

    globalSetup: ["tests/support/global-setup.ts"],

    setupFiles: ["tests/support/setup.ts"],

    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 60_000,
  },
});
