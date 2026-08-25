import { API_PREFIX, ERROR_CODES } from "@monedin/contracts";
import request from "supertest";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../../src/app.js";
import { asParent, resetAuthData } from "../support/auth.js";
import { fijarSaldo, sembrarPremio } from "../support/rewards.js";
import { familiaOperando, sembrarTarea } from "../support/tasks.js";

const app = createApp();

beforeEach(async () => {
  await resetAuthData();
});

afterAll(async () => {
  await resetAuthData();
});

function escaparate(cookies: string[], query: Record<string, unknown> = {}): request.Test {
  return request(app).get(`${API_PREFIX}/rewards/mine`).set("Cookie", cookies).query(query);
}

describe("el niño ve su escaparate y solo el suyo", () => {
  it("obtiene los premios ofrecidos a él, con su precio", async () => {
    const { parentId, hijos } = await familiaOperando(app, ["Ana"]);
    await sembrarPremio(parentId, {
      title: "Ir al cine",
      offers: [{ childId: hijos[0]!.id, coins: 200 }],
    });

    const response = await escaparate(hijos[0]!.cookies);

    expect(response.status).toBe(200);
    expect(response.body.items).toHaveLength(1);
    expect(response.body.items[0]).toMatchObject({ title: "Ir al cine", coins: 200 });
  }, 120_000);

  it("el precio del hermano no aparece en ninguna parte de la respuesta", async () => {
    const { parentId, hijos } = await familiaOperando(app, ["Ana", "Bruno"]);
    await sembrarPremio(parentId, {
      title: "Ir al cine",
      offers: [
        { childId: hijos[0]!.id, coins: 200 },
        { childId: hijos[1]!.id, coins: 999 },
      ],
    });

    const response = await escaparate(hijos[0]!.cookies);

    expect(response.body.items).toHaveLength(1);
    expect(response.body.items[0].coins).toBe(200);
    // El precio del hermano no está en el cuerpo, en absoluto: se comprueba
    // sobre el JSON serializado, no sobre los campos que el test decide mirar.
    expect(JSON.stringify(response.body)).not.toContain("999");
  }, 180_000);

  it("un premio ofrecido solo a su hermano no aparece", async () => {
    const { parentId, hijos } = await familiaOperando(app, ["Ana", "Bruno"]);
    await sembrarPremio(parentId, {
      title: "Solo de Bruno",
      offers: [{ childId: hijos[1]!.id, coins: 100 }],
    });

    const response = await escaparate(hijos[0]!.cookies);

    expect(response.body.items).toEqual([]);
  }, 180_000);

  it("un premio retirado no aparece", async () => {
    const { parentId, hijos } = await familiaOperando(app, ["Ana"]);
    await sembrarPremio(parentId, {
      title: "Retirado",
      isActive: false,
      offers: [{ childId: hijos[0]!.id, coins: 100 }],
    });

    const response = await escaparate(hijos[0]!.cookies);

    expect(response.body.items).toEqual([]);
  }, 120_000);

  it("no puede pedir el escaparate de otro: el parámetro no existe", async () => {
    const { hijos } = await familiaOperando(app, ["Ana", "Bruno"]);

    const response = await escaparate(hijos[0]!.cookies, { childId: hijos[1]!.id });

    expect(response.status).toBe(422);
  }, 180_000);

  it("un padre no usa el escaparate del niño", async () => {
    const { cookies } = await familiaOperando(app, ["Ana"]);

    const response = await escaparate(cookies);

    expect(response.status).toBe(403);
    expect(response.body.code).toBe(ERROR_CODES.FORBIDDEN);
  }, 120_000);

  it("consultar un premio que no es suyo responde igual que uno inexistente", async () => {
    const { parentId, hijos } = await familiaOperando(app, ["Ana", "Bruno"]);
    const soloBruno = await sembrarPremio(parentId, {
      title: "Solo de Bruno",
      offers: [{ childId: hijos[1]!.id, coins: 100 }],
    });

    const ajeno = await request(app)
      .get(`${API_PREFIX}/rewards/${soloBruno.id}`)
      .set("Cookie", hijos[0]!.cookies);
    const inventado = await request(app)
      .get(`${API_PREFIX}/rewards/no-existe`)
      .set("Cookie", hijos[0]!.cookies);

    expect(ajeno.status).toBe(404);
    expect(ajeno.body).toEqual(inventado.body);
  }, 240_000);
});

