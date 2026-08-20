import { createRequire } from "node:module";

/**
 * Capa de datos del módulo.
 *
 * En un módulo de dominio este es el ÚNICO archivo que toca Prisma. Ninguna otra
 * capa importa el cliente de base de datos.
 *
 * `health` no consulta la base de datos a propósito (decisión 7 del design): una
 * sonda de vida que falla cuando cae Postgres provoca que el orquestador
 * reinicie una API que está perfectamente viva. Lo único que lee aquí es la
 * identidad del propio servicio.
 */

const require = createRequire(import.meta.url);

interface PackageManifest {
  version?: string;
}

/** Identidad del artefacto en ejecución. */
export interface ServiceIdentity {
  version: string;
}

export function findServiceIdentity(): ServiceIdentity {
  const manifest = require("../../../package.json") as PackageManifest;
  return { version: manifest.version ?? "0.0.0" };
}
