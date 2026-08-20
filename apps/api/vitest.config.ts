import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    // Recrea la base de datos de tests antes de la batería.
    globalSetup: ["tests/support/global-setup.ts"],
    // Los tests de datos comparten una base: en paralelo se pisarían el esquema
    // durante el arranque. Cada test se aísla con su propia transacción.
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 60_000,
  },
});
