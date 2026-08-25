import { API_PREFIX, DEFAULT_PAGE_SIZE, ERROR_CODES } from "@monedin/contracts";
import request from "supertest";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../../src/app.js";
import { asParent, createChildProfile, resetAuthData } from "../support/auth.js";
import { familiaOperando, sembrarTarea } from "../support/tasks.js";

const app = createApp();

beforeEach(async () => {
  await resetAuthData();
});

afterAll(async () => {
  await resetAuthData();
});

function listar(cookies: string[], query: Record<string, unknown> = {}): request.Test {
  return request(app).get(`${API_PREFIX}/tasks`).set("Cookie", cookies).query(query);
}

function misTareas(cookies: string[], query: Record<string, unknown> = {}): request.Test {
  return request(app).get(`${API_PREFIX}/tasks/mine`).set("Cookie", cookies).query(query);
}

interface TareaEnRespuesta {
  id: string;
  coins: number;
  status: string;
  child: { id: string; name: string };
}

interface RepartoEnRespuesta {
  batchId: string;
  title: string;
  tasks: TareaEnRespuesta[];
}

describe("el padre ve sus tareas agrupadas por reparto", () => {
  it("un reparto entre dos hijos aparece como un solo grupo", async () => {
    const { cookies, parentId, hijos } = await familiaOperando(app, ["Ana", "Bruno"]);
    const reparto = "reparto-basura";

    await sembrarTarea(
      { parentId, childId: hijos[0]!.id },
      { title: "Sacar la basura", coins: 25, batchId: reparto },
    );
    await sembrarTarea(
      { parentId, childId: hijos[1]!.id },
      { title: "Sacar la basura", coins: 40, batchId: reparto, status: "COMPLETED" },
    );

    const response = await listar(cookies);

    expect(response.status).toBe(200);
    expect(response.body.items).toHaveLength(1);

    const [grupo] = response.body.items as RepartoEnRespuesta[];
    expect(grupo?.title).toBe("Sacar la basura");
    expect(grupo?.tasks).toHaveLength(2);

    // Cada tarea dice de qué hijo es, cuánto vale y en qué estado está.
    const porNombre = Object.fromEntries(
      (grupo?.tasks ?? []).map((tarea) => [tarea.child.name, tarea]),
    );
    expect(porNombre.Ana).toMatchObject({ coins: 25, status: "PENDING" });
    expect(porNombre.Bruno).toMatchObject({ coins: 40, status: "COMPLETED" });
  }, 180_000);

  it("el total cuenta REPARTOS, no filas", async () => {
    const { cookies, parentId, hijos } = await familiaOperando(app, ["Ana", "Bruno"]);

    // Tres repartos que suman siete tareas.
    for (const [indice, tareas] of [3, 2, 2].entries()) {
      const reparto = `reparto-${indice}`;
      for (let n = 0; n < tareas; n += 1) {
        await sembrarTarea(
          { parentId, childId: hijos[n % hijos.length]!.id },
          { title: `Tarea ${indice}`, batchId: reparto },
        );
      }
    }

    const response = await listar(cookies);

    expect(response.body.total).toBe(3);
    expect(response.body.items).toHaveLength(3);
    expect(response.body).toMatchObject({ page: 1, pageSize: DEFAULT_PAGE_SIZE, totalPages: 1 });
  }, 240_000);

  it("una familia sin tareas ve una lista vacía, no un error", async () => {
    const { cookies } = await familiaOperando(app, ["Ana"]);

    const response = await listar(cookies);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ items: [], total: 0, totalPages: 1 });
  }, 120_000);

  it("la respuesta no filtra el padre dueño", async () => {
    const { cookies, parentId, hijos } = await familiaOperando(app, ["Ana"]);
    await sembrarTarea({ parentId, childId: hijos[0]!.id });

    const response = await listar(cookies);

    expect(JSON.stringify(response.body)).not.toContain(parentId);
    expect(JSON.stringify(response.body)).not.toContain("parentId");
  }, 120_000);
});

