import { API_PREFIX, DEFAULT_PAGE_SIZE, ERROR_CODES } from "@monedin/contracts";
import request from "supertest";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../../src/app.js";
import { resetAuthData } from "../support/auth.js";
import { sembrarCanje } from "../support/redemptions.js";
import { fijarSaldo, sembrarPremio } from "../support/rewards.js";
import { familiaOperando } from "../support/tasks.js";

const app = createApp();

beforeEach(async () => {
  await resetAuthData();
});

afterAll(async () => {
  await resetAuthData();
});

function bandeja(cookies: string[], query: Record<string, unknown> = {}): request.Test {
  return request(app).get(`${API_PREFIX}/redemptions`).set("Cookie", cookies).query(query);
}

function propios(cookies: string[], query: Record<string, unknown> = {}): request.Test {
  return request(app).get(`${API_PREFIX}/redemptions/mine`).set("Cookie", cookies).query(query);
}

function detalle(cookies: string[], redemptionId: string): request.Test {
  return request(app).get(`${API_PREFIX}/redemptions/${redemptionId}`).set("Cookie", cookies);
}

describe("la bandeja del padre", () => {
  it("filtra por estado", async () => {
    const { cookies, parentId, hijos } = await familiaOperando(app, ["Ana"]);
    const ana = hijos[0]!;
    const premio = await sembrarPremio(parentId, { offers: [{ childId: ana.id, coins: 60 }] });
    await sembrarCanje({ childId: ana.id, rewardId: premio.id }, { status: "PENDING" });
    await sembrarCanje({ childId: ana.id, rewardId: premio.id }, { status: "APPROVED" });

    const response = await bandeja(cookies, { status: "PENDING" });

    expect(response.status).toBe(200);
    expect(response.body.total).toBe(1);
    expect(response.body.items[0].status).toBe("PENDING");
  }, 180_000);

  it("filtra por hijo", async () => {
    const { cookies, parentId, hijos } = await familiaOperando(app, ["Ana", "Bruno"]);
    const [ana, bruno] = hijos;
    const premio = await sembrarPremio(parentId, {
      offers: [
        { childId: ana!.id, coins: 60 },
        { childId: bruno!.id, coins: 60 },
      ],
    });
    await sembrarCanje({ childId: ana!.id, rewardId: premio.id });
    await sembrarCanje({ childId: bruno!.id, rewardId: premio.id });

    const response = await bandeja(cookies, { childId: ana!.id });

    expect(response.body.total).toBe(1);
    expect(response.body.items[0].child.id).toBe(ana!.id);
  }, 180_000);

  it("una página posterior a la última devuelve lista vacía, no 404", async () => {
    const { cookies, parentId, hijos } = await familiaOperando(app, ["Ana"]);
    const ana = hijos[0]!;
    const premio = await sembrarPremio(parentId, { offers: [{ childId: ana.id, coins: 60 }] });
    await sembrarCanje({ childId: ana.id, rewardId: premio.id });

    const response = await bandeja(cookies, { page: 9, pageSize: 2 });

    expect(response.status).toBe(200);
    expect(response.body.items).toEqual([]);
    expect(response.body.pageSize).toBe(2);
  }, 120_000);

  it("los metadatos de paginación por defecto son los del proyecto", async () => {
    const { cookies, parentId, hijos } = await familiaOperando(app, ["Ana"]);
    const ana = hijos[0]!;
    const premio = await sembrarPremio(parentId, { offers: [{ childId: ana.id, coins: 60 }] });
    await sembrarCanje({ childId: ana.id, rewardId: premio.id });

    const response = await bandeja(cookies);

    expect(response.body).toMatchObject({ page: 1, pageSize: DEFAULT_PAGE_SIZE });
  }, 120_000);

  it("un niño no usa la bandeja del padre", async () => {
    const { hijos } = await familiaOperando(app, ["Ana"]);

    const response = await bandeja(hijos[0]!.cookies);

    expect(response.status).toBe(403);
    expect(response.body.code).toBe(ERROR_CODES.FORBIDDEN);
  }, 120_000);
});

describe("la lista propia del niño", () => {
  it("solo trae lo suyo, nunca lo de un hermano", async () => {
    const { parentId, hijos } = await familiaOperando(app, ["Ana", "Bruno"]);
    const [ana, bruno] = hijos;
    const premio = await sembrarPremio(parentId, {
      offers: [
        { childId: ana!.id, coins: 60 },
        { childId: bruno!.id, coins: 60 },
      ],
    });
    await sembrarCanje({ childId: ana!.id, rewardId: premio.id });
    await sembrarCanje({ childId: bruno!.id, rewardId: premio.id });

    const response = await propios(ana!.cookies);

    expect(response.body.total).toBe(1);
  }, 180_000);

  it("su forma no lleva el hijo: es él", async () => {
    const { parentId, hijos } = await familiaOperando(app, ["Ana"]);
    const ana = hijos[0]!;
    const premio = await sembrarPremio(parentId, { offers: [{ childId: ana.id, coins: 60 }] });
    await sembrarCanje({ childId: ana.id, rewardId: premio.id });

    const response = await propios(ana.cookies);

    expect(response.body.items[0]).not.toHaveProperty("child");
  }, 120_000);

  it("un padre no usa la lista propia del niño", async () => {
    const { cookies } = await familiaOperando(app, ["Ana"]);

    const response = await propios(cookies);

    expect(response.status).toBe(403);
  }, 120_000);
});

