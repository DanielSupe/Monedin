import { API_PREFIX, ERROR_CODES } from "@monedin/contracts";
import request from "supertest";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../../src/app.js";
import { resetAuthData } from "../support/auth.js";
import { estadoDeCanje, movimientosDeCanje, sembrarCanje } from "../support/redemptions.js";
import { fijarSaldo, sembrarPremio } from "../support/rewards.js";
import { familiaOperando, saldoDe } from "../support/tasks.js";

const app = createApp();

beforeEach(async () => {
  await resetAuthData();
});

afterAll(async () => {
  await resetAuthData();
});

function aprobar(cookies: string[], redemptionId: string): request.Test {
  return request(app).post(`${API_PREFIX}/redemptions/${redemptionId}/approve`).set("Cookie", cookies);
}

function rechazar(cookies: string[], redemptionId: string): request.Test {
  return request(app).post(`${API_PREFIX}/redemptions/${redemptionId}/reject`).set("Cookie", cookies);
}

describe("aprobar un canje pendiente descuenta su precio congelado", () => {
  it("camino feliz: queda APPROVED y el saldo baja exactamente el precio", async () => {
    const { cookies, parentId, hijos } = await familiaOperando(app, ["Ana"]);
    const ana = hijos[0]!;
    await fijarSaldo(ana.id, 100);
    const premio = await sembrarPremio(parentId, { offers: [{ childId: ana.id, coins: 60 }] });
    const canje = await sembrarCanje({ childId: ana.id, rewardId: premio.id }, { coins: 60 });

    const response = await aprobar(cookies, canje.id);

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("APPROVED");
    expect(await saldoDe(ana.id)).toBe(40);
    expect(await movimientosDeCanje(canje.id)).toHaveLength(1);
  }, 180_000);

  it("descuenta el precio CONGELADO, no el que la oferta tenga ahora", async () => {
    const { cookies, parentId, hijos } = await familiaOperando(app, ["Ana"]);
    const ana = hijos[0]!;
    await fijarSaldo(ana.id, 100);
    const premio = await sembrarPremio(parentId, { offers: [{ childId: ana.id, coins: 60 }] });
    const canje = await sembrarCanje({ childId: ana.id, rewardId: premio.id }, { coins: 60 });

    // El padre sube el precio de la oferta después de que el niño ya pidió.
    await request(app)
      .put(`${API_PREFIX}/rewards/${premio.id}/assignments`)
      .set("Cookie", cookies)
      .send({ assignments: [{ childId: ana.id, coins: 90 }] })
      .expect(200);

    await aprobar(cookies, canje.id).expect(200);

    // Bajó 60, el precio con el que se pidió, no 90.
    expect(await saldoDe(ana.id)).toBe(40);
  }, 180_000);

  it("un niño no aprueba, ni siquiera el suyo", async () => {
    const { parentId, hijos } = await familiaOperando(app, ["Ana"]);
    const ana = hijos[0]!;
    const premio = await sembrarPremio(parentId, { offers: [{ childId: ana.id, coins: 60 }] });
    const canje = await sembrarCanje({ childId: ana.id, rewardId: premio.id });

    const response = await aprobar(ana.cookies, canje.id);

    expect(response.status).toBe(403);
    expect(response.body.code).toBe(ERROR_CODES.FORBIDDEN);
  }, 120_000);

  it("aprobar algo ya aprobado es conflicto y no vuelve a descontar", async () => {
    const { cookies, parentId, hijos } = await familiaOperando(app, ["Ana"]);
    const ana = hijos[0]!;
    await fijarSaldo(ana.id, 100);
    const premio = await sembrarPremio(parentId, { offers: [{ childId: ana.id, coins: 60 }] });
    const canje = await sembrarCanje({ childId: ana.id, rewardId: premio.id }, { coins: 60 });

    await aprobar(cookies, canje.id).expect(200);
    const segunda = await aprobar(cookies, canje.id);

    expect(segunda.status).toBe(409);
    expect(await saldoDe(ana.id)).toBe(40);
  }, 180_000);

  it("aprobar algo ya rechazado es conflicto", async () => {
    const { cookies, parentId, hijos } = await familiaOperando(app, ["Ana"]);
    const ana = hijos[0]!;
    const premio = await sembrarPremio(parentId, { offers: [{ childId: ana.id, coins: 60 }] });
    const canje = await sembrarCanje({ childId: ana.id, rewardId: premio.id }, { status: "REJECTED" });

    const response = await aprobar(cookies, canje.id);

    expect(response.status).toBe(409);
  }, 120_000);
});

