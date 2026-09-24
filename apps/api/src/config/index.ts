import { InvalidEnvError, loadEnv } from "./env.js";
import type { Env } from "./env.schema.js";

export type { Env } from "./env.schema.js";
export { ENV_KEYS, SECRET_ENV_KEYS } from "./env.schema.js";
export { InvalidEnvError, parseEnv, formatEnvProblems } from "./env.js";
export type { EnvProblem } from "./env.js";

let cached: Env | undefined;

export function getConfig(): Env {
  cached ??= loadEnv();
  return cached;
}

export function initConfig(): Env {
  try {
    return getConfig();
  } catch (error) {
    if (error instanceof InvalidEnvError) {
      console.error(`\n${error.message}\n`);
      process.exit(1);
    }
    throw error;
  }
}

export function resetConfigForTests(): void {
  cached = undefined;
}