describe("la paginación es por reparto", () => {
  /** Tres repartos de dos tareas cada uno, en orden conocido. */
  async function tresRepartos(
    parentId: string,
    childIds: string[],
  ): Promise<string[]> {
    const repartos: string[] = [];

    for (const indice of [0, 1, 2]) {
      const batchId = `reparto-${indice}`;
      repartos.push(batchId);
      for (const childId of childIds) {
        await sembrarTarea(
          { parentId, childId },
          {
            title: `Tarea ${indice}`,
            batchId,
            // Fechas separadas para que el orden sea el mismo en cada corrida.
            createdAt: new Date(Date.UTC(2026, 7, 10 + indice, 12, 0, 0)),
          },
        );
      }
    }

    return repartos;
  }

  it("un reparto nunca se parte entre dos páginas", async () => {
    const { cookies, parentId, hijos } = await familiaOperando(app, ["Ana", "Bruno"]);
    await tresRepartos(
      parentId,
      hijos.map((hijo) => hijo.id),
    );

    const primera = await listar(cookies, { page: 1, pageSize: 2 });
    const segunda = await listar(cookies, { page: 2, pageSize: 2 });

    expect(primera.body.items).toHaveLength(2);
    expect(segunda.body.items).toHaveLength(1);

    // Cada grupo llega completo, con sus dos tareas.
    for (const grupo of [...primera.body.items, ...segunda.body.items] as RepartoEnRespuesta[]) {
      expect(grupo.tasks).toHaveLength(2);
    }
  }, 240_000);

  it("recorrer todas las páginas devuelve cada reparto exactamente una vez", async () => {
    const { cookies, parentId, hijos } = await familiaOperando(app, ["Ana", "Bruno"]);
    const esperados = await tresRepartos(
      parentId,
      hijos.map((hijo) => hijo.id),
    );

    const vistos: string[] = [];
    for (const page of [1, 2, 3]) {
      const response = await listar(cookies, { page, pageSize: 2 });
      vistos.push(...(response.body.items as RepartoEnRespuesta[]).map((uno) => uno.batchId));
    }

    expect(vistos).toHaveLength(esperados.length);
    expect(new Set(vistos).size).toBe(esperados.length);
    expect([...vistos].sort()).toEqual([...esperados].sort());
  }, 300_000);

  it("una página posterior a la última devuelve lista vacía, no 404", async () => {
    const { cookies, parentId, hijos } = await familiaOperando(app, ["Ana"]);
    await sembrarTarea({ parentId, childId: hijos[0]!.id });

    const response = await listar(cookies, { page: 9, pageSize: 2 });

    expect(response.status).toBe(200);
    expect(response.body.items).toEqual([]);
  }, 120_000);
});

