import { API_PREFIX, DEFAULT_PAGE_SIZE, ERROR_CODES, MAX_PAGE_SIZE } from "@monedin/contracts";
import request from "supertest";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../../src/app.js";
import { testPrisma } from "../support/database.js";
import {
  asChild,
  asParent,
  createChildProfile,
  familiaConHijos,
  resetAuthData,
} from "../support/auth.js";

const app = createApp();

beforeEach(async () => {
  await resetAuthData();
});

afterAll(async () => {
  await resetAuthData();
});

function listar(cookies: string[], query: Record<string, unknown> = {}): request.Test {
  return request(app).get(`${API_PREFIX}/children`).set("Cookie", cookies).query(query);
}

describe("el padre ve a sus hijos en un listado paginado", () => {
  it("devuelve nombre, avatar, edad y saldo de cada hijo activo", async () => {
    const { cookies, parentId } = await asParent(app);
    await createChildProfile(parentId, { name: "Mateo", pin: "1234", coins: 30, age: 8 });

    const response = await listar(cookies);

    expect(response.status).toBe(200);
    expect(response.body.items).toHaveLength(1);
    expect(response.body.items[0]).toMatchObject({
      name: "Mateo",
      coins: 30,
      age: 8,
      locked: false,
    });
    expect(response.body.items[0].createdAt).toEqual(expect.any(String));
  }, 60_000);

  it("aplica la página y el tamaño por defecto del contrato", async () => {
    const { cookies } = await familiaConHijos(app, ["Ana", "Bruno"]);

    const response = await listar(cookies);

    expect(response.body).toMatchObject({
      page: 1,
      pageSize: DEFAULT_PAGE_SIZE,
      total: 2,
      totalPages: 1,
    });
  }, 120_000);

  it("el total refleja cuántos hay, no cuántos caben en la página", async () => {
    const { cookies } = await familiaConHijos(app, ["Ana", "Bruno", "Carla", "Diego", "Elena"]);

    const response = await listar(cookies, { page: 1, pageSize: 2 });

    expect(response.body.items).toHaveLength(2);
    expect(response.body.total).toBe(5);
    expect(response.body.totalPages).toBe(3);
  }, 180_000);

  it("una familia sin hijos ve una lista vacía, no un error", async () => {
    const { cookies } = await asParent(app);

    const response = await listar(cookies);

    expect(response.status).toBe(200);
    expect(response.body.items).toEqual([]);
    expect(response.body.total).toBe(0);
    // Nunca cero: el front pintaría «página 1 de 0».
    expect(response.body.totalPages).toBe(1);
  }, 60_000);

  it("no incluye hijos dados de baja, ni en la lista ni en el total", async () => {
    const { cookies, parentId } = await asParent(app);
    const activo = await createChildProfile(parentId, { name: "Activo", pin: "1111" });
    const baja = await createChildProfile(parentId, { name: "De baja", pin: "2222" });
    await request(app).delete(`${API_PREFIX}/children/${baja.id}`).set("Cookie", cookies).expect(204);

    const response = await listar(cookies);

    expect(response.body.items.map((c: { id: string }) => c.id)).toEqual([activo.id]);
    expect(response.body.total).toBe(1);
  }, 120_000);

  it("no aparece ningún hijo de otra familia", async () => {
    const nuestra = await familiaConHijos(app, ["Nuestro"]);
    const otra = await familiaConHijos(app, ["Ajeno"], { email: "otra@monedin.test" });

    const response = await listar(nuestra.cookies);

    const nombres = response.body.items.map((c: { name: string }) => c.name);
    expect(nombres).toEqual(["Nuestro"]);
    expect(nombres).not.toContain("Ajeno");
    expect(otra.hijos).toHaveLength(1);
  }, 180_000);

  it("no filtra el PIN ni datos internos", async () => {
    const { cookies, parentId } = await asParent(app);
    await createChildProfile(parentId, { name: "Mateo", pin: "1234" });

    const cuerpo = JSON.stringify((await listar(cookies)).body);

    expect(cuerpo).not.toContain("pinHash");
    expect(cuerpo).not.toContain("parentId");
    expect(cuerpo).not.toContain("deletedAt");
    expect(cuerpo).not.toContain("failedPinAttempts");
  }, 60_000);
});

