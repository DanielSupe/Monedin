import { API_PREFIX, ERROR_CODES } from "@monedin/contracts";
import request from "supertest";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../../src/app.js";
import { resetAuthData } from "../support/auth.js";
import { testPrisma } from "../support/database.js";
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

function codigos(responses: request.Response[]): number[] {
  return responses.map((response) => response.status).sort((a, b) => a - b);
}

describe("dos toques sobre aprobar", () => {
  it("uno acredita, el otro da conflicto, y el saldo sube UNA vez", async () => {
    const { cookies, parentId, hijos } = await familiaOperando(app, ["Ana"]);
    const ana = hijos[0]!;
    const tarea = await sembrarTarea(
      { parentId, childId: ana.id },
      { coins: 50, status: "COMPLETED" },
    );

    const respuestas = await Promise.all([
      aprobar(cookies, tarea.id),
      aprobar(cookies, tarea.id),
    ]);

    expect(codigos(respuestas)).toEqual([200, 409]);
    expect(await saldoDe(ana.id)).toBe(50);

    expect(await movimientosDe(tarea.id)).toHaveLength(1);
  }, 180_000);

  it("el que pierde la carrera dice conflicto, no que la tarea no existe", async () => {
    const { cookies, parentId, hijos } = await familiaOperando(app, ["Ana"]);
    const tarea = await sembrarTarea(
      { parentId, childId: hijos[0]!.id },
      { coins: 50, status: "COMPLETED" },
    );

    const respuestas = await Promise.all([
      aprobar(cookies, tarea.id),
      aprobar(cookies, tarea.id),
    ]);

    const perdedora = respuestas.find((response) => response.status !== 200);
    expect(perdedora?.body.code).toBe(ERROR_CODES.CONFLICT);
  }, 180_000);

  it("tres toques a la vez tampoco acreditan de más", async () => {
    const { cookies, parentId, hijos } = await familiaOperando(app, ["Ana"]);
    const ana = hijos[0]!;
    const tarea = await sembrarTarea(
      { parentId, childId: ana.id },
      { coins: 40, status: "COMPLETED" },
    );

    const respuestas = await Promise.all([
      aprobar(cookies, tarea.id),
      aprobar(cookies, tarea.id),
      aprobar(cookies, tarea.id),
    ]);

    expect(codigos(respuestas)).toEqual([200, 409, 409]);
    expect(await saldoDe(ana.id)).toBe(40);
    expect(await movimientosDe(tarea.id)).toHaveLength(1);
  }, 180_000);

  it("un rechazo por conflicto no deja rastro en el historial", async () => {
    const { cookies, parentId, hijos } = await familiaOperando(app, ["Ana"]);
    const ana = hijos[0]!;
    const tarea = await sembrarTarea({ parentId, childId: ana.id }, { coins: 50 });

    await aprobar(cookies, tarea.id).expect(409);

    expect(await saldoDe(ana.id)).toBe(0);
    expect(await testPrisma().coinTransaction.count({ where: { childId: ana.id } })).toBe(0);
  }, 120_000);
});

describe("dos toques sobre las transiciones que no mueven monedas", () => {
  it("marcar dos veces a la vez: una tiene efecto y la otra da conflicto", async () => {
    const { parentId, hijos } = await familiaOperando(app, ["Ana"]);
    const ana = hijos[0]!;
    const tarea = await sembrarTarea({ parentId, childId: ana.id });

    const respuestas = await Promise.all([
      completar(ana.cookies, tarea.id),
      completar(ana.cookies, tarea.id),
    ]);

    expect(codigos(respuestas)).toEqual([200, 409]);
    expect(await estadoDe(tarea.id)).toBe("COMPLETED");
    expect(await saldoDe(ana.id)).toBe(0);
  }, 180_000);

  it("rechazar dos veces a la vez: una tiene efecto y la otra da conflicto", async () => {
    const { cookies, parentId, hijos } = await familiaOperando(app, ["Ana"]);
    const tarea = await sembrarTarea(
      { parentId, childId: hijos[0]!.id },
      { status: "COMPLETED" },
    );

    const respuestas = await Promise.all([
      rechazar(cookies, tarea.id),
      rechazar(cookies, tarea.id),
    ]);

    expect(codigos(respuestas)).toEqual([200, 409]);
    expect(await estadoDe(tarea.id)).toBe("PENDING");
  }, 180_000);

  it("aprobar y rechazar a la vez: solo una gana, y el saldo lo refleja", async () => {
    const { cookies, parentId, hijos } = await familiaOperando(app, ["Ana"]);
    const ana = hijos[0]!;
    const tarea = await sembrarTarea(
      { parentId, childId: ana.id },
      { coins: 50, status: "COMPLETED" },
    );

    const [aprobada, rechazada] = await Promise.all([
      aprobar(cookies, tarea.id),
      rechazar(cookies, tarea.id),
    ]);

    expect(codigos([aprobada, rechazada])).toEqual([200, 409]);

    const saldo = await saldoDe(ana.id);
    const historial = await movimientosDe(tarea.id);

    if (aprobada.status === 200) {
      expect(saldo).toBe(50);
      expect(historial).toHaveLength(1);
      expect(await estadoDe(tarea.id)).toBe("APPROVED");
    } else {
      expect(saldo).toBe(0);
      expect(historial).toHaveLength(0);
      expect(await estadoDe(tarea.id)).toBe("PENDING");
    }
  }, 180_000);
});

describe("la acreditación y la tarea van juntas o no van", () => {
  it("si la acreditación no puede completarse, la tarea sigue sin aprobar", async () => {
    const { cookies, parentId, hijos } = await familiaOperando(app, ["Ana"]);
    const ana = hijos[0]!;
    const tarea = await sembrarTarea(
      { parentId, childId: ana.id },
      { coins: 50, status: "COMPLETED" },
    );

    await request(app)
      .delete(`${API_PREFIX}/children/${ana.id}`)
      .set("Cookie", cookies)
      .expect(204);

    const response = await aprobar(cookies, tarea.id);

    expect(response.status).toBe(409);

    expect(await estadoDe(tarea.id)).toBe("COMPLETED");
    expect(await saldoDe(ana.id)).toBe(0);
    expect(await movimientosDe(tarea.id)).toHaveLength(0);
  }, 180_000);
});

describe("el saldo cuadra con su historia", () => {
  it("con varias tareas del mismo hijo aprobadas a la vez, y órdenes repetidas", async () => {
    const { cookies, parentId, hijos } = await familiaOperando(app, ["Ana"]);
    const ana = hijos[0]!;

    const valores = [10, 20, 30, 40];
    const tareas = [];
    for (const coins of valores) {
      tareas.push(await sembrarTarea({ parentId, childId: ana.id }, { coins, status: "COMPLETED" }));
    }

    await Promise.all(tareas.flatMap((tarea) => [aprobar(cookies, tarea.id), aprobar(cookies, tarea.id)]));

    const historial = await testPrisma().coinTransaction.findMany({
      where: { childId: ana.id },
      select: { amount: true, taskId: true },
    });

    const suma = historial.reduce((total, fila) => total + fila.amount, 0);
    expect(await saldoDe(ana.id)).toBe(suma);
    expect(suma).toBe(valores.reduce((total, valor) => total + valor, 0));

    for (const tarea of tareas) {
      expect(await movimientosDe(tarea.id)).toHaveLength(1);
    }
  }, 300_000);
});
