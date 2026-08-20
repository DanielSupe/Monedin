import { ERROR_CODES } from "@monedin/contracts";
import { describe, expect, it } from "vitest";
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from "../../src/shared/errors/domain-errors.js";
import { translateDatabaseError } from "../../src/shared/database/translate-error.js";
import { createChild, createParent, withRollback } from "../support/database.js";

/**
 * Traducción de fallos del motor a errores de dominio.
 *
 * Los errores se provocan CONTRA LA BASE DE DATOS DE VERDAD, no se fabrican a
 * mano: lo que se comprueba es que la traducción sigue reconociendo la forma que
 * Prisma produce realmente, que es lo que cambiaría al subir de versión.
 */

/** Provoca una operación y devuelve el error ya traducido. */
async function traducir(operacion: () => Promise<unknown>): Promise<unknown> {
  try {
    await operacion();
  } catch (error) {
    return translateDatabaseError(error);
  }
  throw new Error("La operación no falló, y este test necesita que falle");
}

describe("traducción de errores de la base de datos", () => {
  it("una violación de unicidad es un conflicto", () =>
    withRollback(async (db) => {
      const padre = await createParent(db);

      const error = await traducir(() => createParent(db, { email: padre.email }));

      expect(error).toBeInstanceOf(ConflictError);
      expect((error as ConflictError).code).toBe(ERROR_CODES.CONFLICT);
    }));

  it("una referencia a algo que no existe es un no encontrado", () =>
    withRollback(async (db) => {
      const error = await traducir(() =>
        db.childProfile.create({
          data: { name: "Ana", pinHash: "h", parentId: "id-que-no-existe" },
        }),
      );

      expect(error).toBeInstanceOf(NotFoundError);
      expect((error as NotFoundError).code).toBe(ERROR_CODES.NOT_FOUND);
    }));

  it("operar sobre una fila inexistente es un no encontrado", () =>
    withRollback(async (db) => {
      const error = await traducir(() =>
        db.user.update({ where: { id: "id-que-no-existe" }, data: { name: "X" } }),
      );

      expect(error).toBeInstanceOf(NotFoundError);
    }));

  it("una restricción de rango es entrada inválida", () =>
    withRollback(async (db) => {
      const padre = await createParent(db);

      const error = await traducir(() => createChild(db, padre.id, { age: 99 }));

      expect(error).toBeInstanceOf(ValidationError);
      expect((error as ValidationError).code).toBe(ERROR_CODES.VALIDATION_ERROR);
    }));

  it("un saldo negativo es entrada inválida", () =>
    withRollback(async (db) => {
      const padre = await createParent(db);

      const error = await traducir(() =>
        db.childProfile.create({
          data: { name: "Ana", pinHash: "h", coins: -1, parentId: padre.id },
        }),
      );

      expect(error).toBeInstanceOf(ValidationError);
    }));

  it("tocar el historial inmutable es un conflicto", () =>
    withRollback(async (db) => {
      const padre = await createParent(db);
      const hijo = await createChild(db, padre.id, { coins: 10 });
      const movimiento = await db.coinTransaction.create({
        data: { childId: hijo.id, amount: 10, balanceAfter: 10, reason: "TASK_APPROVED" },
      });

      const error = await traducir(() =>
        db.coinTransaction.update({ where: { id: movimiento.id }, data: { amount: 1 } }),
      );

      expect(error).toBeInstanceOf(ConflictError);
    }));

  it("borrar algo de lo que otras filas dependen es un conflicto, no un 404", () =>
    withRollback(async (db) => {
      const padre = await createParent(db);
      const hijo = await createChild(db, padre.id, { coins: 10 });
      await db.coinTransaction.create({
        data: { childId: hijo.id, amount: 10, balanceAfter: 10, reason: "TASK_APPROVED" },
      });

      const error = await traducir(() => db.childProfile.delete({ where: { id: hijo.id } }));

      expect(error).toBeInstanceOf(ConflictError);
    }));

  it("un error que no reconoce lo devuelve intacto para que salga como 500", () => {
    const desconocido = new Error("algo raro de la infraestructura");

    expect(translateDatabaseError(desconocido)).toBe(desconocido);
  });
});

describe("los errores traducidos no filtran detalles internos", () => {
  const prohibido = [
    "child_profiles",
    "coin_transactions",
    "users",
    "constraint",
    "Failing row contains",
    "violates",
    "SELECT",
    "INSERT",
    "prisma",
  ];

  function revisar(error: unknown): void {
    const expuesto = JSON.stringify({
      message: (error as Error).message,
      code: (error as { code?: string }).code,
    });

    for (const fragmento of prohibido) {
      expect(
        expuesto.toLowerCase(),
        `el error traducido filtra "${fragmento}": ${expuesto}`,
      ).not.toContain(fragmento.toLowerCase());
    }
  }

  it("ni en una violación de unicidad", () =>
    withRollback(async (db) => {
      const padre = await createParent(db);
      revisar(await traducir(() => createParent(db, { email: padre.email })));
    }));

  it("ni en una restricción de rango, que incluye la fila que falló", () =>
    withRollback(async (db) => {
      const padre = await createParent(db);
      revisar(await traducir(() => createChild(db, padre.id, { age: 99 })));
    }));

  it("ni en una violación de clave ajena, que incluye el nombre de la restricción", () =>
    withRollback(async (db) => {
      revisar(
        await traducir(() =>
          db.childProfile.create({
            data: { name: "Ana", pinHash: "h", parentId: "id-que-no-existe" },
          }),
        ),
      );
    }));
});
