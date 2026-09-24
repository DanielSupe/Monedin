import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "pg";
import { getConfig } from "../../src/config/index.js";
import { closeTestS3, vaciarBucketDeTests } from "./storage.js";

const migrationsDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../prisma/migrations",
);

function databaseName(connectionString: string): string {
  return new URL(connectionString).pathname.replace(/^\//, "");
}

function maintenanceUrl(connectionString: string): string {
  const url = new URL(connectionString);
  url.pathname = "/postgres";
  return url.toString();
}

function migrationFiles(): string[] {
  return readdirSync(migrationsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)

    .sort()
    .map((name) => path.join(migrationsDir, name, "migration.sql"));
}

export default async function setup(): Promise<void> {
  const config = getConfig();
  const testUrl = config.TEST_DATABASE_URL;

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

  try {
    await vaciarBucketDeTests();
  } finally {
    closeTestS3();
  }
}
