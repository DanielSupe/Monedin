import path from "node:path";
import { fileURLToPath } from "node:url";
import { API_PREFIX } from "@monedin/contracts";
import tailwindcss from "@tailwindcss/vite";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

const appRoot = path.dirname(fileURLToPath(import.meta.url));

const repositoryRoot = path.resolve(appRoot, "../..");

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, repositoryRoot, "");

  const apiPort = Number(env.API_PORT ?? 3000);
  const webPort = Number(env.WEB_PORT ?? 5173);

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

      tailwindcss(),
    ],

    server: {
      port: webPort,
      strictPort: true,

      proxy: {
        [API_PREFIX]: {
          target: `http://localhost:${apiPort}`,
          changeOrigin: false,
        },
      },
    },
  };
});
