import { API_PREFIX, ERROR_CODES } from "@monedin/contracts";
import request from "supertest";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../../src/app.js";
import { resetAuthData } from "../support/auth.js";
import {
  estadoDe,
  familiaOperando,
  movimientosDe,
  saldoDe,
  sembrarTarea,
} from "../support/tasks.js";

const app = createApp();

beforeEach(async () => {
  await resetAuthData();
});

afterAll(async () => {
  await resetAuthData();
});

function completar(cookies: string[], taskId: string): request.Test {
  return request(app).post(`${API_PREFIX}/tasks/${taskId}/complete`).set("Cookie", cookies);
}

function aprobar(cookies: string[], taskId: string): request.Test {
  return request(app).post(`${API_PREFIX}/tasks/${taskId}/approve`).set("Cookie", cookies);
}

function rechazar(cookies: string[], taskId: string): request.Test {
  return request(app).post(`${API_PREFIX}/tasks/${taskId}/reject`).set("Cookie", cookies);
}

describe("el niño marca su tarea como hecha", () => {
  it("una pendiente queda a la espera y su saldo no cambia", async () => {
    const { parentId, hijos } = await familiaOperando(app, ["Ana"]);
    const ana = hijos[0]!;
    const tarea = await sembrarTarea({ parentId, childId: ana.id }, { coins: 50 });

    const response = await completar(ana.cookies, tarea.id);

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("COMPLETED");

    // Marcarla no paga: es lo que hace que la aprobación del padre signifique
    // algo.
    expect(await saldoDe(ana.id)).toBe(0);
    expect(await movimientosDe(tarea.id)).toHaveLength(0);
  }, 120_000);

  it("sobre la de un hermano recibe el 404 de siempre", async () => {
    const { parentId, hijos } = await familiaOperando(app, ["Ana", "Bruno"]);
    const [ana, bruno] = hijos as [(typeof hijos)[0], (typeof hijos)[0]];
    const deBruno = await sembrarTarea({ parentId, childId: bruno.id });

    const response = await completar(ana.cookies, deBruno.id);

    expect(response.status).toBe(404);
    expect(response.body.code).toBe(ERROR_CODES.NOT_FOUND);
    expect(await estadoDe(deBruno.id)).toBe("PENDING");
  }, 180_000);

  it("sobre una ya aprobada es conflicto de estado", async () => {
    const { parentId, hijos } = await familiaOperando(app, ["Ana"]);
    const ana = hijos[0]!;
    const tarea = await sembrarTarea({ parentId, childId: ana.id }, { status: "APPROVED" });

    const response = await completar(ana.cookies, tarea.id);

    expect(response.status).toBe(409);
    expect(response.body.code).toBe(ERROR_CODES.CONFLICT);
  }, 120_000);

  it("un padre no marca tareas como hechas", async () => {
    const { cookies, parentId, hijos } = await familiaOperando(app, ["Ana"]);
    const tarea = await sembrarTarea({ parentId, childId: hijos[0]!.id });

    const response = await completar(cookies, tarea.id);

    expect(response.status).toBe(403);
    expect(await estadoDe(tarea.id)).toBe("PENDING");
  }, 120_000);
});