describe("los filtros del listado", () => {
  it("filtrar por completadas es la bandeja de lo que hay que aprobar", async () => {
    const { cookies, parentId, hijos } = await familiaOperando(app, ["Ana", "Bruno"]);

    await sembrarTarea(
      { parentId, childId: hijos[0]!.id },
      { title: "Marcada", batchId: "con-marcada", status: "COMPLETED" },
    );
    await sembrarTarea(
      { parentId, childId: hijos[1]!.id },
      { title: "Sin marcar", batchId: "sin-marcar", status: "PENDING" },
    );

    const response = await listar(cookies, { status: "COMPLETED" });

    expect(response.body.total).toBe(1);
    expect((response.body.items as RepartoEnRespuesta[])[0]?.title).toBe("Marcada");
  }, 180_000);

  it("filtrar por estado enseña el reparto ENTERO, no solo la tarea que casó", async () => {
    // Es una decisión, no un descuido: el padre quiere ver el reparto completo
    // aunque solo una de las dos esté para aprobar. Decisión 5 del design.
    const { cookies, parentId, hijos } = await familiaOperando(app, ["Ana", "Bruno"]);

    await sembrarTarea(
      { parentId, childId: hijos[0]!.id },
      { batchId: "mismo", status: "COMPLETED" },
    );
    await sembrarTarea({ parentId, childId: hijos[1]!.id }, { batchId: "mismo", status: "PENDING" });

    const response = await listar(cookies, { status: "COMPLETED" });

    expect(response.body.items).toHaveLength(1);
    expect((response.body.items as RepartoEnRespuesta[])[0]?.tasks).toHaveLength(2);
  }, 180_000);

  it("filtrar por hijo devuelve solo las tareas de ese hijo", async () => {
    const { cookies, parentId, hijos } = await familiaOperando(app, ["Ana", "Bruno"]);
    const ana = hijos[0]!;

    await sembrarTarea({ parentId, childId: ana.id }, { batchId: "compartido" });
    await sembrarTarea({ parentId, childId: hijos[1]!.id }, { batchId: "compartido" });
    await sembrarTarea({ parentId, childId: hijos[1]!.id }, { batchId: "solo-bruno" });

    const response = await listar(cookies, { childId: ana.id });

    expect(response.body.items).toHaveLength(1);
    const [grupo] = response.body.items as RepartoEnRespuesta[];
    expect(grupo?.tasks).toHaveLength(1);
    expect(grupo?.tasks[0]?.child.id).toBe(ana.id);
  }, 240_000);

  it("un estado inventado es entrada inválida", async () => {
    const { cookies } = await familiaOperando(app, ["Ana"]);

    const response = await listar(cookies, { status: "REJECTED" });

    expect(response.status).toBe(422);
    expect(response.body.code).toBe(ERROR_CODES.VALIDATION_ERROR);
  }, 120_000);
});

describe("el niño ve sus tareas y solo las suyas", () => {
  it("obtiene las suyas con su valor y su estado", async () => {
    const { parentId, hijos } = await familiaOperando(app, ["Ana"]);
    const ana = hijos[0]!;
    await sembrarTarea(
      { parentId, childId: ana.id },
      { title: "Regar las plantas", coins: 15, status: "COMPLETED" },
    );

    const response = await misTareas(ana.cookies);

    expect(response.status).toBe(200);
    expect(response.body.items).toHaveLength(1);
    expect(response.body.items[0]).toMatchObject({
      title: "Regar las plantas",
      coins: 15,
      status: "COMPLETED",
    });
  }, 120_000);

  it("ninguna de las devueltas es de su hermano", async () => {
    const { parentId, hijos } = await familiaOperando(app, ["Ana", "Bruno"]);
    const [ana, bruno] = hijos as [typeof hijos[0], typeof hijos[0]];

    await sembrarTarea({ parentId, childId: ana.id }, { title: "De Ana" });
    await sembrarTarea({ parentId, childId: bruno.id }, { title: "De Bruno" });

    const response = await misTareas(ana.cookies);

    expect(response.body.items).toHaveLength(1);
    expect(response.body.items[0].title).toBe("De Ana");
  }, 180_000);

  it("su lista no lleva el reparto ni datos de nadie más", async () => {
    const { parentId, hijos } = await familiaOperando(app, ["Ana"]);
    await sembrarTarea({ parentId, childId: hijos[0]!.id });

    const response = await misTareas(hijos[0]!.cookies);

    const cuerpo = JSON.stringify(response.body);
    expect(cuerpo).not.toContain("batchId");
    expect(cuerpo).not.toContain(parentId);
  }, 120_000);

  it("no puede pedir la lista de otro: el parámetro no existe", async () => {
    const { hijos } = await familiaOperando(app, ["Ana", "Bruno"]);

    const response = await misTareas(hijos[0]!.cookies, { childId: hijos[1]!.id });

    expect(response.status).toBe(422);
  }, 180_000);

  it("un padre no usa el listado del niño", async () => {
    const { cookies } = await familiaOperando(app, ["Ana"]);

    const response = await misTareas(cookies);

    expect(response.status).toBe(403);
    expect(response.body.code).toBe(ERROR_CODES.FORBIDDEN);
  }, 120_000);

  it("un niño no usa el listado del padre", async () => {
    const { hijos } = await familiaOperando(app, ["Ana"]);

    const response = await listar(hijos[0]!.cookies);

    expect(response.status).toBe(403);
  }, 120_000);
});

