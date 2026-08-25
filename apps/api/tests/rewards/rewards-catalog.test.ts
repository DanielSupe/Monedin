import { API_PREFIX, DEFAULT_PAGE_SIZE, ERROR_CODES } from "@monedin/contracts";
import request from "supertest";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../../src/app.js";
import { asParent, resetAuthData } from "../support/auth.js";
import { sembrarPremio } from "../support/rewards.js";
import { familiaOperando } from "../support/tasks.js";

const app = createApp();

beforeEach(async () => {
  await resetAuthData();
});

afterAll(async () => {
  await resetAuthData();
});

function catalogo(cookies: string[], query: Record<string, unknown> = {}): request.Test {
  return request(app).get(`${API_PREFIX}/rewards`).set("Cookie", cookies).query(query);
}

function editar(cookies: string[], rewardId: string, body: Record<string, unknown>): request.Test {
  return request(app).patch(`${API_PREFIX}/rewards/${rewardId}`).set("Cookie", cookies).send(body);
}

describe("el padre ve su catálogo con lo que cuesta a cada hijo", () => {
  it("un premio ofrecido a dos hijos aparece una sola vez, con las dos ofertas", async () => {
    const { cookies, parentId, hijos } = await familiaOperando(app, ["Ana", "Bruno"]);
    await sembrarPremio(parentId, {
      title: "Ir al cine",
      offers: [
        { childId: hijos[0]!.id, coins: 200 },
        { childId: hijos[1]!.id, coins: 150 },
      ],
    });

    const response = await catalogo(cookies);

    expect(response.status).toBe(200);
    expect(response.body.items).toHaveLength(1);
    expect(response.body.items[0].offers).toHaveLength(2);
  }, 180_000);

  it("un premio sin ofrecer a nadie aparece igualmente, con la lista vacía", async () => {
    const { cookies, parentId } = await familiaOperando(app, ["Ana"]);
    await sembrarPremio(parentId, { title: "Sin ofertas todavía" });

    const response = await catalogo(cookies);

    expect(response.body.items).toHaveLength(1);
    expect(response.body.items[0].offers).toEqual([]);
  }, 120_000);

  it("un niño no usa el catálogo del padre", async () => {
    const { hijos } = await familiaOperando(app, ["Ana"]);

    const response = await catalogo(hijos[0]!.cookies);

    expect(response.status).toBe(403);
    expect(response.body.code).toBe(ERROR_CODES.FORBIDDEN);
  }, 120_000);
});

describe("filtro y paginación del catálogo", () => {
  it("por defecto solo enseña los activos", async () => {
    const { cookies, parentId } = await familiaOperando(app, ["Ana"]);
    await sembrarPremio(parentId, { title: "Activo" });
    await sembrarPremio(parentId, { title: "Retirado", isActive: false });

    const response = await catalogo(cookies);

    expect(response.body.total).toBe(1);
    expect(response.body.items[0].title).toBe("Activo");
  }, 180_000);

  it("con status=RETIRED enseña solo los retirados", async () => {
    const { cookies, parentId } = await familiaOperando(app, ["Ana"]);
    await sembrarPremio(parentId, { title: "Activo" });
    await sembrarPremio(parentId, { title: "Retirado", isActive: false });

    const response = await catalogo(cookies, { status: "RETIRED" });

    expect(response.body.total).toBe(1);
    expect(response.body.items[0].title).toBe("Retirado");
  }, 180_000);

  it("el total cuenta premios, no ofertas", async () => {
    const { cookies, parentId, hijos } = await familiaOperando(app, ["Ana", "Bruno"]);
    await sembrarPremio(parentId, {
      title: "Con dos ofertas",
      offers: [
        { childId: hijos[0]!.id, coins: 100 },
        { childId: hijos[1]!.id, coins: 100 },
      ],
    });
    await sembrarPremio(parentId, { title: "Sin ofertas" });

    const response = await catalogo(cookies);

    expect(response.body.total).toBe(2);
    expect(response.body).toMatchObject({ page: 1, pageSize: DEFAULT_PAGE_SIZE, totalPages: 1 });
  }, 180_000);

  it("una página posterior a la última devuelve lista vacía, no 404", async () => {
    const { cookies, parentId } = await familiaOperando(app, ["Ana"]);
    await sembrarPremio(parentId);

    const response = await catalogo(cookies, { page: 9, pageSize: 2 });

    expect(response.status).toBe(200);
    expect(response.body.items).toEqual([]);
  }, 120_000);

  it("un estado inventado en el filtro es entrada inválida", async () => {
    const { cookies } = await familiaOperando(app, ["Ana"]);

    const response = await catalogo(cookies, { status: "DELETED" });

    expect(response.status).toBe(422);
    expect(response.body.code).toBe(ERROR_CODES.VALIDATION_ERROR);
  }, 120_000);
});