describe("aprobar una tarea acredita sus monedas", () => {
  it("la deja aprobada, sube el saldo exactamente su valor y deja historial", async () => {
    const { cookies, parentId, hijos } = await familiaOperando(app, ["Ana"]);
    const ana = hijos[0]!;
    const tarea = await sembrarTarea(
      { parentId, childId: ana.id },
      { coins: 50, status: "COMPLETED" },
    );

    const response = await aprobar(cookies, tarea.id);

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("APPROVED");
    expect(await saldoDe(ana.id)).toBe(50);

    const historial = await movimientosDe(tarea.id);
    expect(historial).toHaveLength(1);
    expect(historial[0]).toMatchObject({ amount: 50, balanceAfter: 50, reason: "TASK_APPROVED" });
  }, 120_000);

  it("acredita sobre el saldo que ya tenía", async () => {
    const { cookies, parentId, hijos } = await familiaOperando(app, ["Ana"]);
    const ana = hijos[0]!;
    await sembrarTarea({ parentId, childId: ana.id }, { coins: 30, status: "COMPLETED" }).then(
      (previa) => aprobar(cookies, previa.id).expect(200),
    );

    const segunda = await sembrarTarea(
      { parentId, childId: ana.id },
      { coins: 20, status: "COMPLETED" },
    );
    await aprobar(cookies, segunda.id).expect(200);

    expect(await saldoDe(ana.id)).toBe(50);
    expect((await movimientosDe(segunda.id))[0]?.balanceAfter).toBe(50);
  }, 180_000);

  it("no se puede aprobar lo que nadie ha hecho", async () => {
    const { cookies, parentId, hijos } = await familiaOperando(app, ["Ana"]);
    const ana = hijos[0]!;
    const tarea = await sembrarTarea({ parentId, childId: ana.id }, { coins: 50 });

    const response = await aprobar(cookies, tarea.id);

    expect(response.status).toBe(409);
    expect(response.body.code).toBe(ERROR_CODES.CONFLICT);
    expect(await saldoDe(ana.id)).toBe(0);
    expect(await movimientosDe(tarea.id)).toHaveLength(0);
  }, 120_000);

  it("aprobar algo ya aprobado es conflicto y no vuelve a pagar", async () => {
    const { cookies, parentId, hijos } = await familiaOperando(app, ["Ana"]);
    const ana = hijos[0]!;
    const tarea = await sembrarTarea(
      { parentId, childId: ana.id },
      { coins: 50, status: "COMPLETED" },
    );

    await aprobar(cookies, tarea.id).expect(200);
    const segunda = await aprobar(cookies, tarea.id);

    expect(segunda.status).toBe(409);
    expect(await saldoDe(ana.id)).toBe(50);
    expect(await movimientosDe(tarea.id)).toHaveLength(1);
  }, 120_000);

  it("un niño no aprueba, ni siquiera la suya", async () => {
    const { parentId, hijos } = await familiaOperando(app, ["Ana"]);
    const ana = hijos[0]!;
    const tarea = await sembrarTarea(
      { parentId, childId: ana.id },
      { coins: 50, status: "COMPLETED" },
    );

    const response = await aprobar(ana.cookies, tarea.id);

    expect(response.status).toBe(403);
    expect(await saldoDe(ana.id)).toBe(0);
    expect(await estadoDe(tarea.id)).toBe("COMPLETED");
  }, 120_000);
});

describe("rechazar devuelve la tarea a pendiente", () => {
  it("vuelve a pendiente, el niño puede volver a marcarla y el saldo no cambia", async () => {
    const { cookies, parentId, hijos } = await familiaOperando(app, ["Ana"]);
    const ana = hijos[0]!;
    const tarea = await sembrarTarea(
      { parentId, childId: ana.id },
      { coins: 50, status: "COMPLETED" },
    );

    const response = await rechazar(cookies, tarea.id);

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("PENDING");
    expect(await saldoDe(ana.id)).toBe(0);

    // Y el niño la reintenta.
    await completar(ana.cookies, tarea.id).expect(200);
    expect(await estadoDe(tarea.id)).toBe("COMPLETED");
  }, 120_000);

  it("no se rechaza lo que ya está aprobado, y lo cobrado sigue cobrado", async () => {
    const { cookies, parentId, hijos } = await familiaOperando(app, ["Ana"]);
    const ana = hijos[0]!;
    const tarea = await sembrarTarea(
      { parentId, childId: ana.id },
      { coins: 50, status: "COMPLETED" },
    );
    await aprobar(cookies, tarea.id).expect(200);

    const response = await rechazar(cookies, tarea.id);

    expect(response.status).toBe(409);
    expect(await saldoDe(ana.id)).toBe(50);
    expect(await estadoDe(tarea.id)).toBe("APPROVED");
  }, 120_000);

  it("no se rechaza lo que nadie ha marcado", async () => {
    const { cookies, parentId, hijos } = await familiaOperando(app, ["Ana"]);
    const tarea = await sembrarTarea({ parentId, childId: hijos[0]!.id });

    const response = await rechazar(cookies, tarea.id);

    expect(response.status).toBe(409);
    expect(await estadoDe(tarea.id)).toBe("PENDING");
  }, 120_000);

  it("un niño no rechaza", async () => {
    const { parentId, hijos } = await familiaOperando(app, ["Ana"]);
    const ana = hijos[0]!;
    const tarea = await sembrarTarea({ parentId, childId: ana.id }, { status: "COMPLETED" });

    const response = await rechazar(ana.cookies, tarea.id);

    expect(response.status).toBe(403);
  }, 120_000);
});

