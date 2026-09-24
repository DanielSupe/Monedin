import { z } from "zod";
import { LOG_LEVELS } from "../shared/logger/index.js";

export const SECRET_ENV_KEYS = [
  "DATABASE_URL",
  "TEST_DATABASE_URL",
  "AWS_ACCESS_KEY_ID",
  "AWS_SECRET_ACCESS_KEY",
  "TEST_AWS_ACCESS_KEY_ID",
  "TEST_AWS_SECRET_ACCESS_KEY",
  "GEMINI_API_KEY",
] as const;

export type SecretEnvKey = (typeof SECRET_ENV_KEYS)[number];

export function isSecretEnvKey(key: string): boolean {
  return (SECRET_ENV_KEYS as readonly string[]).includes(key);
}

const numericString = z
  .string({ required_error: "obligatoria" })
  .min(1, "obligatoria")
  .refine((value) => value.trim() !== "" && Number.isFinite(Number(value)), {
    message: "se esperaba un número",
  })
  .transform((value) => Number(value));

export const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]),

  API_PORT: numericString.pipe(
    z.number().int("se esperaba un número entero").min(1).max(65535),
  ),

  DATABASE_URL: z
    .string({ required_error: "obligatoria" })
    .min(1, "obligatoria")
    .refine((value) => value.startsWith("postgresql://") || value.startsWith("postgres://"), {
      message: "se esperaba una cadena de conexión que empiece por postgresql://",
    }),

  WEB_ORIGIN: z
    .string({ required_error: "obligatoria" })
    .min(1, "obligatoria")
    .url("se esperaba una URL válida"),

  LOG_LEVEL: z.enum(LOG_LEVELS).default("info"),

  TEST_DATABASE_URL: z
    .string({ required_error: "obligatoria" })
    .min(1, "obligatoria")
    .refine((value) => value.startsWith("postgresql://") || value.startsWith("postgres://"), {
      message: "se esperaba una cadena de conexión que empiece por postgresql://",
    }),

  S3_REGION: z.string({ required_error: "obligatoria" }).min(1, "obligatoria"),

  S3_BUCKET_NAME: z.string({ required_error: "obligatoria" }).min(1, "obligatoria"),

  TEST_S3_BUCKET_NAME: z.string({ required_error: "obligatoria" }).min(1, "obligatoria"),

  TEST_S3_ENDPOINT: z
    .string({ required_error: "obligatoria" })
    .trim()
    .refine((value) => value.startsWith("http://") || value.startsWith("https://"), {
      message:
        "se esperaba la URL de un almacén propio (MinIO). Los tests vacían su bucket: " +
        "no pueden apuntar al S3 real",
    }),

  S3_ENDPOINT: z
    .string()
    .trim()
    .refine((value) => value === "" || value.startsWith("http://") || value.startsWith("https://"), {
      message: "se esperaba una URL http(s), o vacío para usar el S3 real",
    })
    .transform((value) => (value === "" ? undefined : value))
    .default(""),

  AWS_ACCESS_KEY_ID: z.string({ required_error: "obligatoria" }).min(1, "obligatoria"),

  AWS_SECRET_ACCESS_KEY: z.string({ required_error: "obligatoria" }).min(1, "obligatoria"),

  TEST_AWS_ACCESS_KEY_ID: z.string({ required_error: "obligatoria" }).min(1, "obligatoria"),

  TEST_AWS_SECRET_ACCESS_KEY: z.string({ required_error: "obligatoria" }).min(1, "obligatoria"),

  GEMINI_API_KEY: z.string({ required_error: "obligatoria" }).min(1, "obligatoria"),
});

export type Env = z.infer<typeof envSchema>;

export const ENV_KEYS = Object.keys(envSchema.shape) as Array<keyof Env>;
