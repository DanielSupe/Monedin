import { describe, expect, it } from "vitest";
import { formatEnvProblems, parseEnv } from "../../src/config/env.js";

/** Entorno válido mínimo, del que cada test parte y estropea una sola cosa. */
function validEnv(): Record<string, string | undefined> {
  return {
    NODE_ENV: "test",
    API_PORT: "3000",
    DATABASE_URL: "postgresql://monedin:monedin@localhost:5432/monedin",
    TEST_DATABASE_URL: "postgresql://monedin:monedin@localhost:5432/monedin_test",
    WEB_ORIGIN: "http://localhost:5173",
    LOG_LEVEL: "info",
    S3_REGION: "us-east-1",
    S3_BUCKET_NAME: "monedin-dev",
    TEST_S3_BUCKET_NAME: "monedin-test",
    TEST_S3_ENDPOINT: "http://localhost:9000",
    S3_ENDPOINT: "http://localhost:9000",
    AWS_ACCESS_KEY_ID: "una-clave",
    AWS_SECRET_ACCESS_KEY: "un-secreto",
  };
}

describe("el endpoint de los tests nunca puede ser el S3 real", () => {
  it("exige una URL propia: vacío no vale", () => {
    // Vacío significa "el S3 de AWS" en `S3_ENDPOINT`. Aquí no puede
    // significar nada: la batería VACÍA su bucket, así que no debe existir
    // forma de apuntarla a un almacén real.
    const sinEndpoint = { ...validEnv(), TEST_S3_ENDPOINT: "" };

    expect(parseEnv(sinEndpoint).ok).toBe(false);
  });

  it("tampoco vale omitirla", () => {
    const { TEST_S3_ENDPOINT: _omitida, ...resto } = validEnv();

    expect(parseEnv(resto).ok).toBe(false);
  });

  it("`S3_ENDPOINT` SÍ admite vacío: es como desarrollo apunta a AWS", () => {
    const conAws = { ...validEnv(), S3_ENDPOINT: "" };
    const result = parseEnv(conAws);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.env.S3_ENDPOINT).toBeUndefined();
      // Y los tests siguen con el suyo, sin arrastrarse detrás.
      expect(result.env.TEST_S3_ENDPOINT).toBe("http://localhost:9000");
    }
  });
});

describe("validación de la configuración de entorno", () => {
  it("acepta una configuración completa y válida", () => {
    const result = parseEnv(validEnv());

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.env.API_PORT).toBe(3000);
    expect(result.env.NODE_ENV).toBe("test");
    expect(Object.isFrozen(result.env)).toBe(true);
  });

  it("aplica el valor por defecto de LOG_LEVEL cuando no se define", () => {
    const source = validEnv();
    delete source.LOG_LEVEL;

    const result = parseEnv(source);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.env.LOG_LEVEL).toBe("info");
  });

  it("falla nombrando la variable requerida que falta", () => {
    const source = validEnv();
    delete source.WEB_ORIGIN;

    const result = parseEnv(source);

    expect(result.ok).toBe(false);
    if (result.ok) return;

    expect(result.problems).toHaveLength(1);
    expect(result.problems[0]?.key).toBe("WEB_ORIGIN");
    expect(formatEnvProblems(result.problems)).toContain("WEB_ORIGIN");
  });

  it("indica variable, valor recibido y formato esperado ante un tipo inválido", () => {
    const source = validEnv();
    source.API_PORT = "no-soy-un-numero";

    const result = parseEnv(source);

    expect(result.ok).toBe(false);
    if (result.ok) return;

    const message = formatEnvProblems(result.problems);
    expect(message).toContain("API_PORT");
    expect(message).toContain("no-soy-un-numero");
    expect(message).toContain("número");
  });

  it("reporta los tres problemas en una sola salida", () => {
    const source = validEnv();
    delete source.NODE_ENV;
    source.API_PORT = "-1";
    source.WEB_ORIGIN = "no-soy-una-url";

    const result = parseEnv(source);

    expect(result.ok).toBe(false);
    if (result.ok) return;

    expect(result.problems).toHaveLength(3);

    const message = formatEnvProblems(result.problems);
    expect(message).toContain("NODE_ENV");
    expect(message).toContain("API_PORT");
    expect(message).toContain("WEB_ORIGIN");
    expect(message).toContain("3 problemas");
  });

  it("nombra la variable secreta pero nunca su valor, ni siquiera parcialmente", () => {
    const secret = "postgresql-invalido://usuario:contrasena-secretisima@servidor/base";
    const source = validEnv();
    source.DATABASE_URL = secret;

    const result = parseEnv(source);

    expect(result.ok).toBe(false);
    if (result.ok) return;

    const message = formatEnvProblems(result.problems);

    expect(message).toContain("DATABASE_URL");
    expect(message).not.toContain(secret);
    expect(message).not.toContain("contrasena-secretisima");
    expect(message).not.toContain("usuario");
    // Ni un prefijo: cualquier fragmento sigue siendo información del secreto.
    expect(message).not.toContain(secret.slice(0, 12));
  });
});
