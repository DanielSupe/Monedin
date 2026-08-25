import { API_PREFIX, COINS_MAX, COINS_MIN, ERROR_CODES } from "@monedin/contracts";
import request from "supertest";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../../src/app.js";
import { asParent, createChildProfile, resetAuthData } from "../support/auth.js";
import { cuantasTareasTiene, familiaOperando, saldoDe } from "../support/tasks.js";

const app = createApp();

beforeEach(async () => {
  await resetAuthData();
});

afterAll(async () => {
  await resetAuthData();
});

function repartir(cookies: string[], body: Record<string, unknown>): request.Test {
  return request(app).post(`${API_PREFIX}/tasks`).set("Cookie", cookies).send(body);
}

describe("un padre reparte una tarea entre sus hijos", () => {
  it("crea una tarea por hijo, con el mismo valor para todos", async () => {
    const { cookies, hijos } = await familiaOperando(app, ["Ana", "Bruno"]);

    const response = await repartir(cookies, {
      title: "Sacar la basura",
      childIds: hijos.map((hijo) => hijo.id),
      coins: 25,
    });

    expect(response.status).toBe(201);
    expect(response.body).toHaveLength(2);
    expect(response.body.map((tarea: { child: { name: string } }) => tarea.child.name)).toEqual(
      expect.arrayContaining(["Ana", "Bruno"]),
    );
    for (const tarea of response.body) {
      expect(tarea).toMatchObject({ title: "Sacar la basura", coins: 25, status: "PENDING" });
    }
  }, 180_000);

  it("todas las tareas del reparto comparten identificador de reparto", async () => {
    const { cookies, hijos } = await familiaOperando(app, ["Ana", "Bruno"]);

    const response = await repartir(cookies, {
      title: "Sacar la basura",
      childIds: hijos.map((hijo) => hijo.id),
      coins: 25,
    });

    const repartos = new Set(response.body.map((tarea: { batchId: string }) => tarea.batchId));
    expect(repartos.size).toBe(1);
  }, 180_000);

  it("dos repartos del mismo título en momentos distintos son repartos distintos", async () => {
    const { cookies, hijos } = await familiaOperando(app, ["Ana"]);
    const alta = { title: "Sacar la basura", childIds: [hijos[0]?.id], coins: 25 };

    const primero = await repartir(cookies, alta).expect(201);
    const segundo = await repartir(cookies, alta).expect(201);

    expect(primero.body[0].batchId).not.toBe(segundo.body[0].batchId);
  }, 180_000);

  it("una tarea para un solo hijo también tiene su reparto", async () => {
    const { cookies, hijos } = await familiaOperando(app, ["Ana"]);

    const response = await repartir(cookies, {
      title: "Sacar la basura",
      childIds: [hijos[0]?.id],
      coins: 25,
    });

    expect(response.status).toBe(201);
    expect(response.body[0].batchId).toEqual(expect.any(String));
  }, 120_000);

  it("acepta un valor distinto por hijo", async () => {
    const { cookies, hijos } = await familiaOperando(app, ["Ana", "Bruno"]);

    const response = await repartir(cookies, {
      title: "Ordenar el cuarto",
      assignments: [
        { childId: hijos[0]?.id, coins: 25 },
        { childId: hijos[1]?.id, coins: 40 },
      ],
    });

    expect(response.status).toBe(201);

    const porNombre = Object.fromEntries(
      response.body.map((tarea: { child: { name: string }; coins: number }) => [
        tarea.child.name,
        tarea.coins,
      ]),
    );
    expect(porNombre).toEqual({ Ana: 25, Bruno: 40 });
  }, 180_000);

  it("repartir no acredita ni una moneda", async () => {
    const { cookies, hijos } = await familiaOperando(app, ["Ana"]);
    const hijo = hijos[0]!;

    await repartir(cookies, { title: "Sacar la basura", childIds: [hijo.id], coins: 25 }).expect(
      201,
    );

    expect(await saldoDe(hijo.id)).toBe(0);
  }, 120_000);

  it("guarda la descripción y la fecha límite cuando vienen", async () => {
    const { cookies, hijos } = await familiaOperando(app, ["Ana"]);
    const limite = "2026-12-24T18:00:00.000Z";

    const response = await repartir(cookies, {
      title: "Envolver los regalos",
      description: "Los de la abuela primero",
      dueDate: limite,
      childIds: [hijos[0]?.id],
      coins: 30,
    });

    expect(response.status).toBe(201);
    expect(response.body[0]).toMatchObject({
      description: "Los de la abuela primero",
      dueDate: limite,
    });
  }, 120_000);

  it("sin fecha límite la tarea queda creada igualmente y sin fecha", async () => {
    const { cookies, hijos } = await familiaOperando(app, ["Ana"]);

    const response = await repartir(cookies, {
      title: "Sacar la basura",
      childIds: [hijos[0]?.id],
      coins: 25,
    });

    expect(response.status).toBe(201);
    expect(response.body[0].dueDate).toBeNull();
  }, 120_000);
});

