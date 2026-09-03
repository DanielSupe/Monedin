import { API_PREFIX, ERROR_CODES, MAX_PAGE_SIZE } from "@monedin/contracts";
import request from "supertest";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../../src/app.js";
import { resetAuthData } from "../support/auth.js";
import { testPrisma } from "../support/database.js";
import { familiaOperando } from "../support/tasks.js";

const app = createApp();

beforeEach(async () => {
  await resetAuthData();
});

afterAll(async () => {
  await resetAuthData();
});

/**
 * Siembra movimientos directamente en la tabla.
 *
 * Se salta la API a propósito: lo que se prueba aquí es LEER el historial, y
 * llegar a un historial concreto aprobando tareas y canjes de verdad haría el
 * test ilegible. Que escribirlo funcione ya lo prueban `tasks` y `redemptions`.
 */
async function sembrarMovimientos(
  childId: string,
  movimientos: Array<{ amount: number; balanceAfter: number; createdAt?: Date }>,
): Promise<void> {
  for (const movimiento of movimientos) {
    await testPrisma().coinTransaction.create({
      data: {
        childId,
        amount: movimiento.amount,
        balanceAfter: movimiento.balanceAfter,
        reason: movimiento.amount > 0 ? "TASK_APPROVED" : "REDEMPTION_APPROVED",
        ...(movimiento.createdAt === undefined ? {} : { createdAt: movimiento.createdAt }),
      },
    });
  }
}

describe("un niño lee su propio historial", () => {
  it("lo devuelve del más reciente al más antiguo, con su saldo resultante", async () => {
    const familia = await familiaOperando(app, ["Mateo"]);
    const mateo = familia.hijos[0]!;

    await sembrarMovimientos(mateo.id, [
      { amount: 20, balanceAfter: 20, createdAt: new Date("2026-09-01T10:00:00Z") },
      { amount: 30, balanceAfter: 50, createdAt: new Date("2026-09-01T11:00:00Z") },
      { amount: -40, balanceAfter: 10, createdAt: new Date("2026-09-01T12:00:00Z") },
    ]);

    const response = await request(app)
      .get(`${API_PREFIX}/children/me/coins`)
      .set("Cookie", mateo.cookies);

    expect(response.status).toBe(200);
    expect(response.body.items).toHaveLength(3);

    // Del más reciente al más antiguo.
    expect(response.body.items.map((m: { amount: number }) => m.amount)).toEqual([-40, 30, 20]);

    // El saldo viene GUARDADO en cada fila, no calculado por nadie.
    expect(response.body.items[1]).toMatchObject({ amount: 30, balanceAfter: 50 });
  }, 60_000);

  it("un historial vacío es una lista vacía, no un error", async () => {
    const familia = await familiaOperando(app, ["Mateo"]);

    const response = await request(app)
      .get(`${API_PREFIX}/children/me/coins`)
      .set("Cookie", familia.hijos[0]!.cookies);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ items: [], total: 0, totalPages: 1 });
  }, 60_000);
});

/**
 * Lo que más importa aquí, y más que en otros listados.
 *
 * Los hermanos comparten la tablet, y un historial es el registro más detallado
 * que existe de lo que otro niño ha hecho y ha gastado.
 */
describe("cada quien lee solo el historial que le corresponde", () => {
  it("un niño no puede pedir el de su hermano: no hay parámetro que lo permita", async () => {
    const familia = await familiaOperando(app, ["Mateo", "Emma"]);
    const [mateo, emma] = familia.hijos;

    await sembrarMovimientos(emma!.id, [{ amount: 99, balanceAfter: 99 }]);

    // Su ruta no admite identificador, y su query es `.strict()`: mandarlo es
    // 422. Ahí está la garantía, no en una comprobación que se pueda olvidar.
    const response = await request(app)
      .get(`${API_PREFIX}/children/me/coins?childId=${emma!.id}`)
      .set("Cookie", mateo!.cookies);

    expect(response.status).toBe(422);
    expect(response.body.code).toBe(ERROR_CODES.VALIDATION_ERROR);
  }, 60_000);

  it("y por la ruta del padre tampoco: no es su rol", async () => {
    const familia = await familiaOperando(app, ["Mateo", "Emma"]);
    const [mateo, emma] = familia.hijos;

    const response = await request(app)
      .get(`${API_PREFIX}/children/${emma!.id}/coins`)
      .set("Cookie", mateo!.cookies);

    expect(response.status).toBe(403);
  }, 60_000);

  it("un padre lee el de su hijo", async () => {
    const familia = await familiaOperando(app, ["Mateo"]);
    const mateo = familia.hijos[0]!;

    await sembrarMovimientos(mateo.id, [{ amount: 20, balanceAfter: 20 }]);

    const response = await request(app)
      .get(`${API_PREFIX}/children/${mateo.id}/coins`)
      .set("Cookie", familia.cookies);

    expect(response.status).toBe(200);
    expect(response.body.items).toHaveLength(1);
  }, 60_000);

  it("un padre y un hijo AJENO: 404 y no 403, para no confirmar que existe", async () => {
    const nuestra = await familiaOperando(app, ["Mateo"]);
    const otra = await familiaOperando(app, ["Ajeno"], { email: "otra@ejemplo.dev" });

    const response = await request(app)
      .get(`${API_PREFIX}/children/${otra.hijos[0]!.id}/coins`)
      .set("Cookie", nuestra.cookies);

    expect(response.status).toBe(404);
    expect(response.body.code).toBe(ERROR_CODES.NOT_FOUND);
  }, 90_000);
});