describe("aislamiento entre familias", () => {
  it("un padre no ve ninguna tarea de otra familia", async () => {
    const { cookies } = await familiaOperando(app, ["Ana"]);

    const { parentId: otroPadre } = await asParent(app, {
      email: "otra@monedin.test",
      name: "Otra madre",
    });
    const ajeno = await createChildProfile(otroPadre, { name: "Ajeno", pin: "9999" });
    await sembrarTarea({ parentId: otroPadre, childId: ajeno.id }, { title: "De otra casa" });

    const response = await listar(cookies);

    expect(response.body.items).toEqual([]);
    expect(response.body.total).toBe(0);
  }, 240_000);

  it("una tarea ajena responde igual que un identificador inventado", async () => {
    const { cookies } = await familiaOperando(app, ["Ana"]);

    const { parentId: otroPadre } = await asParent(app, {
      email: "otra@monedin.test",
      name: "Otra madre",
    });
    const ajeno = await createChildProfile(otroPadre, { name: "Ajeno", pin: "9999" });
    const tareaAjena = await sembrarTarea({ parentId: otroPadre, childId: ajeno.id });

    const deOtraFamilia = await request(app)
      .get(`${API_PREFIX}/tasks/${tareaAjena.id}`)
      .set("Cookie", cookies);
    const inventada = await request(app)
      .get(`${API_PREFIX}/tasks/no-existe`)
      .set("Cookie", cookies);

    expect(deOtraFamilia.status).toBe(404);
    expect(deOtraFamilia.body.code).toBe(ERROR_CODES.NOT_FOUND);
    expect(deOtraFamilia.body).toEqual(inventada.body);
  }, 240_000);

  it("el niño que pide la tarea de un hermano recibe el mismo 404", async () => {
    const { parentId, hijos } = await familiaOperando(app, ["Ana", "Bruno"]);
    const deBruno = await sembrarTarea({ parentId, childId: hijos[1]!.id });

    const delHermano = await request(app)
      .get(`${API_PREFIX}/tasks/${deBruno.id}`)
      .set("Cookie", hijos[0]!.cookies);
    const inventada = await request(app)
      .get(`${API_PREFIX}/tasks/no-existe`)
      .set("Cookie", hijos[0]!.cookies);

    expect(delHermano.status).toBe(404);
    expect(delHermano.body).toEqual(inventada.body);
  }, 180_000);

  it("el padre ve el detalle de una tarea suya", async () => {
    const { cookies, parentId, hijos } = await familiaOperando(app, ["Ana"]);
    const tarea = await sembrarTarea({ parentId, childId: hijos[0]!.id }, { coins: 33 });

    const response = await request(app)
      .get(`${API_PREFIX}/tasks/${tarea.id}`)
      .set("Cookie", cookies);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ coins: 33, status: "PENDING" });
    expect(response.body.child.name).toBe("Ana");
  }, 120_000);

  it("«mine» no lo atrapa la ruta del detalle", async () => {
    // Si `/tasks/:taskId` se registrara antes, esto buscaría una tarea llamada
    // «mine» y el niño recibiría un 404 en su propia lista. El fallo no es
    // ruidoso, y por eso lleva test.
    const { hijos } = await familiaOperando(app, ["Ana"]);

    const response = await misTareas(hijos[0]!.cookies);

    expect(response.status).toBe(200);
    expect(response.body.items).toEqual([]);
  }, 120_000);
});
