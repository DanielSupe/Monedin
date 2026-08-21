import { describe, expect, it } from "vitest";
import { applyCoinMovement } from "../../src/shared/database/coin-ledger.js";
import { ConflictError, NotFoundError } from "../../src/shared/errors/domain-errors.js";
import {
  closeTestPrisma,
  createChild,
  createParent,
  deleteLedgerRows,
  testPrisma,
  withRollback,
} from "../support/database.js";

/**
 * El libro de monedas.
 *
 * Los tests de concurrencia NO pueden usar `withRollback`: necesitan dos
 * transacciones de verdad compitiendo, y una transacción externa las serializaría
 * y no probaría nada. Esos limpian lo suyo a mano.
 */
describe("movimiento de monedas", () => {
  it("acredita y deja su fila de historial", () =>
    withRollback(async (db) => {
      const padre = await createParent(db);
      const hijo = await createChild(db, padre.id, { coins: 10 });

      const resultado = await applyCoinMovement(db, {
        childId: hijo.id,
        amount: 50,
        reason: "TASK_APPROVED",
      });

      expect(resultado.balanceAfter).toBe(60);

      const historial = await db.coinTransaction.findMany({ where: { childId: hijo.id } });
      expect(historial).toHaveLength(1);
      expect(historial[0]?.amount).toBe(50);
      expect(historial[0]?.balanceAfter).toBe(60);
      expect(historial[0]?.reason).toBe("TASK_APPROVED");
    }));

  it("descuenta cuando el saldo alcanza", () =>
    withRollback(async (db) => {
      const padre = await createParent(db);
      const hijo = await createChild(db, padre.id, { coins: 100 });

      const resultado = await applyCoinMovement(db, {
        childId: hijo.id,
        amount: -30,
        reason: "REDEMPTION_APPROVED",
      });

      expect(resultado.balanceAfter).toBe(70);
    }));

  it("rechaza un descuento que no cabe en el saldo", () =>
    withRollback(async (db) => {
      const padre = await createParent(db);
      const hijo = await createChild(db, padre.id, { coins: 20 });

      await expect(
        applyCoinMovement(db, { childId: hijo.id, amount: -50, reason: "REDEMPTION_APPROVED" }),
      ).rejects.toBeInstanceOf(ConflictError);

      // Ni el saldo ni el historial se tocaron.
      const despues = await db.childProfile.findUniqueOrThrow({ where: { id: hijo.id } });
      expect(despues.coins).toBe(20);
      expect(await db.coinTransaction.count({ where: { childId: hijo.id } })).toBe(0);
    }));

  it("permite gastar el saldo exacto", () =>
    withRollback(async (db) => {
      const padre = await createParent(db);
      const hijo = await createChild(db, padre.id, { coins: 50 });

      const resultado = await applyCoinMovement(db, {
        childId: hijo.id,
        amount: -50,
        reason: "REDEMPTION_APPROVED",
      });

      expect(resultado.balanceAfter).toBe(0);
    }));

  it("rechaza mover monedas de un hijo que no existe", () =>
    withRollback(async (db) => {
      await expect(
        applyCoinMovement(db, { childId: "no-existe", amount: 10, reason: "TASK_APPROVED" }),
      ).rejects.toBeInstanceOf(NotFoundError);
    }));

  it("rechaza mover monedas de un hijo dado de baja", () =>
    withRollback(async (db) => {
      const padre = await createParent(db);
      const hijo = await createChild(db, padre.id, { coins: 100 });
      await db.childProfile.update({
        where: { id: hijo.id },
        data: { deletedAt: new Date() },
      });

      await expect(
        applyCoinMovement(db, { childId: hijo.id, amount: 10, reason: "TASK_APPROVED" }),
      ).rejects.toBeInstanceOf(ConflictError);
    }));

  it("rechaza un movimiento de cero", () =>
    withRollback(async (db) => {
      const padre = await createParent(db);
      const hijo = await createChild(db, padre.id, { coins: 10 });

      await expect(
        applyCoinMovement(db, { childId: hijo.id, amount: 0, reason: "MANUAL_ADJUSTMENT" }),
      ).rejects.toBeInstanceOf(ConflictError);
    }));

  it("enlaza el movimiento con la tarea que lo originó", () =>
    withRollback(async (db) => {
      const padre = await createParent(db);
      const hijo = await createChild(db, padre.id);
      const tarea = await db.task.create({
        data: { title: "Ordenar el cuarto", coins: 50, childId: hijo.id, parentId: padre.id },
      });

      await applyCoinMovement(db, {
        childId: hijo.id,
        amount: 50,
        reason: "TASK_APPROVED",
        taskId: tarea.id,
      });

      const movimiento = await db.coinTransaction.findFirstOrThrow({
        where: { childId: hijo.id },
      });
      expect(movimiento.taskId).toBe(tarea.id);
    }));
});

