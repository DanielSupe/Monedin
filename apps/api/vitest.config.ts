import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    // Cada test controla su propio entorno; que Vitest no cargue ningún .env.
    env: {},
  },
});