describe("el escaparate dice si le alcanza", () => {
  it("con saldo de sobra, aparece alcanzable", async () => {
    const { parentId, hijos } = await familiaOperando(app, ["Ana"]);
    await sembrarPremio(parentId, {
      title: "Barato",
      offers: [{ childId: hijos[0]!.id, coins: 100 }],
    });

    await fijarSaldo(hijos[0]!.id, 200);

    const response = await escaparate(hijos[0]!.cookies);

    expect(response.body.items[0]).toMatchObject({ coins: 100, affordable: true });
  }, 180_000);

  it("sin saldo suficiente, aparece pero marcado como no alcanzable", async () => {
    const { parentId, hijos } = await familiaOperando(app, ["Ana"]);
    await sembrarPremio(parentId, {
      title: "Caro",
      offers: [{ childId: hijos[0]!.id, coins: 500 }],
    });

    const response = await escaparate(hijos[0]!.cookies);

    expect(response.body.items).toHaveLength(1);
    expect(response.body.items[0]).toMatchObject({ coins: 500, affordable: false });
  }, 120_000);

  it("cuando el precio coincide exactamente con el saldo, alcanza", async () => {
    const { parentId, hijos } = await familiaOperando(app, ["Ana"]);
    await sembrarPremio(parentId, {
      title: "Justo",
      offers: [{ childId: hijos[0]!.id, coins: 150 }],
    });

    await fijarSaldo(hijos[0]!.id, 150);

    const response = await escaparate(hijos[0]!.cookies);

    expect(response.body.items[0]).toMatchObject({ coins: 150, affordable: true });
  }, 180_000);

  it("después de aprobarle una tarea que lo cubre, el premio pasa a alcanzable", async () => {
    const { cookies, parentId, hijos } = await familiaOperando(app, ["Ana"]);
    const ana = hijos[0]!;
    await sembrarPremio(parentId, {
      title: "Con ahorro",
      offers: [{ childId: ana.id, coins: 100 }],
    });

    const antes = await escaparate(ana.cookies);
    expect(antes.body.items[0]).toMatchObject({ affordable: false });

    const tarea = await sembrarTarea({ parentId, childId: ana.id }, { coins: 100, status: "COMPLETED" });
    await request(app)
      .post(`${API_PREFIX}/tasks/${tarea.id}/approve`)
      .set("Cookie", cookies)
      .expect(200);

    const despues = await escaparate(ana.cookies);
    expect(despues.body.items[0]).toMatchObject({ affordable: true });
  }, 240_000);
});

describe("roles cruzados", () => {
  it("un padre pidiendo /rewards/mine recibe 403", async () => {
    const { cookies } = await familiaOperando(app, ["Ana"]);

    const response = await escaparate(cookies);

    expect(response.status).toBe(403);
  }, 120_000);

  it("un niño pidiendo el catálogo del padre recibe 403", async () => {
    const { hijos } = await familiaOperando(app, ["Ana"]);

    const response = await request(app)
      .get(`${API_PREFIX}/rewards`)
      .set("Cookie", hijos[0]!.cookies);

    expect(response.status).toBe(403);
  }, 120_000);

  it("el detalle sirve a los dos roles, cada uno con su vista", async () => {
    const { cookies, parentId, hijos } = await familiaOperando(app, ["Ana"]);
    const premio = await sembrarPremio(parentId, {
      title: "Ir al cine",
      offers: [{ childId: hijos[0]!.id, coins: 200 }],
    });

    const vistaPadre = await request(app)
      .get(`${API_PREFIX}/rewards/${premio.id}`)
      .set("Cookie", cookies);
    const vistaNino = await request(app)
      .get(`${API_PREFIX}/rewards/${premio.id}`)
      .set("Cookie", hijos[0]!.cookies);

    expect(vistaPadre.status).toBe(200);
    expect(vistaPadre.body.offers).toHaveLength(1);
    expect(vistaNino.status).toBe(200);
    expect(vistaNino.body).toMatchObject({ coins: 200, affordable: false });
    expect(vistaNino.body.offers).toBeUndefined();
  }, 180_000);
});

describe("fugas de datos", () => {
  it("ninguna respuesta del escaparate contiene el identificador del padre dueño", async () => {
    const { parentId, hijos } = await familiaOperando(app, ["Ana"]);
    await sembrarPremio(parentId, { offers: [{ childId: hijos[0]!.id, coins: 100 }] });

    const response = await escaparate(hijos[0]!.cookies);

    expect(JSON.stringify(response.body)).not.toContain(parentId);
    expect(JSON.stringify(response.body)).not.toContain("parentId");
  }, 120_000);

  it("aislamiento entre familias: nada de otra familia aparece en el escaparate", async () => {
    const { hijos } = await familiaOperando(app, ["Ana"]);

    const { parentId: otroPadre } = await asParent(app, {
      email: "otra@monedin.test",
      name: "Otra madre",
    });
    await sembrarPremio(otroPadre, { title: "De otra casa" });

    const response = await escaparate(hijos[0]!.cookies);

    expect(response.body.items).toEqual([]);
  }, 180_000);
});