describe("el historial pagina como el resto de los listados", () => {
  it("un pageSize por encima del máximo es 422, no un recorte silencioso", async () => {
    const familia = await familiaOperando(app, ["Mateo"]);

    const response = await request(app)
      .get(`${API_PREFIX}/children/me/coins?pageSize=${MAX_PAGE_SIZE + 1}`)
      .set("Cookie", familia.hijos[0]!.cookies);

    expect(response.status).toBe(422);
  }, 60_000);

  it("una página posterior a la última da lista vacía, no 404", async () => {
    const familia = await familiaOperando(app, ["Mateo"]);
    const mateo = familia.hijos[0]!;

    await sembrarMovimientos(mateo.id, [{ amount: 20, balanceAfter: 20 }]);

    const response = await request(app)
      .get(`${API_PREFIX}/children/me/coins?page=5`)
      .set("Cookie", mateo.cookies);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ items: [], total: 1, page: 5 });
  }, 60_000);

  /*
   * El desempate por identificador NO es teórico aquí: aprobar un reparto
   * escribe varias filas dentro de la misma transacción, así que comparten
   * `createdAt`. Sin desempate, dos de ellas pueden salir en dos páginas o en
   * ninguna — el bug clásico de la paginación por desplazamiento.
   */
  it("movimientos del MISMO instante no se repiten ni se pierden entre páginas", async () => {
    const familia = await familiaOperando(app, ["Mateo"]);
    const mateo = familia.hijos[0]!;
    const mismoInstante = new Date("2026-09-01T10:00:00Z");

    await sembrarMovimientos(
      mateo.id,
      [10, 20, 30, 40].map((amount) => ({ amount, balanceAfter: amount, createdAt: mismoInstante })),
    );

    const pedir = (page: number): request.Test =>
      request(app)
        .get(`${API_PREFIX}/children/me/coins?page=${page}&pageSize=2`)
        .set("Cookie", mateo.cookies);

    const primera = await pedir(1);
    const segunda = await pedir(2);

    const ids = [
      ...primera.body.items.map((m: { id: string }) => m.id),
      ...segunda.body.items.map((m: { id: string }) => m.id),
    ];

    // Las cuatro, cada una una sola vez.
    expect(ids).toHaveLength(4);
    expect(new Set(ids).size).toBe(4);
  }, 60_000);
});

/**
 * `balanceAfter` se guarda redundante desde `add-data-model` con una razón
 * escrita: «convierte auditar el saldo en una comparación, no en una
 * agregación». Este test comprueba que se devuelve TAL CUAL y no recalculado.
 */
describe("el saldo de cada fila es el que la fila guardó", () => {
  it("aunque no cuadre con la suma de los importes", async () => {
    const familia = await familiaOperando(app, ["Mateo"]);
    const mateo = familia.hijos[0]!;

    /*
     * Un saldo deliberadamente INCOHERENTE con la suma: si alguien sustituyera
     * `balanceAfter` por un acumulado, este test daría 30 en vez de 500. Con
     * datos coherentes las dos respuestas coincidirían y el test no probaría
     * nada.
     */
    await sembrarMovimientos(mateo.id, [
      { amount: 10, balanceAfter: 500, createdAt: new Date("2026-09-01T10:00:00Z") },
      { amount: 20, balanceAfter: 777, createdAt: new Date("2026-09-01T11:00:00Z") },
    ]);

    const response = await request(app)
      .get(`${API_PREFIX}/children/me/coins`)
      .set("Cookie", mateo.cookies);

    expect(response.body.items.map((m: { balanceAfter: number }) => m.balanceAfter)).toEqual([
      777, 500,
    ]);
  }, 60_000);
});
