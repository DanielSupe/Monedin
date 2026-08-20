import { describe, expect, it } from "vitest";
import {
  API_PREFIX,
  CHILD_AGE_MAX,
  CHILD_AGE_MIN,
  COINS_MAX,
  COINS_MIN,
  ERROR_CODES,
  apiErrorSchema,
  healthResponseSchema,
} from "../src/index.js";

describe("constantes de dominio", () => {
  it("define el prefijo versionado una sola vez", () => {
    expect(API_PREFIX).toBe("/api/v1");
  });

  it("mantiene rangos coherentes", () => {
    expect(CHILD_AGE_MIN).toBeLessThan(CHILD_AGE_MAX);
    expect(COINS_MIN).toBeLessThan(COINS_MAX);
    expect(COINS_MIN).toBeGreaterThan(0);
  });
});

describe("esquema de error compartido", () => {
  it("acepta el cuerpo mínimo de código y mensaje", () => {
    const result = apiErrorSchema.safeParse({
      code: ERROR_CODES.NOT_FOUND,
      message: "No encontramos lo que estás buscando.",
    });

    expect(result.success).toBe(true);
  });

  it("acepta el detalle por campo de una validación", () => {
    const result = apiErrorSchema.safeParse({
      code: ERROR_CODES.VALIDATION_ERROR,
      message: "Algunos datos no son válidos.",
      details: [{ field: "coins", code: "too_small", message: "Mínimo 1." }],
    });

    expect(result.success).toBe(true);
  });

  it("rechaza un cuerpo sin código", () => {
    expect(apiErrorSchema.safeParse({ message: "algo" }).success).toBe(false);
  });

  it("no repite ningún código de error", () => {
    const codigos = Object.values(ERROR_CODES);
    expect(new Set(codigos).size).toBe(codigos.length);
  });
});

describe("esquema de health", () => {
  it("exige que el estado sea exactamente 'ok'", () => {
    expect(
      healthResponseSchema.safeParse({ status: "ok", service: "monedin-api", version: "0.0.0" })
        .success,
    ).toBe(true);

    expect(
      healthResponseSchema.safeParse({ status: "degraded", service: "monedin-api", version: "0.0.0" })
        .success,
    ).toBe(false);
  });

  it("no admite marcas de tiempo: la respuesta tiene que ser determinista", () => {
    const result = healthResponseSchema.parse({
      status: "ok",
      service: "monedin-api",
      version: "0.0.0",
      timestamp: "2026-08-20T00:00:00Z",
    });

    expect(result).not.toHaveProperty("timestamp");
  });
});
