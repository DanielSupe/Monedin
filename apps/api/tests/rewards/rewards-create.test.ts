import { API_PREFIX, COINS_MAX, COINS_MIN, ERROR_CODES } from "@monedin/contracts";
import request from "supertest";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../../src/app.js";
import { asParent, createChildProfile, resetAuthData } from "../support/auth.js";
import { cuantosPremiosTiene } from "../support/rewards.js";
import { familiaOperando } from "../support/tasks.js";

const app = createApp();

beforeEach(async () => {
  await resetAuthData();
});

afterAll(async () => {
  await resetAuthData();
});

function publicar(cookies: string[], body: Record<string, unknown>): request.Test {
  return request(app).post(`${API_PREFIX}/rewards`).set("Cookie", cookies).send(body);
}

describe("un padre publica un premio y le pone precio a cada hijo", () => {
  it("crea un único premio con el mismo precio para todos", async () => {
    const { cookies, hijos } = await familiaOperando(app, ["Ana", "Bruno"]);

    const response = await publicar(cookies, {
      title: "Ir al cine",
      childIds: hijos.map((hijo) => hijo.id),
      coins: 200,
    });

    expect(response.status).toBe(201);
    expect(response.body.title).toBe("Ir al cine");
    expect(response.body.offers).toHaveLength(2);
    for (const offer of response.body.offers) {
      expect(offer.coins).toBe(200);
    }
  }, 180_000);

  it("acepta un precio distinto por hijo, EN UN SOLO PREMIO", async () => {
    const { cookies, hijos } = await familiaOperando(app, ["Ana", "Bruno"]);

    const response = await publicar(cookies, {
      title: "Ir al cine",
      assignments: [
        { childId: hijos[0]?.id, coins: 200 },
        { childId: hijos[1]?.id, coins: 150 },
      ],
    });

    expect(response.status).toBe(201);
    expect(response.body.offers).toHaveLength(2);

    const porNombre = Object.fromEntries(
      response.body.offers.map((offer: { child: { name: string }; coins: number }) => [
        offer.child.name,
        offer.coins,
      ]),
    );
    expect(porNombre).toEqual({ Ana: 200, Bruno: 150 });
  }, 180_000);

  it("un premio nace activo", async () => {
    const { cookies, hijos } = await familiaOperando(app, ["Ana"]);

    const response = await publicar(cookies, {
      title: "Ir al cine",
      childIds: [hijos[0]?.id],
      coins: 200,
    });

    expect(response.body.status).toBe("ACTIVE");
  }, 120_000);

  it("guarda la descripción cuando viene", async () => {
    const { cookies, hijos } = await familiaOperando(app, ["Ana"]);

    const response = await publicar(cookies, {
      title: "Ir al cine",
      description: "Una película a elegir",
      childIds: [hijos[0]?.id],
      coins: 200,
    });

    expect(response.body.description).toBe("Una película a elegir");
  }, 120_000);

  it("sin descripción el premio queda creado igualmente y sin descripción", async () => {
    const { cookies, hijos } = await familiaOperando(app, ["Ana"]);

    const response = await publicar(cookies, {
      title: "Ir al cine",
      childIds: [hijos[0]?.id],
      coins: 200,
    });

    expect(response.status).toBe(201);
    expect(response.body.description).toBeNull();
  }, 120_000);
});

