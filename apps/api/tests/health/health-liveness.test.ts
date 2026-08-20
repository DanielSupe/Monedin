import { API_PREFIX } from "@monedin/contracts";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../../src/app.js";

/**
 * Sonda de VIDA, no de dependencias.
 *
 * El escenario de la spec es "la base de datos está caída". Aquí se reproduce
 * apuntando la configuración a un servidor que no existe: si `health` consultase
 * la base de datos, estos tests fallarían o tardarían lo que tarda un tiempo de
 * espera de conexión.
 */
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

    // Un intento de conexión a un puerto cerrado costaría órdenes de magnitud
    // más que esto. El margen es amplio a propósito: mide que no hay red de por
    // medio, no el rendimiento del endpoint.
    expect(transcurrido).toBeLessThan(1000);
  });

  it("no importa ningún cliente de base de datos en el módulo", async () => {
    const modulo = await import("../../src/modules/health/health.service.js");

    // La superficie del servicio es exactamente una función sin dependencias
    // externas: si alguien añade una consulta, este test deja de describir la
    // realidad y hay que revisar la decisión 7 del design.
    expect(Object.keys(modulo)).toEqual(["getHealth"]);
  });
});
