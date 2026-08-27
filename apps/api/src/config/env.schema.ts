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
export const SECRET_ENV_KEYS = [
  "DATABASE_URL",
  "TEST_DATABASE_URL",
  "AWS_ACCESS_KEY_ID",
  "AWS_SECRET_ACCESS_KEY",
  "TEST_AWS_ACCESS_KEY_ID",
  "TEST_AWS_SECRET_ACCESS_KEY",
] as const;

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

  /** Nivel de log. */
  LOG_LEVEL: z.enum(LOG_LEVELS).default("info"),

  /**
   * Cadena de conexión de la base de datos de tests. Secreta.
   *
   * Separada de `DATABASE_URL` a propósito: la batería de tests borra y recrea
   * su esquema, y apuntarla por accidente a la base de desarrollo destruiría
   * los datos con los que se está trabajando.
   */
  TEST_DATABASE_URL: z
    .string({ required_error: "obligatoria" })
    .min(1, "obligatoria")
    .refine((value) => value.startsWith("postgresql://") || value.startsWith("postgres://"), {
      message: "se esperaba una cadena de conexión que empiece por postgresql://",
    }),

  /** Región del bucket de imágenes. */
  S3_REGION: z.string({ required_error: "obligatoria" }).min(1, "obligatoria"),

  /** Bucket donde viven avatares, fotos de premios y evidencias. */
  S3_BUCKET_NAME: z.string({ required_error: "obligatoria" }).min(1, "obligatoria"),

  /**
   * Bucket de la batería de tests. Separado del de desarrollo por la misma
   * razón que `TEST_DATABASE_URL`: los tests VACÍAN su bucket entre pasadas, y
   * apuntarlo por accidente al de desarrollo borraría las fotos con las que se
   * está trabajando.
   */
  TEST_S3_BUCKET_NAME: z.string({ required_error: "obligatoria" }).min(1, "obligatoria"),

  /**
   * Dirección del almacén que usa la batería de tests.
   *
   * SEPARADA de `S3_ENDPOINT` y OBLIGATORIA con valor, no opcional-vía-vacío
   * como aquella. Desarrollo puede apuntar al S3 real dejando `S3_ENDPOINT`
   * vacía; los tests NUNCA, porque su arranque vacía el bucket que se le
   * indique. Con una sola variable para las dos cosas, apuntar desarrollo a AWS
   * arrastraría a los tests con él, y la primera pasada borraría el bucket real.
   *
   * Que no admita vacío es justamente la defensa: no hay forma de escribir aquí
   * "el S3 de AWS".
   */
  TEST_S3_ENDPOINT: z
    .string({ required_error: "obligatoria" })
    .trim()
    .refine((value) => value.startsWith("http://") || value.startsWith("https://"), {
      message:
        "se esperaba la URL de un almacén propio (MinIO). Los tests vacían su bucket: " +
        "no pueden apuntar al S3 real",
    }),

  /**
   * Dirección del almacén, cuando no es el S3 real de AWS.
   *
   * VACÍA significa AWS. Con valor, apunta a un S3-compatible propio, que es
   * como el entorno local habla con MinIO sin necesitar credenciales reales.
   * Se declara opcional-vía-vacío y no simplemente opcional para que
   * `.env.example` pueda documentarla sin que su presencia cambie el
   * comportamiento.
   */
  S3_ENDPOINT: z
    .string()
    .trim()
    .refine((value) => value === "" || value.startsWith("http://") || value.startsWith("https://"), {
      message: "se esperaba una URL http(s), o vacío para usar el S3 real",
    })
    .transform((value) => (value === "" ? undefined : value))
    .default(""),

  /** Credencial del almacén. Secreta. */
  AWS_ACCESS_KEY_ID: z.string({ required_error: "obligatoria" }).min(1, "obligatoria"),

  /** Credencial del almacén. Secreta. */
  AWS_SECRET_ACCESS_KEY: z.string({ required_error: "obligatoria" }).min(1, "obligatoria"),

  /*
   * Credenciales de la batería de tests. Secretas, y SEPARADAS de las de arriba.
   *
   * Son la tercera separación entre la batería y el almacén real, junto al
   * bucket y al endpoint. Sin ellas, apuntar el desarrollo a un almacén real
   * arrastra a los tests: siguen hablando con MinIO —el endpoint sí está
   * separado— pero con credenciales que MinIO rechaza, y la suite entera muere
   * con `InvalidAccessKeyId`.
   *
   * No llevan valor por defecto a propósito, aunque en local siempre valgan lo
   * mismo. Un defecto que tapa una variable ausente es cómo se acaba apuntando
   * al almacén equivocado sin enterarse, que es este mismo fallo en la otra
   * dirección. Ver la decisión 2 del design de `split-test-storage-credentials`.
   */
  TEST_AWS_ACCESS_KEY_ID: z.string({ required_error: "obligatoria" }).min(1, "obligatoria"),

  TEST_AWS_SECRET_ACCESS_KEY: z.string({ required_error: "obligatoria" }).min(1, "obligatoria"),
});

/** Configuración validada de la API. */
export type Env = z.infer<typeof envSchema>;

/** Nombres de todas las variables que la API declara. */
export const ENV_KEYS = Object.keys(envSchema.shape) as Array<keyof Env>;
