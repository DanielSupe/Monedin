import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import type { z } from "zod";
import { type Env, envSchema, isSecretEnvKey } from "./env.schema.js";

/** Un problema concreto con una variable de entorno. */
export interface EnvProblem {
  key: string;
  message: string;
  /** Valor recibido, ya enmascarado si la variable es secreta. Ausente si falta. */
  received?: string;
}

/** Fallo de validación del entorno, con todos los problemas encontrados. */
export class InvalidEnvError extends Error {
  constructor(readonly problems: EnvProblem[]) {
    super(formatEnvProblems(problems));
    this.name = "InvalidEnvError";
  }
}

/**
 * Raíz del repositorio, donde vive el `.env`.
 *
 * Este archivo acaba en `apps/api/src/config/` en desarrollo y en
 * `apps/api/dist/config/` compilado. En ambos casos la raíz está cuatro niveles
 * por encima, así que la ruta es la misma.
 */
function repositoryRoot(): string {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");
}

/**
 * Enmascara el valor de una variable secreta. No devuelve un prefijo ni una
 * longitud: cualquier fragmento sigue siendo información sobre el secreto.
 */
function maskIfSecret(key: string, value: string): string {
  return isSecretEnvKey(key) ? "«valor oculto»" : value;
}

function toProblem(issue: z.ZodIssue, source: Record<string, string | undefined>): EnvProblem {
  const key = String(issue.path[0] ?? "(desconocida)");
  const raw = source[key];
  const isMissing = raw === undefined || raw === "";

  if (isMissing) {
    return { key, message: "falta esta variable, es obligatoria" };
  }

  return { key, message: issue.message, received: maskIfSecret(key, raw) };
}

/** Compone el mensaje que verá quien intente arrancar con el entorno mal puesto. */
export function formatEnvProblems(problems: EnvProblem[]): string {
  const count = problems.length;
  const heading =
    count === 1
      ? "La configuración de entorno no es válida. Se encontró 1 problema:"
      : `La configuración de entorno no es válida. Se encontraron ${count} problemas:`;

  const lines = problems.map((problem) => {
    const received = problem.received === undefined ? "" : ` (recibido: ${problem.received})`;
    return `  - ${problem.key}: ${problem.message}${received}`;
  });

  return [
    heading,
    "",
    ...lines,
    "",
    "Revisa tu archivo .env en la raíz del repositorio.",
    "La plantilla .env.example lista todas las variables con valores de ejemplo.",
  ].join("\n");
}

/**
 * Valida un conjunto de variables. Función pura: no lee el entorno del proceso,
 * no imprime y no termina el proceso. Reporta TODOS los problemas a la vez.
 */
export function parseEnv(
  source: Record<string, string | undefined>,
): { ok: true; env: Env } | { ok: false; problems: EnvProblem[] } {
  const result = envSchema.safeParse(source);

  if (result.success) {
    return { ok: true, env: Object.freeze(result.data) };
  }

  const seen = new Set<string>();
  const problems: EnvProblem[] = [];

  for (const issue of result.error.issues) {
    const problem = toProblem(issue, source);
    // Una variable puede acumular varios issues; basta con reportarla una vez.
    if (seen.has(problem.key)) continue;
    seen.add(problem.key);
    problems.push(problem);
  }

  return { ok: false, problems };
}

/**
 * Carga el `.env` de la raíz (sin pisar variables ya presentes en el proceso) y
 * valida el resultado. Lanza `InvalidEnvError` si algo no cuadra.
 */
export function loadEnv(source?: Record<string, string | undefined>): Env {
  if (source === undefined) {
    // `ENV_FILE` permite apuntar a otro archivo de entorno sin tocar código:
    // sirve para desplegar el mismo artefacto en varios entornos y para que los
    // tests de arranque puedan aislarse del `.env` de la máquina.
    const envFile = process.env.ENV_FILE ?? path.join(repositoryRoot(), ".env");
    dotenv.config({ path: envFile, override: false });
  }

  const result = parseEnv(source ?? process.env);

  if (!result.ok) {
    throw new InvalidEnvError(result.problems);
  }

  return result.env;
}
