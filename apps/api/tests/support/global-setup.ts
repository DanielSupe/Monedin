import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "pg";
import { getConfig } from "../../src/config/index.js";

/**
 * Prepara la base de datos de tests una sola vez, antes de toda la batería.
 *
 * Recrea el esquema desde cero aplicando los archivos de migración en orden.
 * Se ejecutan tal cual, sin pasar por el CLI de Prisma: así lo que se prueba es
 * exactamente el SQL versionado, incluidas las restricciones y el disparador que
 * se escribieron a mano, y no hay que arrancar un proceso hijo.
 *
 * Ver la spec `data-access`, requisito "Los tests se ejecutan contra un esquema
 * real y aislado".
 */

const migrationsDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../prisma/migrations",
);

/** Nombre de la base dentro de una cadena de conexión. */
function databaseName(connectionString: string): string {
  return new URL(connectionString).pathname.replace(/^\//, "");
}

/** Misma conexión apuntando a la base de mantenimiento. */
function maintenanceUrl(connectionString: string): string {
  const url = new URL(connectionString);
  url.pathname = "/postgres";
  return url.toString();
}

function migrationFiles(): string[] {
  return readdirSync(migrationsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    // Los nombres empiezan por marca de tiempo, así que el orden alfabético es
    // el cronológico.
    .sort()
    .map((name) => path.join(migrationsDir, name, "migration.sql"));
}

export default async function setup(): Promise<void> {
  const config = getConfig();
  const testUrl = config.TEST_DATABASE_URL;

  // Guarda de seguridad. Esta función BORRA la base a la que apunta; si alguien
  // copia mal el .env y las dos cadenas coinciden, se llevaría por delante los
  // datos de desarrollo.
  if (testUrl === config.DATABASE_URL) {
    throw new Error(
      "TEST_DATABASE_URL y DATABASE_URL apuntan a la misma base de datos. " +
        "La batería de tests recrea su esquema desde cero: apúntala a una base distinta.",
    );
  }

  const name = databaseName(testUrl);

  const maintenance = new Client({ connectionString: maintenanceUrl(testUrl) });
  await maintenance.connect();
  try {
    // Cortar sesiones vivas: si queda una abierta de una ejecución anterior,
    // el DROP se queda esperando indefinidamente.
    await maintenance.query(
      `SELECT pg_terminate_backend(pid) FROM pg_stat_activity
       WHERE datname = $1 AND pid <> pg_backend_pid()`,
      [name],
    );
    await maintenance.query(`DROP DATABASE IF EXISTS "${name}"`);
    await maintenance.query(`CREATE DATABASE "${name}"`);
  } finally {
    await maintenance.end();
  }

  const target = new Client({ connectionString: testUrl });
  await target.connect();
  try {
    for (const file of migrationFiles()) {
      await target.query(readFileSync(file, "utf8"));
    }
  } finally {
    await target.end();
  }
}
