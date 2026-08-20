import { API_PREFIX, apiErrorSchema, healthResponseSchema } from "@monedin/contracts";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../../src/app.js";

const app = createApp();

describe("GET /api/v1/health", () => {
  it("responde 200 sin ninguna credencial", async () => {
    const response = await request(app).get(`${API_PREFIX}/health`);

    expect(response.status).toBe(200);
    expect(response.headers.authorization).toBeUndefined();
  });

  it("devuelve un cuerpo que cumple el contrato compartido", async () => {
    const response = await request(app).get(`${API_PREFIX}/health`);
    const parsed = healthResponseSchema.safeParse(response.body);

    expect(parsed.success).toBe(true);
    expect(response.body.status).toBe("ok");
  });

  it("devuelve exactamente lo mismo en llamadas repetidas", async () => {
    const respuestas = await Promise.all(
      Array.from({ length: 20 }, () => request(app).get(`${API_PREFIX}/health`)),
    );

    const cuerpos = new Set(respuestas.map((response) => JSON.stringify(response.body)));

    expect(respuestas.every((response) => response.status === 200)).toBe(true);
    // Un solo cuerpo distinto: la respuesta es determinista y sin efectos.
    expect(cuerpos.size).toBe(1);
  });

  it("no expone el framework en las cabeceras", async () => {
    const response = await request(app).get(`${API_PREFIX}/health`);

    expect(response.headers["x-powered-by"]).toBeUndefined();
  });
});

describe("prefijo versionado", () => {
  it("no atiende /health sin el prefijo", async () => {
    const response = await request(app).get("/health");

    expect(response.status).toBe(404);
    expect(apiErrorSchema.safeParse(response.body).success).toBe(true);
    expect(response.body).not.toHaveProperty("status", "ok");
  });

  it("no atiende /api/health, con prefijo pero sin versión", async () => {
    const response = await request(app).get("/api/health");

    expect(response.status).toBe(404);
  });

  it("sirve el endpoint únicamente bajo /api/v1", async () => {
    const response = await request(app).get(`${API_PREFIX}/health`);

    expect(response.status).toBe(200);
  });
});