describe("la paginación del listado", () => {
  it("avanza de página sin repetir ni saltarse a nadie", async () => {
    const { cookies } = await familiaConHijos(app, ["Ana", "Bruno", "Carla", "Diego", "Elena"]);

    const primera = await listar(cookies, { page: 1, pageSize: 2 });
    const segunda = await listar(cookies, { page: 2, pageSize: 2 });
    const tercera = await listar(cookies, { page: 3, pageSize: 2 });

    expect(primera.body.items.map((c: { name: string }) => c.name)).toEqual(["Ana", "Bruno"]);
    expect(segunda.body.items.map((c: { name: string }) => c.name)).toEqual(["Carla", "Diego"]);
    expect(tercera.body.items.map((c: { name: string }) => c.name)).toEqual(["Elena"]);
  }, 180_000);

  it("una página más allá del final es una lista vacía, no un 404", async () => {
    // Quien acaba de dar de baja la última fila de la página 3 no debería
    // tener que tratar un camino de error para descubrir que ya no hay página 3.
    const { cookies } = await familiaConHijos(app, ["Ana"]);

    const response = await listar(cookies, { page: 9 });

    expect(response.status).toBe(200);
    expect(response.body.items).toEqual([]);
  }, 120_000);

  it("un tamaño de página por encima del máximo se rechaza, no se recorta", async () => {
    // Recortar escondería el error de quien llama: pediría 500, recibiría 100
    // y creería que hay 100.
    const { cookies } = await asParent(app);

    const response = await listar(cookies, { pageSize: MAX_PAGE_SIZE + 1 });

    expect(response.status).toBe(422);
    expect(response.body.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    expect(response.body.details[0].field).toBe("query.pageSize");
  }, 60_000);

  it("acepta justo el máximo", async () => {
    const { cookies } = await asParent(app);

    await listar(cookies, { pageSize: MAX_PAGE_SIZE }).expect(200);
  }, 60_000);

  it("rechaza páginas y tamaños sin sentido", async () => {
    const { cookies } = await asParent(app);

    for (const query of [
      { page: 0 },
      { page: -1 },
      { page: "abc" },
      { page: 1.5 },
      { pageSize: 0 },
      { pageSize: -3 },
    ]) {
      const response = await listar(cookies, query);
      expect(response.status, JSON.stringify(query)).toBe(422);
    }
  }, 120_000);

  it("el orden es estable aunque varios hijos compartan el instante de creación", async () => {
    // Este es el test que justifica el desempate por identificador en el
    // orden: `createdAt` no es único, y sin desempate una fila puede salir en
    // dos páginas o en ninguna.
    const { cookies, parentId, hijos } = await familiaConHijos(app, [
      "Ana",
      "Bruno",
      "Carla",
      "Diego",
      "Elena",
    ]);
    const mismoInstante = new Date("2026-08-24T10:00:00.000Z");
    await testPrisma().childProfile.updateMany({
      where: { parentId },
      data: { createdAt: mismoInstante },
    });

    const recogidos: string[] = [];
    for (let page = 1; page <= 3; page += 1) {
      const response = await listar(cookies, { page, pageSize: 2 });
      recogidos.push(...response.body.items.map((c: { id: string }) => c.id));
    }

    expect(recogidos).toHaveLength(hijos.length);
    expect(new Set(recogidos).size).toBe(hijos.length);
    expect([...recogidos].sort()).toEqual(hijos.map((h) => h.id).sort());
  }, 180_000);
});

describe("el listado es del padre y de nadie más", () => {
  it("un niño no puede listar hijos", async () => {
    const { cookies } = await asChild(app);

    const response = await listar(cookies);

    expect(response.status).toBe(403);
    expect(response.body.code).toBe(ERROR_CODES.FORBIDDEN);
  }, 120_000);

  it("con solo la sesión de cuenta se rechaza igual que sin sesión", async () => {
    const { accountCookies } = await asParent(app);

    const response = await listar(accountCookies);

    expect(response.status).toBe(401);
  }, 60_000);

  it("sin ninguna cookie es 401", async () => {
    await request(app).get(`${API_PREFIX}/children`).expect(401);
  }, 60_000);
});