describe("rechazar un canje pendiente no mueve monedas", () => {
  it("camino feliz: queda REJECTED y el saldo no cambia", async () => {
    const { cookies, parentId, hijos } = await familiaOperando(app, ["Ana"]);
    const ana = hijos[0]!;
    await fijarSaldo(ana.id, 100);
    const premio = await sembrarPremio(parentId, { offers: [{ childId: ana.id, coins: 60 }] });
    const canje = await sembrarCanje({ childId: ana.id, rewardId: premio.id }, { coins: 60 });

    const response = await rechazar(cookies, canje.id);

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("REJECTED");
    expect(await saldoDe(ana.id)).toBe(100);
    expect(await movimientosDeCanje(canje.id)).toHaveLength(0);
  }, 180_000);

  it("rechazar algo ya resuelto es conflicto", async () => {
    const { cookies, parentId, hijos } = await familiaOperando(app, ["Ana"]);
    const ana = hijos[0]!;
    const premio = await sembrarPremio(parentId, { offers: [{ childId: ana.id, coins: 60 }] });
    const canje = await sembrarCanje({ childId: ana.id, rewardId: premio.id }, { status: "APPROVED" });

    const response = await rechazar(cookies, canje.id);

    expect(response.status).toBe(409);
    expect(await estadoDeCanje(canje.id)).toBe("APPROVED");
  }, 120_000);

  it("un niño no rechaza", async () => {
    const { parentId, hijos } = await familiaOperando(app, ["Ana"]);
    const ana = hijos[0]!;
    const premio = await sembrarPremio(parentId, { offers: [{ childId: ana.id, coins: 60 }] });
    const canje = await sembrarCanje({ childId: ana.id, rewardId: premio.id });

    const response = await rechazar(ana.cookies, canje.id);

    expect(response.status).toBe(403);
  }, 120_000);
});

describe("retirar el premio o la oferta no afecta un canje ya pendiente", () => {
  it("se puede aprobar un canje cuyo premio fue retirado mientras estaba pendiente", async () => {
    const { cookies, parentId, hijos } = await familiaOperando(app, ["Ana"]);
    const ana = hijos[0]!;
    await fijarSaldo(ana.id, 100);
    const premio = await sembrarPremio(parentId, { offers: [{ childId: ana.id, coins: 60 }] });
    const canje = await sembrarCanje({ childId: ana.id, rewardId: premio.id }, { coins: 60 });

    await request(app)
      .delete(`${API_PREFIX}/rewards/${premio.id}`)
      .set("Cookie", cookies)
      .expect(204);

    const response = await aprobar(cookies, canje.id);

    expect(response.status).toBe(200);
    expect(await saldoDe(ana.id)).toBe(40);
  }, 180_000);

  it("se puede resolver un canje cuando la oferta a ese hijo ya no existe", async () => {
    const { cookies, parentId, hijos } = await familiaOperando(app, ["Ana"]);
    const ana = hijos[0]!;
    await fijarSaldo(ana.id, 100);
    const premio = await sembrarPremio(parentId, { offers: [{ childId: ana.id, coins: 60 }] });
    const canje = await sembrarCanje({ childId: ana.id, rewardId: premio.id }, { coins: 60 });

    // Reemplaza el conjunto de ofertas sin incluir a Ana.
    await request(app)
      .put(`${API_PREFIX}/rewards/${premio.id}/assignments`)
      .set("Cookie", cookies)
      .send({ assignments: [] })
      .expect(200);

    const response = await aprobar(cookies, canje.id);

    expect(response.status).toBe(200);
    expect(await saldoDe(ana.id)).toBe(40);
  }, 180_000);
});
