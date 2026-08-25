import { API_PREFIX, ERROR_CODES } from "@monedin/contracts";
import request from "supertest";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../../src/app.js";
import { resetAuthData } from "../support/auth.js";
import { cuantosCanjesTiene } from "../support/redemptions.js";
import { fijarSaldo, sembrarPremio } from "../support/rewards.js";
import { familiaOperando } from "../support/tasks.js";

const app = createApp();

beforeEach(async () => {
  await resetAuthData();
});

afterAll(async () => {
  await resetAuthData();
});

function solicitar(cookies: string[], rewardId: string): request.Test {
  return request(app).post(`${API_PREFIX}/redemptions`).set("Cookie", cookies).send({ rewardId });
}

describe("el niño solicita el canje de un premio", () => {
  it("crea la solicitud con el precio congelado de la oferta", async () => {
    const { parentId, hijos } = await familiaOperando(app, ["Ana"]);
    const ana = hijos[0]!;
    await fijarSaldo(ana.id, 100);
    const premio = await sembrarPremio(parentId, { offers: [{ childId: ana.id, coins: 60 }] });

    const response = await solicitar(ana.cookies, premio.id);

    expect(response.status).toBe(201);
    expect(response.body.coins).toBe(60);
    expect(response.body.status).toBe("PENDING");
    expect(response.body.reward.id).toBe(premio.id);
  }, 180_000);

  it("el saldo no cambia todavía: descontar es cosa de aprobar", async () => {
    const { parentId, hijos } = await familiaOperando(app, ["Ana"]);
    const ana = hijos[0]!;
    await fijarSaldo(ana.id, 100);
    const premio = await sembrarPremio(parentId, { offers: [{ childId: ana.id, coins: 60 }] });

    await solicitar(ana.cookies, premio.id).expect(201);

    const { coins } = await request(app)
      .get(`${API_PREFIX}/children/me`)
      .set("Cookie", ana.cookies)
      .then((response) => response.body);
    expect(coins).toBe(100);
  }, 180_000);
});

describe("el premio no está disponible para ese niño", () => {
  it("un premio inexistente da 404", async () => {
    const { hijos } = await familiaOperando(app, ["Ana"]);

    const response = await solicitar(hijos[0]!.cookies, "no-existe");

    expect(response.status).toBe(404);
    expect(response.body.code).toBe(ERROR_CODES.NOT_FOUND);
  }, 120_000);

  it("un premio retirado da 404", async () => {
    const { parentId, hijos } = await familiaOperando(app, ["Ana"]);
    const ana = hijos[0]!;
    const premio = await sembrarPremio(parentId, {
      isActive: false,
      offers: [{ childId: ana.id, coins: 60 }],
    });

    const response = await solicitar(ana.cookies, premio.id);

    expect(response.status).toBe(404);
  }, 120_000);

  it("un premio nunca ofertado a ese hijo da 404", async () => {
    const { parentId, hijos } = await familiaOperando(app, ["Ana", "Bruno"]);
    const [ana, bruno] = hijos;
    const premio = await sembrarPremio(parentId, { offers: [{ childId: bruno!.id, coins: 60 }] });

    const response = await solicitar(ana!.cookies, premio.id);

    expect(response.status).toBe(404);
  }, 120_000);

  it("no se crea ninguna fila cuando el premio no está disponible", async () => {
    const { hijos } = await familiaOperando(app, ["Ana"]);
    const ana = hijos[0]!;

    await solicitar(ana.cookies, "no-existe").expect(404);

    expect(await cuantosCanjesTiene(ana.id, "no-existe")).toBe(0);
  }, 120_000);
});

describe("ya tiene una solicitud pendiente del mismo premio", () => {
  it("la segunda solicitud da 409 y no se crea una segunda fila", async () => {
    const { parentId, hijos } = await familiaOperando(app, ["Ana"]);
    const ana = hijos[0]!;
    await fijarSaldo(ana.id, 200);
    const premio = await sembrarPremio(parentId, { offers: [{ childId: ana.id, coins: 60 }] });

    await solicitar(ana.cookies, premio.id).expect(201);
    const segunda = await solicitar(ana.cookies, premio.id);

    expect(segunda.status).toBe(409);
    expect(segunda.body.code).toBe(ERROR_CODES.CONFLICT);
    expect(await cuantosCanjesTiene(ana.id, premio.id)).toBe(1);
  }, 180_000);

  it("puede volver a solicitarlo una vez que el anterior ya no está pendiente", async () => {
    const { cookies, parentId, hijos } = await familiaOperando(app, ["Ana"]);
    const ana = hijos[0]!;
    await fijarSaldo(ana.id, 200);
    const premio = await sembrarPremio(parentId, { offers: [{ childId: ana.id, coins: 60 }] });

    const primera = await solicitar(ana.cookies, premio.id).expect(201);
    await request(app)
      .post(`${API_PREFIX}/redemptions/${primera.body.id}/reject`)
      .set("Cookie", cookies)
      .send()
      .expect(200);

    const segunda = await solicitar(ana.cookies, premio.id);

    expect(segunda.status).toBe(201);
    expect(await cuantosCanjesTiene(ana.id, premio.id)).toBe(2);
  }, 180_000);
});

describe("el saldo no alcanza al solicitar", () => {
  it("da 409 y no se crea ninguna fila", async () => {
    const { parentId, hijos } = await familiaOperando(app, ["Ana"]);
    const ana = hijos[0]!;
    await fijarSaldo(ana.id, 10);
    const premio = await sembrarPremio(parentId, { offers: [{ childId: ana.id, coins: 60 }] });

    const response = await solicitar(ana.cookies, premio.id);

    expect(response.status).toBe(409);
    expect(response.body.code).toBe(ERROR_CODES.CONFLICT);
    expect(await cuantosCanjesTiene(ana.id, premio.id)).toBe(0);
  }, 120_000);
});

describe("permisos y forma de entrada", () => {
  it("un padre no solicita", async () => {
    const { cookies, parentId, hijos } = await familiaOperando(app, ["Ana"]);
    const ana = hijos[0]!;
    const premio = await sembrarPremio(parentId, { offers: [{ childId: ana.id, coins: 60 }] });

    const response = await request(app)
      .post(`${API_PREFIX}/redemptions`)
      .set("Cookie", cookies)
      .send({ rewardId: premio.id });

    expect(response.status).toBe(403);
    expect(response.body.code).toBe(ERROR_CODES.FORBIDDEN);
  }, 120_000);

  it("mandar el hijo o el precio es entrada inválida", async () => {
    const { parentId, hijos } = await familiaOperando(app, ["Ana"]);
    const ana = hijos[0]!;
    const premio = await sembrarPremio(parentId, { offers: [{ childId: ana.id, coins: 60 }] });

    const conChildId = await request(app)
      .post(`${API_PREFIX}/redemptions`)
      .set("Cookie", ana.cookies)
      .send({ rewardId: premio.id, childId: ana.id });
    const conCoins = await request(app)
      .post(`${API_PREFIX}/redemptions`)
      .set("Cookie", ana.cookies)
      .send({ rewardId: premio.id, coins: 1 });

    expect(conChildId.status).toBe(422);
    expect(conCoins.status).toBe(422);
  }, 180_000);
});
