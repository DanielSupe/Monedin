import { defineConfig } from "vitest/config";

/**
 * Los tests del front montan componentes, así que necesitan un DOM.
 *
 * `jsdom` en lugar de `node` desde `add-design-system`: sin un documento no se
 * puede comprobar que un diálogo atrapa el foco ni que un aviso se anuncia, que
 * es justo lo que hay que probar de una pieza de interfaz. Los tests de cliente
 * de API, que no montan nada, funcionan igual bajo `jsdom`.
 */
export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.{ts,tsx}"],
  },
});
