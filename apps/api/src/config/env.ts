import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import type { z } from "zod";
import { type Env, envSchema, isSecretEnvKey } from "./env.schema.js";

export interface EnvProblem {
  key: string;
  message: string;

  received?: string;
}

export class InvalidEnvError extends Error {
  constructor(readonly problems: EnvProblem[]) {
    super(formatEnvProblems(problems));
    this.name = "InvalidEnvError";
  }
}

function repositoryRoot(): string {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");
}

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

    if (seen.has(problem.key)) continue;
    seen.add(problem.key);
    problems.push(problem);
  }

  return { ok: false, problems };
}

export function loadEnv(source?: Record<string, string | undefined>): Env {
  if (source === undefined) {
    const envFile = process.env.ENV_FILE ?? path.join(repositoryRoot(), ".env");
    dotenv.config({ path: envFile, override: false });
  }

  const result = parseEnv(source ?? process.env);

  if (!result.ok) {
    throw new InvalidEnvError(result.problems);
  }

  return result.env;
}
