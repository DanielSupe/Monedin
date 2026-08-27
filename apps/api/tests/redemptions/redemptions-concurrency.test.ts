import { API_PREFIX, ERROR_CODES } from "@monedin/contracts";
import request from "supertest";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../../src/app.js";
import { resetAuthData } from "../support/auth.js";
import { testPrisma } from "../support/database.js";
import { estadoDeCanje, movimientosDeCanje, sembrarCanje } from "../support/redemptions.js";
import { fijarSaldo, sembrarPremio } from "../support/rewards.js";
import { familiaOperando, saldoDe } from "../support/tasks.js";

/**
 * El doble toque, aplicado a los canjes.
 *
 * Mismo argumento que `tasks-concurrency.test.ts`: contra la app por HTTP, sin
 * `withRollback`, porque hacen falta transacciones de verdad compitiendo.
 */

const app = createApp();

beforeEach(async () => {
  await resetAuthData();
});

afterAll(async () => {
  await resetAuthData();
});

function aprobar(cookies: string[], redemptionId: string): request.Test {
  return request(app).post(`${API_PREFIX}/redemptions/${redemptionId}/approve`).set("Cookie", cookies);
}

function rechazar(cookies: string[], redemptionId: string): request.Test {
  return request(app).post(`${API_PREFIX}/redemptions/${redemptionId}/reject`).set("Cookie", cookies);
}

function codigos(responses: request.Response[]): number[] {
  return responses.map((response) => response.status).sort((a, b) => a - b);
}

describe("dos toques sobre aprobar el mismo canje", () => {
  it("uno descuenta, el otro da conflicto, y el saldo baja UNA vez", async () => {
    const { cookies, parentId, hijos } = await familiaOperando(app, ["Ana"]);
    const ana = hijos[0]!;
    await fijarSaldo(ana.id, 100);
    const premio = await sembrarPremio(parentId, { offers: [{ childId: ana.id, coins: 60 }] });
    const canje = await sembrarCanje({ childId: ana.id, rewardId: premio.id }, { coins: 60 });

    const respuestas = await Promise.all([aprobar(cookies, canje.id), aprobar(cookies, canje.id)]);

    expect(codigos(respuestas)).toEqual([200, 409]);
    expect(await saldoDe(ana.id)).toBe(40);
    expect(await movimientosDeCanje(canje.id)).toHaveLength(1);
  }, 180_000);

  it("el que pierde la carrera dice conflicto, no que el canje no existe", async () => {
    const { cookies, parentId, hijos } = await familiaOperando(app, ["Ana"]);
    const ana = hijos[0]!;
    await fijarSaldo(ana.id, 100);
    const premio = await sembrarPremio(parentId, { offers: [{ childId: ana.id, coins: 60 }] });
    const canje = await sembrarCanje({ childId: ana.id, rewardId: premio.id }, { coins: 60 });

    const respuestas = await Promise.all([aprobar(cookies, canje.id), aprobar(cookies, canje.id)]);

    const perdedora = respuestas.find((response) => response.status !== 200);
    expect(perdedora?.body.code).toBe(ERROR_CODES.CONFLICT);
  }, 180_000);
});

describe("aprobar y rechazar a la vez el mismo canje", () => {
  it("solo una gana, y el saldo lo refleja", async () => {
    const { cookies, parentId, hijos } = await familiaOperando(app, ["Ana"]);
    const ana = hijos[0]!;
    await fijarSaldo(ana.id, 100);
    const premio = await sembrarPremio(parentId, { offers: [{ childId: ana.id, coins: 60 }] });
    const canje = await sembrarCanje({ childId: ana.id, rewardId: premio.id }, { coins: 60 });

    const [aprobada, rechazada] = await Promise.all([
      aprobar(cookies, canje.id),
      rechazar(cookies, canje.id),
    ]);

    expect(codigos([aprobada, rechazada])).toEqual([200, 409]);

    const saldo = await saldoDe(ana.id);
    const historial = await movimientosDeCanje(canje.id);

    if (aprobada.status === 200) {
      expect(saldo).toBe(40);
      expect(historial).toHaveLength(1);
      expect(await estadoDeCanje(canje.id)).toBe("APPROVED");
    } else {
      // Ganó RECHAZAR, y en un canje eso es TERMINAL: `PENDING → REJECTED`, sin
      // devolver nada porque el descuento solo ocurre al aprobar.
      //
      // Decía `PENDING`, heredado de copiar el test equivalente de tareas, donde
      // sí es correcto porque ahí rechazar devuelve a `COMPLETED → PENDING` y la
      // tarea se puede reintentar. Las dos máquinas de estado no son la misma, y
      // este test solo fallaba cuando rechazar ganaba la carrera.
      expect(saldo).toBe(100);
      expect(historial).toHaveLength(0);
      expect(await estadoDeCanje(canje.id)).toBe("REJECTED");
    }
  }, 180_000);
});

