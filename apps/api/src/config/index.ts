import { InvalidEnvError, loadEnv } from "./env.js";
import type { Env } from "./env.schema.js";

export type { Env } from "./env.schema.js";
export { ENV_KEYS, SECRET_ENV_KEYS } from "./env.schema.js";
export { InvalidEnvError, parseEnv, formatEnvProblems } from "./env.js";
export type { EnvProblem } from "./env.js";

let cached: Env | undefined;

/**
 * Devuelve la configuración validada y congelada.
 *
 * Es el único objeto del que el resto del sistema obtiene valores de entorno.
 * Cuando un módulo necesita, por ejemplo, la cadena de conexión, la lee de aquí
 * y no vuelve a validarla: ya viene validada.
 */
export function getConfig(): Env {
  cached ??= loadEnv();
  return cached;
}

/**
 * Carga y valida la configuración durante el arranque.
 *
 * Si la configuración es inválida, imprime TODOS los problemas de una vez y
 * termina el proceso con código distinto de cero. Es deliberado que muera aquí:
 * una API que arranca con la configuración mal puesta falla más tarde, en la
 * petición de un usuario cualquiera y con un error que no señala la causa.
 */
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

/** Solo para tests: olvida la configuración memorizada. */
export function resetConfigForTests(): void {
  cached = undefined;
}
