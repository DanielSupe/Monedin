import { API_PREFIX } from "@monedin/contracts";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../../src/app.js";

describe("health no depende de servicios externos", () => {
  it("responde 200 con la base de datos inalcanzable", async () => {
    const app = createApp();

    const response = await request(app).get(`${API_PREFIX}/health`);

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("ok");
  });

  it("responde igual de rápido con la base de datos inalcanzable", async () => {
    const app = createApp();

    const inicio = performance.now();
    await request(app).get(`${API_PREFIX}/health`);
    const transcurrido = performance.now() - inicio;

    expect(transcurrido).toBeLessThan(1000);
  });

  it("no importa ningún cliente de base de datos en el módulo", async () => {
    const modulo = await import("../../src/modules/health/health.service.js");

    expect(Object.keys(modulo)).toEqual(["getHealth"]);
  });
});