describe("el detalle sirve a los dos roles, cada uno con su forma", () => {
  it("el padre lo ve con el hijo que lo solicitó", async () => {
    const { cookies, parentId, hijos } = await familiaOperando(app, ["Ana"]);
    const ana = hijos[0]!;
    const premio = await sembrarPremio(parentId, { offers: [{ childId: ana.id, coins: 60 }] });
    const canje = await sembrarCanje({ childId: ana.id, rewardId: premio.id });

    const response = await detalle(cookies, canje.id);

    expect(response.status).toBe(200);
    expect(response.body.child.id).toBe(ana.id);
  }, 120_000);

  it("el niño lo ve sin el hijo", async () => {
    const { parentId, hijos } = await familiaOperando(app, ["Ana"]);
    const ana = hijos[0]!;
    const premio = await sembrarPremio(parentId, { offers: [{ childId: ana.id, coins: 60 }] });
    const canje = await sembrarCanje({ childId: ana.id, rewardId: premio.id });

    const response = await detalle(ana.cookies, canje.id);

    expect(response.status).toBe(200);
    expect(response.body).not.toHaveProperty("child");
  }, 120_000);
});

describe("aislamiento entre familias y hermanos", () => {
  it("un padre no ve un canje de otra familia: 404, igual que uno inventado", async () => {
    const { cookies } = await familiaOperando(app, ["Ana"]);

    const { parentId: otroPadre, hijos: otrosHijos } = await familiaOperando(app, ["Carla"], {
      email: "otra@monedin.test",
    });
    const otroPremio = await sembrarPremio(otroPadre, {
      offers: [{ childId: otrosHijos[0]!.id, coins: 60 }],
    });
    const ajeno = await sembrarCanje({ childId: otrosHijos[0]!.id, rewardId: otroPremio.id });

    const deOtraFamilia = await detalle(cookies, ajeno.id);
    const inventado = await detalle(cookies, "no-existe");

    expect(deOtraFamilia.status).toBe(404);
    expect(deOtraFamilia.body.code).toBe(ERROR_CODES.NOT_FOUND);
    expect(deOtraFamilia.body).toEqual(inventado.body);
  }, 300_000);

  it("un niño no ve el canje de un hermano: mismo 404 que uno inventado", async () => {
    const { parentId, hijos } = await familiaOperando(app, ["Ana", "Bruno"]);
    const [ana, bruno] = hijos;
    const premio = await sembrarPremio(parentId, {
      offers: [
        { childId: ana!.id, coins: 60 },
        { childId: bruno!.id, coins: 60 },
      ],
    });
    const deBruno = await sembrarCanje({ childId: bruno!.id, rewardId: premio.id });

    const response = await detalle(ana!.cookies, deBruno.id);

    expect(response.status).toBe(404);
  }, 180_000);

  it("un padre no ve ningún canje de otra familia en su bandeja", async () => {
    const { cookies } = await familiaOperando(app, ["Ana"]);

    const { parentId: otroPadre, hijos: otrosHijos } = await familiaOperando(app, ["Carla"], {
      email: "otra@monedin.test",
    });
    const otroPremio = await sembrarPremio(otroPadre, {
      offers: [{ childId: otrosHijos[0]!.id, coins: 60 }],
    });
    await sembrarCanje({ childId: otrosHijos[0]!.id, rewardId: otroPremio.id });

    const response = await bandeja(cookies);

    expect(response.body.items).toEqual([]);
    expect(response.body.total).toBe(0);
  }, 300_000);

  it("ninguna respuesta de la bandeja contiene el identificador del padre", async () => {
    const { cookies, parentId, hijos } = await familiaOperando(app, ["Ana"]);
    const ana = hijos[0]!;
    await fijarSaldo(ana.id, 100);
    const premio = await sembrarPremio(parentId, { offers: [{ childId: ana.id, coins: 60 }] });
    await sembrarCanje({ childId: ana.id, rewardId: premio.id });

    const response = await bandeja(cookies);

    expect(JSON.stringify(response.body)).not.toContain(parentId);
    expect(JSON.stringify(response.body)).not.toContain("parentId");
  }, 120_000);
});