describe("dos canjes del mismo hijo cuyo total excede su saldo", () => {
  it("uno gana, el otro da conflicto, y el perdedor SIGUE PENDING", async () => {
    const { cookies, parentId, hijos } = await familiaOperando(app, ["Ana"]);
    const ana = hijos[0]!;
    await fijarSaldo(ana.id, 100);
    const premio = await sembrarPremio(parentId, { offers: [{ childId: ana.id, coins: 60 }] });
    const canjeA = await sembrarCanje({ childId: ana.id, rewardId: premio.id }, { coins: 60 });
    const canjeB = await sembrarCanje({ childId: ana.id, rewardId: premio.id }, { coins: 60 });

    const respuestas = await Promise.all([aprobar(cookies, canjeA.id), aprobar(cookies, canjeB.id)]);

    expect(codigos(respuestas)).toEqual([200, 409]);

    const ganador = respuestas[0]?.status === 200 ? canjeA : canjeB;
    const perdedor = respuestas[0]?.status === 200 ? canjeB : canjeA;

    expect(await estadoDeCanje(ganador.id)).toBe("APPROVED");
    expect(await estadoDeCanje(perdedor.id)).toBe("PENDING");
    expect(await saldoDe(ana.id)).toBe(40);
    expect(await movimientosDeCanje(ganador.id)).toHaveLength(1);
    expect(await movimientosDeCanje(perdedor.id)).toHaveLength(0);
  }, 180_000);
});

describe("el hijo dado de baja entre solicitar y aprobar", () => {
  it("da el mismo conflicto genérico que el saldo insuficiente", async () => {
    const { cookies, parentId, hijos } = await familiaOperando(app, ["Ana"]);
    const ana = hijos[0]!;
    await fijarSaldo(ana.id, 100);
    const premio = await sembrarPremio(parentId, { offers: [{ childId: ana.id, coins: 60 }] });
    const canje = await sembrarCanje({ childId: ana.id, rewardId: premio.id }, { coins: 60 });

    await request(app)
      .delete(`${API_PREFIX}/children/${ana.id}`)
      .set("Cookie", cookies)
      .expect(204);

    const response = await aprobar(cookies, canje.id);

    expect(response.status).toBe(409);
    expect(response.body.code).toBe(ERROR_CODES.CONFLICT);

    // La transición se deshizo con la transacción: ni canje aprobado sin
    // monedas, ni monedas sin canje aprobado.
    expect(await estadoDeCanje(canje.id)).toBe("PENDING");
    expect(await movimientosDeCanje(canje.id)).toHaveLength(0);
  }, 180_000);
});

describe("el saldo cuadra con su historia", () => {
  it("con varios canjes del mismo hijo aprobados a la vez, y órdenes repetidas", async () => {
    const { cookies, parentId, hijos } = await familiaOperando(app, ["Ana"]);
    const ana = hijos[0]!;
    await fijarSaldo(ana.id, 1000);
    const premio = await sembrarPremio(parentId, { offers: [{ childId: ana.id, coins: 10 }] });

    const valores = [10, 20, 30, 40];
    const canjes = [];
    for (const coins of valores) {
      canjes.push(await sembrarCanje({ childId: ana.id, rewardId: premio.id }, { coins }));
    }

    await Promise.all(
      canjes.flatMap((canje) => [aprobar(cookies, canje.id), aprobar(cookies, canje.id)]),
    );

    const historial = await testPrisma().coinTransaction.findMany({
      where: { childId: ana.id },
      select: { amount: true, redemptionId: true },
    });

    const suma = historial.reduce((total, fila) => total + fila.amount, 0);
    expect(await saldoDe(ana.id)).toBe(1000 + suma);
    expect(suma).toBe(-valores.reduce((total, valor) => total + valor, 0));

    for (const canje of canjes) {
      expect(await movimientosDeCanje(canje.id)).toHaveLength(1);
    }
  }, 300_000);
});