describe("editar y borrar, solo mientras está pendiente", () => {
  function editar(cookies: string[], taskId: string, body: Record<string, unknown>): request.Test {
    return request(app).patch(`${API_PREFIX}/tasks/${taskId}`).set("Cookie", cookies).send(body);
  }

  function borrar(cookies: string[], taskId: string): request.Test {
    return request(app).delete(`${API_PREFIX}/tasks/${taskId}`).set("Cookie", cookies);
  }

  it("una pendiente se corrige", async () => {
    const { cookies, parentId, hijos } = await familiaOperando(app, ["Ana"]);
    const tarea = await sembrarTarea({ parentId, childId: hijos[0]!.id }, { coins: 50 });

    const response = await editar(cookies, tarea.id, { title: "Otro título", coins: 75 });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ title: "Otro título", coins: 75 });
  }, 120_000);

  it("una pendiente se borra y desaparece del listado", async () => {
    const { cookies, parentId, hijos } = await familiaOperando(app, ["Ana"]);
    const tarea = await sembrarTarea({ parentId, childId: hijos[0]!.id });

    await borrar(cookies, tarea.id).expect(204);

    const listado = await request(app).get(`${API_PREFIX}/tasks`).set("Cookie", cookies);
    expect(listado.body.items).toEqual([]);
  }, 120_000);

  it("una marcada no se edita ni se borra", async () => {
    const { cookies, parentId, hijos } = await familiaOperando(app, ["Ana"]);
    const tarea = await sembrarTarea(
      { parentId, childId: hijos[0]!.id },
      { coins: 50, status: "COMPLETED" },
    );

    expect((await editar(cookies, tarea.id, { coins: 999 })).status).toBe(409);
    expect((await borrar(cookies, tarea.id)).status).toBe(409);

    // Y sigue igual que estaba.
    const detalle = await request(app)
      .get(`${API_PREFIX}/tasks/${tarea.id}`)
      .set("Cookie", cookies);
    expect(detalle.body).toMatchObject({ coins: 50, status: "COMPLETED" });
  }, 120_000);

  it("una aprobada no se edita ni se borra, y su historial queda intacto", async () => {
    const { cookies, parentId, hijos } = await familiaOperando(app, ["Ana"]);
    const ana = hijos[0]!;
    const tarea = await sembrarTarea(
      { parentId, childId: ana.id },
      { coins: 50, status: "COMPLETED" },
    );
    await aprobar(cookies, tarea.id).expect(200);

    expect((await editar(cookies, tarea.id, { coins: 1 })).status).toBe(409);
    expect((await borrar(cookies, tarea.id)).status).toBe(409);

    expect(await estadoDe(tarea.id)).toBe("APPROVED");
    expect(await saldoDe(ana.id)).toBe(50);
    expect(await movimientosDe(tarea.id)).toHaveLength(1);
  }, 120_000);

  it("un niño no edita ni borra sus tareas", async () => {
    const { parentId, hijos } = await familiaOperando(app, ["Ana"]);
    const ana = hijos[0]!;
    const tarea = await sembrarTarea({ parentId, childId: ana.id });

    expect((await editar(ana.cookies, tarea.id, { coins: 999 })).status).toBe(403);
    expect((await borrar(ana.cookies, tarea.id)).status).toBe(403);
  }, 120_000);

  it("no se reasigna a otro hijo", async () => {
    const { cookies, parentId, hijos } = await familiaOperando(app, ["Ana", "Bruno"]);
    const tarea = await sembrarTarea({ parentId, childId: hijos[0]!.id });

    const response = await editar(cookies, tarea.id, { childId: hijos[1]!.id });

    expect(response.status).toBe(422);
    expect(response.body.code).toBe(ERROR_CODES.VALIDATION_ERROR);
  }, 180_000);

  it("editar una tarea ajena es 404, no 409", async () => {
    const { cookies } = await familiaOperando(app, ["Ana"]);

    const response = await editar(cookies, "no-existe", { coins: 10 });

    expect(response.status).toBe(404);
  }, 120_000);
});

