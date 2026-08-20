import { describe, expect, it } from "vitest";
import { formatEnvProblems, parseEnv } from "../../src/config/env.js";

/** Entorno válido mínimo, del que cada test parte y estropea una sola cosa. */
function validEnv(): Record<string, string | undefined> {
  return {
    NODE_ENV: "test",
    API_PORT: "3000",
    DATABASE_URL: "postgresql://monedin:monedin@localhost:5432/monedin",
    WEB_ORIGIN: "http://localhost:5173",
    LOG_LEVEL: "info",
  };
}

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
