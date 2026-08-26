import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { ENV_KEYS } from "../../src/config/env.schema.js";

/**
 * Variables que `.env.example` declara y la API NO lee: las consume
 * `docker-compose.yml` o el servidor de desarrollo del front. Se listan de forma
 * explícita para que una variable olvidada en la plantilla no pase por
 * "infraestructura" sin que nadie lo note.
 */
const INFRASTRUCTURE_ONLY_KEYS = [
  "POSTGRES_USER",
  "POSTGRES_PASSWORD",
  "POSTGRES_DB",
  "POSTGRES_PORT",
  "ADMINER_PORT",
  "WEB_PORT",
  // MinIO: lo levanta docker-compose, no lo lee la API. Esta habla con el
  // almacén por S3_ENDPOINT y las credenciales, que sí están en el esquema.
  "MINIO_ROOT_USER",
  "MINIO_ROOT_PASSWORD",
  "MINIO_PORT",
  "MINIO_CONSOLE_PORT",
];

function repositoryRoot(): string {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");
}

function templateKeys(): string[] {
  const contents = readFileSync(path.join(repositoryRoot(), ".env.example"), "utf8");

  return contents
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line !== "" && !line.startsWith("#"))
    .map((line) => line.split("=")[0]?.trim())
    .filter((key): key is string => key !== undefined && key !== "");
}

describe("plantilla de entorno sincronizada con el esquema", () => {
  it("declara en .env.example todas las variables que la API requiere", () => {
    const declared = templateKeys();
    const missing = ENV_KEYS.filter((key) => !declared.includes(key));

    expect(
      missing,
      `Faltan en .env.example: ${missing.join(", ")}. ` +
        "Toda variable del esquema tiene que estar en la plantilla.",
    ).toEqual([]);
  });

  it("no deja en .env.example variables que nadie consume", () => {
    const declared = templateKeys();
    const known = new Set<string>([...ENV_KEYS, ...INFRASTRUCTURE_ONLY_KEYS]);
    const orphans = declared.filter((key) => !known.has(key));

    expect(
      orphans,
      `Sobran en .env.example: ${orphans.join(", ")}. ` +
        "O las lee la API y faltan en el esquema, o son de infraestructura y hay que declararlas.",
    ).toEqual([]);
  });

  it("no repite ninguna variable en la plantilla", () => {
    const declared = templateKeys();
    const duplicated = declared.filter((key, index) => declared.indexOf(key) !== index);

    expect(duplicated).toEqual([]);
  });
});