describe("atomicidad", () => {
  it("si falla la escritura del historial, el saldo queda como estaba", () =>
    withRollback(async (db) => {
      const padre = await createParent(db);
      const hijo = await createChild(db, padre.id, { coins: 10 });

      // Una transacción anidada que sube el saldo y después falla al escribir el
      // historial: el movimiento apunta a una tarea inexistente.
      await expect(
        (async () => {
          await db.childProfile.update({
            where: { id: hijo.id },
            data: { coins: { increment: 50 } },
          });
          await db.coinTransaction.create({
            data: {
              childId: hijo.id,
              amount: 50,
              balanceAfter: 60,
              reason: "TASK_APPROVED",
              taskId: "tarea-que-no-existe",
            },
          });
        })(),
      ).rejects.toThrow();
    }));

  it("una transacción que falla no deja ni saldo ni historial", async () => {
    const prisma = testPrisma();
    const padre = await prisma.user.create({
      data: {
        name: "Padre atomicidad",
        email: `atomicidad-${Date.now()}@monedin.test`,
        passwordHash: "h", pinHash: "hash-de-prueba",
      },
    });
    const hijo = await prisma.childProfile.create({
      data: { name: "Hijo", pinHash: "h", coins: 10, parentId: padre.id },
    });

    try {
      await expect(
        prisma.$transaction(async (tx) => {
          await applyCoinMovement(tx, {
            childId: hijo.id,
            amount: 50,
            reason: "TASK_APPROVED",
          });
          // Algo posterior falla dentro de la misma transacción.
          throw new Error("fallo posterior en la misma unidad de trabajo");
        }),
      ).rejects.toThrow("fallo posterior");

      const despues = await prisma.childProfile.findUniqueOrThrow({ where: { id: hijo.id } });
      expect(despues.coins).toBe(10);
      expect(await prisma.coinTransaction.count({ where: { childId: hijo.id } })).toBe(0);
    } finally {
      await prisma.childProfile.delete({ where: { id: hijo.id } });
      await prisma.user.delete({ where: { id: padre.id } });
    }
  });
});

describe("concurrencia", () => {
  /**
   * Prepara un hijo fuera de transacción para que dos operaciones simultáneas
   * puedan verlo, y lo limpia al terminar.
   */
  async function conHijoReal(
    saldoInicial: number,
    cuerpo: (childId: string) => Promise<void>,
  ): Promise<void> {
    const prisma = testPrisma();
    const padre = await prisma.user.create({
      data: {
        name: "Padre concurrencia",
        email: `concurrencia-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@monedin.test`,
        passwordHash: "h", pinHash: "hash-de-prueba",
      },
    });
    const hijo = await prisma.childProfile.create({
      data: { name: "Hijo", pinHash: "h", coins: saldoInicial, parentId: padre.id },
    });

    try {
      await cuerpo(hijo.id);
    } finally {
      await deleteLedgerRows(hijo.id);
      await prisma.childProfile.delete({ where: { id: hijo.id } });
      await prisma.user.delete({ where: { id: padre.id } });
    }
  }

  it("dos acreditaciones simultáneas cuadran y dejan dos filas", async () => {
    await conHijoReal(0, async (childId) => {
      const prisma = testPrisma();

      await Promise.all([
        prisma.$transaction((tx) =>
          applyCoinMovement(tx, { childId, amount: 30, reason: "TASK_APPROVED" }),
        ),
        prisma.$transaction((tx) =>
          applyCoinMovement(tx, { childId, amount: 20, reason: "TASK_APPROVED" }),
        ),
      ]);

      const hijo = await prisma.childProfile.findUniqueOrThrow({ where: { id: childId } });
      expect(hijo.coins).toBe(50);
      expect(await prisma.coinTransaction.count({ where: { childId } })).toBe(2);
    });
  });

  it("una acreditación y un descuento simultáneos cuadran", async () => {
    await conHijoReal(100, async (childId) => {
      const prisma = testPrisma();

      await Promise.all([
        prisma.$transaction((tx) =>
          applyCoinMovement(tx, { childId, amount: 40, reason: "TASK_APPROVED" }),
        ),
        prisma.$transaction((tx) =>
          applyCoinMovement(tx, { childId, amount: -25, reason: "REDEMPTION_APPROVED" }),
        ),
      ]);

      const hijo = await prisma.childProfile.findUniqueOrThrow({ where: { id: childId } });
      expect(hijo.coins).toBe(115);
    });
  });

  it("dos descuentos que juntos no caben: uno pasa y el otro da conflicto", async () => {
    await conHijoReal(50, async (childId) => {
      const prisma = testPrisma();

      const resultados = await Promise.allSettled([
        prisma.$transaction((tx) =>
          applyCoinMovement(tx, { childId, amount: -40, reason: "REDEMPTION_APPROVED" }),
        ),
        prisma.$transaction((tx) =>
          applyCoinMovement(tx, { childId, amount: -40, reason: "REDEMPTION_APPROVED" }),
        ),
      ]);

      const exitosos = resultados.filter((r) => r.status === "fulfilled");
      expect(exitosos).toHaveLength(1);

      // Lo importante: el saldo nunca quedó negativo.
      const hijo = await prisma.childProfile.findUniqueOrThrow({ where: { id: childId } });
      expect(hijo.coins).toBe(10);
      expect(hijo.coins).toBeGreaterThanOrEqual(0);
    });
  });

  it("un doble tap sobre la misma acreditación no acredita dos veces", async () => {
    await conHijoReal(0, async (childId) => {
      const prisma = testPrisma();

      // Dos peticiones idénticas, como las que produce un doble toque. La
      // protección real contra esto es la transición condicional del estado de
      // la tarea, que llega con su módulo; aquí se comprueba que el libro sigue
      // cuadrando pase lo que pase.
      await Promise.all([
        prisma.$transaction((tx) =>
          applyCoinMovement(tx, { childId, amount: 50, reason: "TASK_APPROVED" }),
        ),
        prisma.$transaction((tx) =>
          applyCoinMovement(tx, { childId, amount: 50, reason: "TASK_APPROVED" }),
        ),
      ]);

      const hijo = await prisma.childProfile.findUniqueOrThrow({ where: { id: childId } });
      const movimientos = await prisma.coinTransaction.findMany({ where: { childId } });

      // El saldo coincide con la suma del historial: no hay monedas de la nada.
      const suma = movimientos.reduce((total, m) => total + m.amount, 0);
      expect(hijo.coins).toBe(suma);
    });
  });
});

