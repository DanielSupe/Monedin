import path from "node:path";
import { fileURLToPath } from "node:url";
import { API_PREFIX } from "@monedin/contracts";
import tailwindcss from "@tailwindcss/vite";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

const appRoot = path.dirname(fileURLToPath(import.meta.url));

/** El `.env` vive en la raíz del monorepo, no dentro de la app. */
const repositoryRoot = path.resolve(appRoot, "../..");

export default defineConfig(({ mode }) => {
  // `loadEnv` lee los archivos .env sin tocar el entorno del proceso, así que
  // esto no rompe la regla de que solo el módulo de configuración de la API lee
  // variables de entorno.
  const env = loadEnv(mode, repositoryRoot, "");

  const apiPort = Number(env.API_PORT ?? 3000);
  const webPort = Number(env.WEB_PORT ?? 5173);

  /*
   * El catálogo vivo del sistema de diseño es un punto de entrada APARTE, y
   * fuera de producción no existe.
   *
   * Se decide con el `mode` que `defineConfig` ya recibe, y no con
   * `import.meta.env.DEV` dentro de la aplicación: eso habría exigido una
   * TERCERA excepción de `allowEnvAccess`, que CLAUDE.md marca como señal de que
   * algo se está haciendo mal, y además el código habría viajado igualmente en
   * el paquete. Ver decisión 5 del design de `add-design-system`.
   */
  const esProduccion = mode === "production";

  const entradas = esProduccion
    ? { index: path.resolve(appRoot, "index.html") }
    : {
        index: path.resolve(appRoot, "index.html"),
        ui: path.resolve(appRoot, "ui.html"),
      };

  return {
    envDir: repositoryRoot,

    build: {
      rollupOptions: { input: entradas },
    },

    plugins: [
      TanStackRouterVite({ target: "react", autoCodeSplitting: true }),
      react(),
      // Tailwind 4 no se configura en JavaScript: su tema vive en el bloque
      // `@theme` de `src/styles/tokens.css`. Ver decisión 1 del design.
      tailwindcss(),
    ],

    server: {
      port: webPort,
      strictPort: true,

      // Un SOLO origen en desarrollo: el navegador habla siempre con Vite, y
      // Vite reenvía lo que cuelga del prefijo de la API. Así las cookies de
      // sesión se comportan igual en local que detrás de Nginx en producción, y
      // CORS no aparece por ninguna parte. Ver decisión 6 del design.
      proxy: {
        [API_PREFIX]: {
          target: `http://localhost:${apiPort}`,
          changeOrigin: false,
        },
      },
    },
  };
});