describe("el reparto es todo o nada", () => {
  it("con un hijo de otra familia no se crea ninguna tarea", async () => {
    const { cookies, hijos, parentId } = await familiaOperando(app, ["Ana", "Bruno"]);

    // Otra familia, con su propio hijo.
    const { parentId: otroPadre } = await asParent(app, {
      email: "otra@monedin.test",
      name: "Otra madre",
    });
    const ajeno = await createChildProfile(otroPadre, { name: "Ajeno", pin: "9999" });

    const response = await repartir(cookies, {
      title: "Sacar la basura",
      childIds: [hijos[0]?.id, hijos[1]?.id, ajeno.id],
      coins: 25,
    });

    expect(response.status).toBe(404);
    expect(response.body.code).toBe(ERROR_CODES.NOT_FOUND);

    // Ni siquiera las de sus propios hijos.
    expect(await cuantasTareasTiene(parentId)).toBe(0);
  }, 240_000);

  it("con un hijo dado de baja no se crea ninguna tarea", async () => {
    const { cookies, hijos, parentId } = await familiaOperando(app, ["Ana", "Bruno"]);
    const baja = hijos[1]!;

    await request(app)
      .delete(`${API_PREFIX}/children/${baja.id}`)
      .set("Cookie", cookies)
      .expect(204);

    const response = await repartir(cookies, {
      title: "Sacar la basura",
      childIds: [hijos[0]?.id, baja.id],
      coins: 25,
    });

    expect(response.status).toBe(404);
    expect(await cuantasTareasTiene(parentId)).toBe(0);
  }, 240_000);

  it("un identificador inventado responde igual que uno de otra familia", async () => {
    const { cookies, hijos, parentId } = await familiaOperando(app, ["Ana"]);

    const response = await repartir(cookies, {
      title: "Sacar la basura",
      childIds: [hijos[0]?.id, "no-existe"],
      coins: 25,
    });

    // Mismo estado y mismo código que el caso del hijo ajeno: no se puede
    // deducir cuál de los dos era.
    expect(response.status).toBe(404);
    expect(response.body.code).toBe(ERROR_CODES.NOT_FOUND);
    expect(await cuantasTareasTiene(parentId)).toBe(0);
  }, 120_000);
});

describe("qué entradas rechaza el alta", () => {
  it("las dos formas del valor a la vez son entrada inválida", async () => {
    const { cookies, hijos } = await familiaOperando(app, ["Ana"]);

    const response = await repartir(cookies, {
      title: "Sacar la basura",
      childIds: [hijos[0]?.id],
      coins: 25,
      assignments: [{ childId: hijos[0]?.id, coins: 40 }],
    });

    expect(response.status).toBe(422);
    expect(response.body.code).toBe(ERROR_CODES.VALIDATION_ERROR);
  }, 120_000);

  it("sin ninguna de las dos formas también", async () => {
    const { cookies } = await familiaOperando(app, ["Ana"]);

    const response = await repartir(cookies, { title: "Sacar la basura" });

    expect(response.status).toBe(422);
  }, 120_000);

  it("un valor fuera de rango se rechaza ANTES de tocar la base", async () => {
    const { cookies, hijos, parentId } = await familiaOperando(app, ["Ana"]);

    for (const coins of [COINS_MIN - 1, COINS_MAX + 1]) {
      const response = await repartir(cookies, {
        title: "Sacar la basura",
        childIds: [hijos[0]?.id],
        coins,
      });

      expect(response.status).toBe(422);
      expect(response.body.details).toEqual(
        expect.arrayContaining([expect.objectContaining({ field: "coins" })]),
      );
    }

    // La validación va antes que la lógica: no llegó a crearse nada, y el CHECK
    // del motor ni siquiera tuvo que intervenir.
    expect(await cuantasTareasTiene(parentId)).toBe(0);
  }, 180_000);

  it("un niño no reparte tareas", async () => {
    const { hijos } = await familiaOperando(app, ["Ana", "Bruno"]);

    const response = await repartir(hijos[0]!.cookies, {
      title: "Sacar la basura",
      childIds: [hijos[1]?.id],
      coins: 25,
    });

    expect(response.status).toBe(403);
    expect(response.body.code).toBe(ERROR_CODES.FORBIDDEN);
  }, 180_000);

  it("sin perfil elegido no se reparte, aunque la cuenta esté acreditada", async () => {
    // La cookie de cuenta acredita el dispositivo, no da actor. Repartir tareas
    // no es uno de los pasos previos a ser alguien.
    const { accountCookies, hijos } = await familiaOperando(app, ["Ana"]);

    const response = await repartir(accountCookies, {
      title: "Sacar la basura",
      childIds: [hijos[0]?.id],
      coins: 25,
    });

    expect(response.status).toBe(401);
  }, 120_000);
});