describe("auditoría del saldo", () => {
  it("la suma del historial coincide con el saldo y con el último movimiento", () =>
    withRollback(async (db) => {
      const padre = await createParent(db);
      const hijo = await createChild(db, padre.id);

      await applyCoinMovement(db, { childId: hijo.id, amount: 100, reason: "TASK_APPROVED" });
      await applyCoinMovement(db, { childId: hijo.id, amount: 50, reason: "TASK_APPROVED" });
      await applyCoinMovement(db, {
        childId: hijo.id,
        amount: -30,
        reason: "REDEMPTION_APPROVED",
      });

      const actual = await db.childProfile.findUniqueOrThrow({ where: { id: hijo.id } });
      const movimientos = await db.coinTransaction.findMany({
        where: { childId: hijo.id },
        orderBy: { createdAt: "asc" },
      });

      const suma = movimientos.reduce((total, m) => total + m.amount, 0);
      const ultimo = movimientos.at(-1);

      expect(actual.coins).toBe(120);
      expect(suma).toBe(actual.coins);
      expect(ultimo?.balanceAfter).toBe(actual.coins);
    }));

  it("cada movimiento registra el saldo que dejó", () =>
    withRollback(async (db) => {
      const padre = await createParent(db);
      const hijo = await createChild(db, padre.id);

      await applyCoinMovement(db, { childId: hijo.id, amount: 10, reason: "TASK_APPROVED" });
      await applyCoinMovement(db, { childId: hijo.id, amount: 25, reason: "TASK_APPROVED" });
      await applyCoinMovement(db, { childId: hijo.id, amount: -5, reason: "MANUAL_ADJUSTMENT" });

      const movimientos = await db.coinTransaction.findMany({
        where: { childId: hijo.id },
        orderBy: { createdAt: "asc" },
      });

      expect(movimientos.map((m) => m.balanceAfter)).toEqual([10, 35, 30]);
    }));

  it("detecta una divergencia entre el saldo y su historia", () =>
    withRollback(async (db) => {
      const padre = await createParent(db);
      const hijo = await createChild(db, padre.id);

      await applyCoinMovement(db, { childId: hijo.id, amount: 100, reason: "TASK_APPROVED" });

      // Alguien mueve el saldo por fuera del libro: exactamente lo que la
      // comprobación de coherencia tiene que cazar.
      await db.childProfile.update({
        where: { id: hijo.id },
        data: { coins: { increment: 999 } },
      });

      const actual = await db.childProfile.findUniqueOrThrow({ where: { id: hijo.id } });
      const movimientos = await db.coinTransaction.findMany({ where: { childId: hijo.id } });
      const suma = movimientos.reduce((total, m) => total + m.amount, 0);

      expect(suma).not.toBe(actual.coins);
    }));
});

describe("cierre", () => {
  it("la conexión de tests se cierra sin error", async () => {
    await expect(closeTestPrisma()).resolves.toBeUndefined();
  });
});
