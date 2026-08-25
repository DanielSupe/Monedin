import { API_PREFIX, ERROR_CODES } from "@monedin/contracts";
import request from "supertest";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../../src/app.js";
import { asParent, createChildProfile, resetAuthData } from "../support/auth.js";
import { estaActivo, ofertasDe, sembrarPremio } from "../support/rewards.js";
import { familiaOperando } from "../support/tasks.js";

const app = createApp();

beforeEach(async () => {
  await resetAuthData();
});

afterAll(async () => {
  await resetAuthData();
});

function reemplazar(
  cookies: string[],
  rewardId: string,
  assignments: Array<{ childId: string; coins: number }>,
): request.Test {
  return request(app)
    .put(`${API_PREFIX}/rewards/${rewardId}/assignments`)
    .set("Cookie", cookies)
    .send({ assignments });
}

function retirar(cookies: string[], rewardId: string): request.Test {
  return request(app).delete(`${API_PREFIX}/rewards/${rewardId}`).set("Cookie", cookies);
}

describe("las ofertas de un premio se reemplazan en bloque", () => {
  it("quitar un hijo del conjunto lo deja sin el premio", async () => {
    const { cookies, parentId, hijos } = await familiaOperando(app, ["Ana", "Bruno"]);
    const premio = await sembrarPremio(parentId, {
      offers: [
        { childId: hijos[0]!.id, coins: 200 },
        { childId: hijos[1]!.id, coins: 150 },
      ],
    });

    const response = await reemplazar(cookies, premio.id, [
      { childId: hijos[0]!.id, coins: 200 },
    ]);

    expect(response.status).toBe(200);
    const ofertas = await ofertasDe(premio.id);
    expect(ofertas).toEqual([{ childId: hijos[0]!.id, coins: 200 }]);
  }, 180_000);

  it("cambiar el precio de un hijo no toca el de sus hermanos", async () => {
    const { cookies, parentId, hijos } = await familiaOperando(app, ["Ana", "Bruno"]);
    const premio = await sembrarPremio(parentId, {
      offers: [
        { childId: hijos[0]!.id, coins: 200 },
        { childId: hijos[1]!.id, coins: 150 },
      ],
    });

    await reemplazar(cookies, premio.id, [
      { childId: hijos[0]!.id, coins: 250 },
      { childId: hijos[1]!.id, coins: 150 },
    ]).expect(200);

    const ofertas = await ofertasDe(premio.id);
    expect(ofertas).toEqual(
      expect.arrayContaining([
        { childId: hijos[0]!.id, coins: 250 },
        { childId: hijos[1]!.id, coins: 150 },
      ]),
    );
  }, 180_000);

  it("un conjunto vacío deja el premio sin ofertas y sin desaparecer del catálogo", async () => {
    const { cookies, parentId, hijos } = await familiaOperando(app, ["Ana"]);
    const premio = await sembrarPremio(parentId, {
      offers: [{ childId: hijos[0]!.id, coins: 200 }],
    });

    const response = await reemplazar(cookies, premio.id, []);

    expect(response.status).toBe(200);
    expect(response.body.offers).toEqual([]);
    expect(await estaActivo(premio.id)).toBe(true);
  }, 120_000);
});

describe("el reemplazo de ofertas es todo o nada", () => {
  it("con un hijo ajeno en el conjunto se rechaza y las ofertas quedan igual", async () => {
    const { cookies, parentId, hijos } = await familiaOperando(app, ["Ana"]);
    const premio = await sembrarPremio(parentId, {
      offers: [{ childId: hijos[0]!.id, coins: 200 }],
    });

    const { parentId: otroPadre } = await asParent(app, {
      email: "otra@monedin.test",
      name: "Otra madre",
    });
    const ajeno = await createChildProfile(otroPadre, { name: "Ajeno", pin: "9999" });

    const response = await reemplazar(cookies, premio.id, [
      { childId: hijos[0]!.id, coins: 200 },
      { childId: ajeno.id, coins: 100 },
    ]);

    expect(response.status).toBe(404);
    const ofertas = await ofertasDe(premio.id);
    expect(ofertas).toEqual([{ childId: hijos[0]!.id, coins: 200 }]);
  }, 240_000);

  it("sobre un premio de otra familia, 404", async () => {
    const { cookies, hijos } = await familiaOperando(app, ["Ana"]);

    const { parentId: otroPadre } = await asParent(app, {
      email: "otra@monedin.test",
      name: "Otra madre",
    });
    const ajeno = await sembrarPremio(otroPadre, { title: "De otra casa" });

    const response = await reemplazar(cookies, ajeno.id, [
      { childId: hijos[0]!.id, coins: 100 },
    ]);

    expect(response.status).toBe(404);
    expect(response.body.code).toBe(ERROR_CODES.NOT_FOUND);
  }, 180_000);

  it("un niño no reemplaza las ofertas de un premio", async () => {
    const { parentId, hijos } = await familiaOperando(app, ["Ana"]);
    const premio = await sembrarPremio(parentId);

    const response = await reemplazar(hijos[0]!.cookies, premio.id, []);

    expect(response.status).toBe(403);
  }, 120_000);
});

describe("retirar un premio lo saca del escaparate sin destruir nada", () => {
  it("deja de aparecer activo y sigue en el catálogo, marcado como retirado", async () => {
    const { cookies, parentId } = await familiaOperando(app, ["Ana"]);
    const premio = await sembrarPremio(parentId);

    const response = await retirar(cookies, premio.id);

    expect(response.status).toBe(204);
    expect(await estaActivo(premio.id)).toBe(false);

    const catalogo = await request(app)
      .get(`${API_PREFIX}/rewards`)
      .set("Cookie", cookies)
      .query({ status: "RETIRED" });
    expect(catalogo.body.items).toHaveLength(1);
  }, 180_000);

  it("retirar dos veces responde igual que un premio inexistente", async () => {
    const { cookies, parentId } = await familiaOperando(app, ["Ana"]);
    const premio = await sembrarPremio(parentId);

    await retirar(cookies, premio.id).expect(204);
    const segundo = await retirar(cookies, premio.id);
    const inventado = await retirar(cookies, "no-existe");

    expect(segundo.status).toBe(404);
    expect(segundo.body).toEqual(inventado.body);
  }, 180_000);

  it("un premio de otra familia responde 404 y sigue activo para su dueño", async () => {
    const { cookies } = await familiaOperando(app, ["Ana"]);

    const { parentId: otroPadre } = await asParent(app, {
      email: "otra@monedin.test",
      name: "Otra madre",
    });
    const ajeno = await sembrarPremio(otroPadre, { title: "De otra casa" });

    const response = await retirar(cookies, ajeno.id);

    expect(response.status).toBe(404);
    expect(await estaActivo(ajeno.id)).toBe(true);
  }, 180_000);

  it("un niño no retira premios", async () => {
    const { parentId, hijos } = await familiaOperando(app, ["Ana"]);
    const premio = await sembrarPremio(parentId);

    const response = await retirar(hijos[0]!.cookies, premio.id);

    expect(response.status).toBe(403);
    expect(await estaActivo(premio.id)).toBe(true);
  }, 120_000);
});