describe("el precio no vive en el premio, vive en la oferta a cada hijo", () => {
  it("cambiar el título lo cambia para los dos hijos y no toca ningún precio", async () => {
    const { cookies, parentId, hijos } = await familiaOperando(app, ["Ana", "Bruno"]);
    const premio = await sembrarPremio(parentId, {
      title: "Ir al cine",
      offers: [
        { childId: hijos[0]!.id, coins: 200 },
        { childId: hijos[1]!.id, coins: 150 },
      ],
    });

    const response = await editar(cookies, premio.id, { title: "Ir al cine 4D" });

    expect(response.status).toBe(200);
    expect(response.body.title).toBe("Ir al cine 4D");

    const porNombre = Object.fromEntries(
      response.body.offers.map((offer: { child: { name: string }; coins: number }) => [
        offer.child.name,
        offer.coins,
      ]),
    );
    expect(porNombre).toEqual({ Ana: 200, Bruno: 150 });
  }, 180_000);

  it("mandar coins en la edición del premio es entrada inválida", async () => {
    const { cookies, parentId } = await familiaOperando(app, ["Ana"]);
    const premio = await sembrarPremio(parentId);

    const response = await editar(cookies, premio.id, { title: "Otro", coins: 500 });

    expect(response.status).toBe(422);
    expect(response.body.code).toBe(ERROR_CODES.VALIDATION_ERROR);
  }, 120_000);

  it("una edición sin ningún campo no es una edición", async () => {
    const { cookies, parentId } = await familiaOperando(app, ["Ana"]);
    const premio = await sembrarPremio(parentId);

    const response = await editar(cookies, premio.id, {});

    expect(response.status).toBe(422);
  }, 120_000);

  it("un niño no edita premios", async () => {
    const { parentId, hijos } = await familiaOperando(app, ["Ana"]);
    const premio = await sembrarPremio(parentId);

    const response = await editar(hijos[0]!.cookies, premio.id, { title: "Otro" });

    expect(response.status).toBe(403);
  }, 120_000);
});

describe("aislamiento entre familias", () => {
  it("un padre no ve ningún premio de otra familia en su catálogo", async () => {
    const { cookies } = await familiaOperando(app, ["Ana"]);

    const { parentId: otroPadre } = await asParent(app, {
      email: "otra@monedin.test",
      name: "Otra madre",
    });
    await sembrarPremio(otroPadre, { title: "De otra casa" });

    const response = await catalogo(cookies);

    expect(response.body.items).toEqual([]);
    expect(response.body.total).toBe(0);
  }, 180_000);

  it("un premio ajeno responde igual que un identificador inventado, al editar", async () => {
    const { cookies } = await familiaOperando(app, ["Ana"]);

    const { parentId: otroPadre } = await asParent(app, {
      email: "otra@monedin.test",
      name: "Otra madre",
    });
    const ajeno = await sembrarPremio(otroPadre, { title: "De otra casa" });

    const deOtraFamilia = await editar(cookies, ajeno.id, { title: "Robado" });
    const inventado = await editar(cookies, "no-existe", { title: "Robado" });

    expect(deOtraFamilia.status).toBe(404);
    expect(deOtraFamilia.body.code).toBe(ERROR_CODES.NOT_FOUND);
    expect(deOtraFamilia.body).toEqual(inventado.body);
  }, 240_000);

  it("el padre ve el detalle de un premio suyo, con sus ofertas", async () => {
    const { cookies, parentId, hijos } = await familiaOperando(app, ["Ana"]);
    const premio = await sembrarPremio(parentId, {
      title: "Ir al cine",
      offers: [{ childId: hijos[0]!.id, coins: 200 }],
    });

    const response = await request(app)
      .get(`${API_PREFIX}/rewards/${premio.id}`)
      .set("Cookie", cookies);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ title: "Ir al cine", status: "ACTIVE" });
    expect(response.body.offers).toHaveLength(1);
  }, 120_000);

  it("ninguna respuesta del catálogo contiene el identificador del padre dueño", async () => {
    const { cookies, parentId, hijos } = await familiaOperando(app, ["Ana"]);
    await sembrarPremio(parentId, { offers: [{ childId: hijos[0]!.id, coins: 100 }] });

    const response = await catalogo(cookies);

    expect(JSON.stringify(response.body)).not.toContain(parentId);
    expect(JSON.stringify(response.body)).not.toContain("parentId");
  }, 120_000);
});