describe("ofrecer un premio es todo o nada", () => {
  it("con un hijo de otra familia no se crea ningún premio", async () => {
    const { cookies, hijos, parentId } = await familiaOperando(app, ["Ana", "Bruno"]);

    const { parentId: otroPadre } = await asParent(app, {
      email: "otra@monedin.test",
      name: "Otra madre",
    });
    const ajeno = await createChildProfile(otroPadre, { name: "Ajeno", pin: "9999" });

    const response = await publicar(cookies, {
      title: "Ir al cine",
      childIds: [hijos[0]?.id, hijos[1]?.id, ajeno.id],
      coins: 200,
    });

    expect(response.status).toBe(404);
    expect(response.body.code).toBe(ERROR_CODES.NOT_FOUND);
    expect(await cuantosPremiosTiene(parentId)).toBe(0);
  }, 240_000);

  it("con un hijo dado de baja no se crea ningún premio", async () => {
    const { cookies, hijos, parentId } = await familiaOperando(app, ["Ana", "Bruno"]);
    const baja = hijos[1]!;

    await request(app)
      .delete(`${API_PREFIX}/children/${baja.id}`)
      .set("Cookie", cookies)
      .expect(204);

    const response = await publicar(cookies, {
      title: "Ir al cine",
      childIds: [hijos[0]?.id, baja.id],
      coins: 200,
    });

    expect(response.status).toBe(404);
    expect(await cuantosPremiosTiene(parentId)).toBe(0);
  }, 240_000);

  it("un identificador inventado responde igual que uno de otra familia", async () => {
    const { cookies, hijos, parentId } = await familiaOperando(app, ["Ana"]);

    const response = await publicar(cookies, {
      title: "Ir al cine",
      childIds: [hijos[0]?.id, "no-existe"],
      coins: 200,
    });

    expect(response.status).toBe(404);
    expect(response.body.code).toBe(ERROR_CODES.NOT_FOUND);
    expect(await cuantosPremiosTiene(parentId)).toBe(0);
  }, 120_000);
});

describe("qué entradas rechaza el alta", () => {
  it("las dos formas de precio a la vez son entrada inválida", async () => {
    const { cookies, hijos } = await familiaOperando(app, ["Ana"]);

    const response = await publicar(cookies, {
      title: "Ir al cine",
      childIds: [hijos[0]?.id],
      coins: 200,
      assignments: [{ childId: hijos[0]?.id, coins: 150 }],
    });

    expect(response.status).toBe(422);
    expect(response.body.code).toBe(ERROR_CODES.VALIDATION_ERROR);
  }, 120_000);

  it("sin ninguna de las dos formas también", async () => {
    const { cookies } = await familiaOperando(app, ["Ana"]);

    const response = await publicar(cookies, { title: "Ir al cine" });

    expect(response.status).toBe(422);
  }, 120_000);

  it("el mismo hijo repetido es entrada inválida", async () => {
    const { cookies, hijos } = await familiaOperando(app, ["Ana"]);

    const response = await publicar(cookies, {
      title: "Ir al cine",
      childIds: [hijos[0]?.id, hijos[0]?.id],
      coins: 200,
    });

    expect(response.status).toBe(422);
  }, 120_000);

  it("un precio fuera de rango se rechaza ANTES de tocar la base", async () => {
    const { cookies, hijos, parentId } = await familiaOperando(app, ["Ana"]);

    for (const coins of [COINS_MIN - 1, 0, COINS_MAX + 1]) {
      const response = await publicar(cookies, {
        title: "Ir al cine",
        childIds: [hijos[0]?.id],
        coins,
      });

      expect(response.status).toBe(422);
      expect(response.body.details).toEqual(
        expect.arrayContaining([expect.objectContaining({ field: "coins" })]),
      );
    }

    expect(await cuantosPremiosTiene(parentId)).toBe(0);
  }, 180_000);

  it("un niño no publica premios", async () => {
    const { hijos } = await familiaOperando(app, ["Ana", "Bruno"]);

    const response = await publicar(hijos[0]!.cookies, {
      title: "Ir al cine",
      childIds: [hijos[1]?.id],
      coins: 200,
    });

    expect(response.status).toBe(403);
    expect(response.body.code).toBe(ERROR_CODES.FORBIDDEN);
  }, 180_000);

  it("sin perfil elegido no se publica, aunque la cuenta esté acreditada", async () => {
    const { accountCookies, hijos } = await familiaOperando(app, ["Ana"]);

    const response = await publicar(accountCookies, {
      title: "Ir al cine",
      childIds: [hijos[0]?.id],
      coins: 200,
    });

    expect(response.status).toBe(401);
  }, 120_000);
});
