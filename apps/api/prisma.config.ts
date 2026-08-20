import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { defineConfig, env } from "prisma/config";

/**
 * Configuración de las herramientas de línea de comandos de Prisma.
 *
 * ESTE ARCHIVO ES LA SEGUNDA Y ÚLTIMA EXCEPCIÓN a la regla de que solo
 * `src/config/` lee el entorno. Se ejecuta antes de que exista un proceso de API
 * que pueda validar nada: lo lanza el CLI para generar el cliente y aplicar
 * migraciones. Ver la spec `runtime-configuration`, requisito "Punto único de
 * lectura del entorno", y la decisión 6 del design de `add-data-model`.
 *
 * En tiempo de petición nadie pasa por aquí: el servidor obtiene la conexión del
 * objeto de configuración ya validado.
 */

// El `.env` vive en la raíz del monorepo, dos niveles por encima de esta app.
const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
dotenv.config({ path: process.env.ENV_FILE ?? path.join(repositoryRoot, ".env"), override: false });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
