import path from "node:path";
import { fileURLToPath } from "node:url";
import { API_PREFIX } from "@monedin/contracts";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

/** El `.env` vive en la raíz del monorepo, no dentro de la app. */
const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

export default defineConfig(({ mode }) => {
  // `loadEnv` lee los archivos .env sin tocar el entorno del proceso, así que
  // esto no rompe la regla de que solo el módulo de configuración de la API lee
  // variables de entorno.
  const env = loadEnv(mode, repositoryRoot, "");

  const apiPort = Number(env.API_PORT ?? 3000);
  const webPort = Number(env.WEB_PORT ?? 5173);

  return {
    envDir: repositoryRoot,

    plugins: [TanStackRouterVite({ target: "react", autoCodeSplitting: true }), react()],

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
