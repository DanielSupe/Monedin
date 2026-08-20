import { describe, expect, it } from "vitest";
import { createChild, createParent, withRollback } from "../support/database.js";

/**
 * Las restricciones viven en el motor, no solo en el código.
 *
 * Estos tests escriben directamente contra la base de datos, saltándose
 * cualquier validación de entrada: es la única forma de comprobar que un dato
 * imposible es imposible de almacenar y no solo difícil de escribir por
 * accidente. Ver la spec `family-data-model` y la decisión 3 del design.
 */
describe("restricciones de rango del motor", () => {
  it("rechaza un saldo negativo", () =>
    withRollback(async (db) => {
      const padre = await createParent(db);

      await expect(
        db.childProfile.create({
          data: { name: "Ana", pinHash: "h", coins: -1, parentId: padre.id },
        }),
      ).rejects.toThrow();
    }));

  it("acepta un saldo de cero", () =>
    withRollback(async (db) => {
      const padre = await createParent(db);
      const hijo = await createChild(db, padre.id, { coins: 0 });

      expect(hijo.coins).toBe(0);
    }));

  it("da saldo cero a un hijo recién creado", () =>
    withRollback(async (db) => {
      const padre = await createParent(db);
      const hijo = await createChild(db, padre.id);

      expect(hijo.coins).toBe(0);
    }));

  it("rechaza una edad por debajo del rango del producto", () =>
    withRollback(async (db) => {
      const padre = await createParent(db);

      await expect(createChild(db, padre.id, { age: 5 })).rejects.toThrow();
    }));

  it("rechaza una edad por encima del rango del producto", () =>
    withRollback(async (db) => {
      const padre = await createParent(db);

      await expect(createChild(db, padre.id, { age: 12 })).rejects.toThrow();
    }));

  it("acepta los extremos del rango de edad y la ausencia de edad", () =>
    withRollback(async (db) => {
      const padre = await createParent(db);

      await expect(createChild(db, padre.id, { age: 6 })).resolves.toBeTruthy();
      await expect(createChild(db, padre.id, { age: 11 })).resolves.toBeTruthy();
      await expect(createChild(db, padre.id)).resolves.toBeTruthy();
    }));

  it("rechaza una tarea de cero monedas", () =>
    withRollback(async (db) => {
      const padre = await createParent(db);
      const hijo = await createChild(db, padre.id);

      await expect(
        db.task.create({
          data: { title: "Ordenar el cuarto", coins: 0, childId: hijo.id, parentId: padre.id },
        }),
      ).rejects.toThrow();
    }));

  it("rechaza una tarea por encima del máximo de monedas", () =>
    withRollback(async (db) => {
      const padre = await createParent(db);
      const hijo = await createChild(db, padre.id);

      await expect(
        db.task.create({
          data: { title: "Ordenar el cuarto", coins: 10_000, childId: hijo.id, parentId: padre.id },
        }),
      ).rejects.toThrow();
    }));

  it("rechaza un precio de premio por encima del máximo", () =>
    withRollback(async (db) => {
      const padre = await createParent(db);
      const hijo = await createChild(db, padre.id);
      const premio = await db.reward.create({
        data: { title: "Ir al cine", parentId: padre.id },
      });

      await expect(
        db.rewardAssignment.create({
          data: { rewardId: premio.id, childId: hijo.id, coins: 10_000 },
        }),
      ).rejects.toThrow();
    }));

  it("rechaza un movimiento de cero monedas", () =>
    withRollback(async (db) => {
      const padre = await createParent(db);
      const hijo = await createChild(db, padre.id);

      await expect(
        db.coinTransaction.create({
          data: { childId: hijo.id, amount: 0, balanceAfter: 0, reason: "MANUAL_ADJUSTMENT" },
        }),
      ).rejects.toThrow();
    }));
});

describe("reglas de pertenencia", () => {
  it("rechaza un hijo sin padre existente", () =>
    withRollback(async (db) => {
      await expect(
        db.childProfile.create({
          data: { name: "Ana", pinHash: "h", parentId: "id-que-no-existe" },
        }),
      ).rejects.toThrow();
    }));

  it("rechaza dos padres con el mismo correo", () =>
    withRollback(async (db) => {
      const padre = await createParent(db);

      await expect(createParent(db, { email: padre.email })).rejects.toThrow();
    }));

  it("permite que un padre tenga varios hijos con saldos independientes", () =>
    withRollback(async (db) => {
      const padre = await createParent(db);
      const mayor = await createChild(db, padre.id, { name: "Mayor", coins: 100 });
      const menor = await createChild(db, padre.id, { name: "Menor", coins: 30 });

      expect(mayor.coins).toBe(100);
      expect(menor.coins).toBe(30);
      expect(await db.childProfile.count({ where: { parentId: padre.id } })).toBe(2);
    }));

  it("rechaza asignar el mismo premio al mismo hijo dos veces", () =>
    withRollback(async (db) => {
      const padre = await createParent(db);
      const hijo = await createChild(db, padre.id);
      const premio = await db.reward.create({ data: { title: "Ir al cine", parentId: padre.id } });

      await db.rewardAssignment.create({
        data: { rewardId: premio.id, childId: hijo.id, coins: 50 },
      });

      await expect(
        db.rewardAssignment.create({
          data: { rewardId: premio.id, childId: hijo.id, coins: 30 },
        }),
      ).rejects.toThrow();
    }));

  it("permite que el mismo premio cueste distinto a cada hijo", () =>
    withRollback(async (db) => {
      const padre = await createParent(db);
      const mayor = await createChild(db, padre.id, { name: "Mayor" });
      const menor = await createChild(db, padre.id, { name: "Menor" });
      const premio = await db.reward.create({ data: { title: "Ir al cine", parentId: padre.id } });

      await db.rewardAssignment.create({
        data: { rewardId: premio.id, childId: mayor.id, coins: 50 },
      });
      await db.rewardAssignment.create({
        data: { rewardId: premio.id, childId: menor.id, coins: 30 },
      });

      const asignaciones = await db.rewardAssignment.findMany({
        where: { rewardId: premio.id },
        orderBy: { coins: "desc" },
      });

      expect(asignaciones.map((a) => a.coins)).toEqual([50, 30]);
    }));
});

describe("estados de tarea", () => {
  it("no contempla un estado terminal de rechazo", () =>
    withRollback(async (db) => {
      const padre = await createParent(db);
      const hijo = await createChild(db, padre.id);
      const tarea = await db.task.create({
        data: { title: "Ordenar el cuarto", coins: 50, childId: hijo.id, parentId: padre.id },
      });

      expect(tarea.status).toBe("PENDING");

      // Rechazar devuelve a PENDING; no existe ningún valor de rechazo.
      await db.task.update({ where: { id: tarea.id }, data: { status: "COMPLETED" } });
      const devuelta = await db.task.update({
        where: { id: tarea.id },
        data: { status: "PENDING" },
      });

      expect(devuelta.status).toBe("PENDING");
    }));

  it("el enum de estados de tarea solo tiene los tres del flujo", () =>
    withRollback(async (db) => {
      const valores = await db.$queryRawUnsafe<Array<{ enumlabel: string }>>(
        `SELECT enumlabel FROM pg_enum
         JOIN pg_type ON pg_type.oid = pg_enum.enumtypid
         WHERE pg_type.typname = 'TaskStatus' ORDER BY enumsortorder`,
      );

      expect(valores.map((v) => v.enumlabel)).toEqual(["PENDING", "COMPLETED", "APPROVED"]);
    }));
});