describe("la fecha límite es informativa", () => {
  it("una tarea vencida se completa y se aprueba por su valor completo", async () => {
    const { cookies, parentId, hijos } = await familiaOperando(app, ["Ana"]);
    const ana = hijos[0]!;
    const tarea = await sembrarTarea(
      { parentId, childId: ana.id },
      { coins: 50, dueDate: new Date(Date.UTC(2020, 0, 1, 12, 0, 0)) },
    );

    await completar(ana.cookies, tarea.id).expect(200);
    const aprobada = await aprobar(cookies, tarea.id);

    expect(aprobada.status).toBe(200);
    expect(await saldoDe(ana.id)).toBe(50);
  }, 120_000);

  it("pasar la fecha no cambia el estado ni el valor por sí solo", async () => {
    const { cookies, parentId, hijos } = await familiaOperando(app, ["Ana"]);
    const tarea = await sembrarTarea(
      { parentId, childId: hijos[0]!.id },
      { coins: 50, dueDate: new Date(Date.UTC(2020, 0, 1, 12, 0, 0)) },
    );

    const detalle = await request(app)
      .get(`${API_PREFIX}/tasks/${tarea.id}`)
      .set("Cookie", cookies);

    expect(detalle.body).toMatchObject({ status: "PENDING", coins: 50 });
  }, 120_000);
});

describe("qué no sale en las respuestas", () => {
  it("ninguna transición filtra el padre dueño", async () => {
    const { cookies, parentId, hijos } = await familiaOperando(app, ["Ana", "Bruno"]);
    const ana = hijos[0]!;
    const tarea = await sembrarTarea({ parentId, childId: ana.id }, { coins: 50 });

    const marcada = await completar(ana.cookies, tarea.id).expect(200);
    const rechazada = await rechazar(cookies, tarea.id).expect(200);
    await completar(ana.cookies, tarea.id).expect(200);
    const aprobada = await aprobar(cookies, tarea.id).expect(200);

    for (const response of [marcada, rechazada, aprobada]) {
      const cuerpo = JSON.stringify(response.body);
      expect(cuerpo).not.toContain("parentId");
      expect(cuerpo).not.toContain(parentId);
      // Ni rastro del hermano en la tarea de Ana.
      expect(cuerpo).not.toContain(hijos[1]!.id);
    }
  }, 240_000);

  it("lo que ve el niño de su tarea no menciona el reparto", async () => {
    const { parentId, hijos } = await familiaOperando(app, ["Ana"]);
    const ana = hijos[0]!;
    const tarea = await sembrarTarea({ parentId, childId: ana.id });

    const response = await completar(ana.cookies, tarea.id);

    expect(Object.keys(response.body)).not.toContain("batchId");
    expect(Object.keys(response.body)).not.toContain("child");
  }, 120_000);
});
