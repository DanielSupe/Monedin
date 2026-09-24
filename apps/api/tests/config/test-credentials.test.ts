import { describe, expect, it } from "vitest";
import { envSchema, isSecretEnvKey } from "../../src/config/env.schema.js";

const valido = {
  NODE_ENV: "test", API_PORT: "3000", LOG_LEVEL: "info",
  DATABASE_URL: "postgresql://a:b@localhost:5432/c",
  TEST_DATABASE_URL: "postgresql://a:b@localhost:5432/c_test",
  WEB_ORIGIN: "http://localhost:5173",
  S3_REGION: "us-east-1", S3_BUCKET_NAME: "monedin-dev",
  TEST_S3_BUCKET_NAME: "monedin-test", TEST_S3_ENDPOINT: "http://localhost:9000",
  S3_ENDPOINT: "http://localhost:9000",
  AWS_ACCESS_KEY_ID: "una-clave", AWS_SECRET_ACCESS_KEY: "un-secreto",
  TEST_AWS_ACCESS_KEY_ID: "clave-test", TEST_AWS_SECRET_ACCESS_KEY: "secreto-test",
  GEMINI_API_KEY: "clave-de-gemini",
};

describe("las credenciales de la batería", () => {
  it("son obligatorias y no caen hacia las de producción", () => {
    for (const clave of ["TEST_AWS_ACCESS_KEY_ID", "TEST_AWS_SECRET_ACCESS_KEY"] as const) {
      const { [clave]: _falta, ...sinElla } = valido;
      const r = envSchema.safeParse(sinElla);
      expect(r.success, `${clave} debería ser obligatoria`).toBe(false);
      if (!r.success) {
        expect(r.error.issues.some((i) => i.path[0] === clave)).toBe(true);
      }
    }
  });

  it("están marcadas como secretas", () => {
    expect(isSecretEnvKey("TEST_AWS_ACCESS_KEY_ID")).toBe(true);
    expect(isSecretEnvKey("TEST_AWS_SECRET_ACCESS_KEY")).toBe(true);
  });
});
