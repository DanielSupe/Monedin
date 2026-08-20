import { z } from "zod";
import { LOG_LEVELS } from "../shared/logger/index.js";

/**
 * Esquema del entorno de la API.
 *
 * Este archivo y `env.ts` son los ÚNICOS del proyecto autorizados a saber que
 * existen variables de entorno. Una regla de ESLint impide leerlas en cualquier
 * otro sitio. Ver la spec `runtime-configuration`.
 *
 * Toda variable declarada aquí debe existir también en `.env.example`; hay un
 * test que lo comprueba y falla nombrando la que falte.
 */

/**
 * Variables cuyo VALOR nunca puede aparecer en un mensaje de error, en un log ni
 * en una respuesta HTTP. Al reportar un problema con una de ellas se nombra la
 * variable y se enmascara el valor.
 */
export const SECRET_ENV_KEYS = ["DATABASE_URL"] as const;

export type SecretEnvKey = (typeof SECRET_ENV_KEYS)[number];

export function isSecretEnvKey(key: string): boolean {
  return (SECRET_ENV_KEYS as readonly string[]).includes(key);
}

/**
 * Convierte una cadena de entorno en número, distinguiendo "ausente" de
 * "presente pero no numérico". Sin esto, una variable ausente se leería como
 * `NaN` y el mensaje diría "no es un número" en vez de "falta".
 */
const numericString = z
  .string({ required_error: "obligatoria" })
  .min(1, "obligatoria")
  .refine((value) => value.trim() !== "" && Number.isFinite(Number(value)), {
    message: "se esperaba un número",
  })
  .transform((value) => Number(value));

export const envSchema = z.object({
  /** Entorno de ejecución. Determina comportamientos, nunca credenciales. */
  NODE_ENV: z.enum(["development", "test", "production"]),

  /** Puerto en el que la API escucha. */
  API_PORT: numericString.pipe(
    z.number().int("se esperaba un número entero").min(1).max(65535),
  ),

  /** Cadena de conexión a PostgreSQL. Secreta. */
  DATABASE_URL: z
    .string({ required_error: "obligatoria" })
    .min(1, "obligatoria")
    .refine((value) => value.startsWith("postgresql://") || value.startsWith("postgres://"), {
      message: "se esperaba una cadena de conexión que empiece por postgresql://",
    }),

  /** Origen del front. Se usa para políticas de origen y enlaces absolutos. */
  WEB_ORIGIN: z
    .string({ required_error: "obligatoria" })
    .min(1, "obligatoria")
    .url("se esperaba una URL válida"),

  /** Nivel de log. Único campo con valor por defecto razonable. */
  LOG_LEVEL: z.enum(LOG_LEVELS).default("info"),
});

/** Configuración validada de la API. */
export type Env = z.infer<typeof envSchema>;

/** Nombres de todas las variables que la API declara. */
export const ENV_KEYS = Object.keys(envSchema.shape) as Array<keyof Env>;
