import { describe, expect, it } from "vitest";
import { createChild, createParent, withRollback } from "../support/database.js";

/**
 * El historial de monedas es de solo escritura.
 *
 * Lo garantiza un disparador instalado por la migración, no la disciplina del
 * código: aquí se intenta modificarlo y borrarlo por la vía directa. Ver la spec
 * `coin-ledger`, requisito "El historial es inmutable".
 */
describe("inmutabilidad del historial de monedas", () => {
  it("rechaza modificar una entrada ya escrita", () =>
    withRollback(async (db) => {
      const padre = await createParent(db);
      const hijo = await createChild(db, padre.id, { coins: 10 });
      const movimiento = await db.coinTransaction.create({
        data: { childId: hijo.id, amount: 10, balanceAfter: 10, reason: "TASK_APPROVED" },
      });

      await expect(
        db.coinTransaction.update({ where: { id: movimiento.id }, data: { amount: 9999 } }),
      ).rejects.toThrow();
    }));

  it("rechaza borrar una entrada", () =>
    withRollback(async (db) => {
      const padre = await createParent(db);
      const hijo = await createChild(db, padre.id, { coins: 10 });
      const movimiento = await db.coinTransaction.create({
        data: { childId: hijo.id, amount: 10, balanceAfter: 10, reason: "TASK_APPROVED" },
      });

      await expect(
        db.coinTransaction.delete({ where: { id: movimiento.id } }),
      ).rejects.toThrow();
    }));

  it("rechaza también un borrado masivo", () =>
    withRollback(async (db) => {
      const padre = await createParent(db);
      const hijo = await createChild(db, padre.id, { coins: 10 });
      await db.coinTransaction.create({
        data: { childId: hijo.id, amount: 10, balanceAfter: 10, reason: "TASK_APPROVED" },
      });

      await expect(
        db.coinTransaction.deleteMany({ where: { childId: hijo.id } }),
      ).rejects.toThrow();
    }));

  it("corregir un movimiento se hace añadiendo otro que lo compensa", () =>
    withRollback(async (db) => {
      const padre = await createParent(db);
      const hijo = await createChild(db, padre.id, { coins: 100 });

      await db.coinTransaction.create({
        data: { childId: hijo.id, amount: 100, balanceAfter: 100, reason: "TASK_APPROVED" },
      });
      await db.coinTransaction.create({
        data: { childId: hijo.id, amount: -100, balanceAfter: 0, reason: "MANUAL_ADJUSTMENT" },
      });

      const movimientos = await db.coinTransaction.findMany({
        where: { childId: hijo.id },
        orderBy: { createdAt: "asc" },
      });

      // Los dos siguen visibles: el error y su corrección.
      expect(movimientos).toHaveLength(2);
      expect(movimientos.map((m) => m.amount)).toEqual([100, -100]);
    }));

  it("rechaza borrar un hijo que tiene historial", () =>
    withRollback(async (db) => {
      const padre = await createParent(db);
      const hijo = await createChild(db, padre.id, { coins: 10 });
      await db.coinTransaction.create({
        data: { childId: hijo.id, amount: 10, balanceAfter: 10, reason: "TASK_APPROVED" },
      });

      await expect(db.childProfile.delete({ where: { id: hijo.id } })).rejects.toThrow();
    }));

  it("conserva el historial de un hijo dado de baja", () =>
    withRollback(async (db) => {
      const padre = await createParent(db);
      const hijo = await createChild(db, padre.id, { coins: 10 });
      await db.coinTransaction.create({
        data: { childId: hijo.id, amount: 10, balanceAfter: 10, reason: "TASK_APPROVED" },
      });

      await db.childProfile.update({
        where: { id: hijo.id },
        data: { deletedAt: new Date() },
      });

      // Fuera de los listados activos...
      const activos = await db.childProfile.findMany({
        where: { parentId: padre.id, deletedAt: null },
      });
      expect(activos).toHaveLength(0);

      // ...pero su historial sigue íntegro.
      const historial = await db.coinTransaction.findMany({ where: { childId: hijo.id } });
      expect(historial).toHaveLength(1);
      expect(historial[0]?.amount).toBe(10);
    }));

  it("un premio retirado conserva sus canjes", () =>
    withRollback(async (db) => {
      const padre = await createParent(db);
      const hijo = await createChild(db, padre.id, { coins: 100 });
      const premio = await db.reward.create({ data: { title: "Ir al cine", parentId: padre.id } });
      await db.rewardRedemption.create({
        data: { rewardId: premio.id, childId: hijo.id, coins: 50, status: "APPROVED" },
      });

      await db.reward.update({ where: { id: premio.id }, data: { isActive: false } });

      const activos = await db.reward.findMany({ where: { parentId: padre.id, isActive: true } });
      expect(activos).toHaveLength(0);

      const canjes = await db.rewardRedemption.findMany({ where: { rewardId: premio.id } });
      expect(canjes).toHaveLength(1);
    }));
});
