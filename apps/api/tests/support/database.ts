import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client.js";
import { getConfig } from "../../src/config/index.js";

/**
 * Acceso a la base de datos de tests.
 *
 * Cada test corre dentro de una transacción que SIEMPRE se deshace. Así el orden
 * de ejecución no importa, dos tests que tocan las mismas entidades no se ven
 * entre sí, y no hace falta mantener una lista de tablas que truncar cada vez
 * que se añade una.
 */

let client: PrismaClient | undefined;

/** Cliente contra la base de tests. Nunca contra la de desarrollo. */
export function testPrisma(): PrismaClient {
  client ??= new PrismaClient({
    adapter: new PrismaPg({ connectionString: getConfig().TEST_DATABASE_URL }),
  });
  return client;
}

export async function closeTestPrisma(): Promise<void> {
  if (client === undefined) return;
  const closing = client;
  client = undefined;
  await closing.$disconnect();
}

/** Cliente dentro de una transacción: la misma superficie, sin poder confirmar. */
export type TransactionalPrisma = Parameters<Parameters<PrismaClient["$transaction"]>[0]>[0];

/** Señal interna para deshacer la transacción sin que cuente como fallo. */
const ROLLBACK = Symbol("rollback");

/**
 * Ejecuta el cuerpo de un test dentro de una transacción y la deshace al salir.
 *
 * ```ts
 * it("hace algo", () =>
 *   withRollback(async (db) => {
 *     const padre = await db.user.create({ data: ... });
 *     expect(padre.id).toBeTruthy();
 *   }));
 * ```
 *
 * Nada de lo que escriba el test sobrevive, pase o falle.
 */
export async function withRollback<T>(body: (db: TransactionalPrisma) => Promise<T>): Promise<T> {
  let result: T;

  try {
    await testPrisma().$transaction(
      async (tx) => {
        result = await body(tx);
        // Deshacer siempre: la única forma de salir de una transacción
        // interactiva de Prisma sin confirmarla es lanzando.
        throw ROLLBACK;
      },
      // Margen amplio: algunos tests abren varias operaciones y en Windows el
      // arranque de la conexión es lento.
      { timeout: 20_000, maxWait: 20_000 },
    );
  } catch (error) {
    if (error !== ROLLBACK) throw error;
  }

  // Si llegamos aquí sin error, el cuerpo se ejecutó y `result` está asignado.
  return result!;
}

/**
 * Crea un padre con datos válidos. El correo es único en cada llamada para que
 * dos tests concurrentes no choquen.
 */
export async function createParent(
  db: TransactionalPrisma,
  overrides: { name?: string; email?: string } = {},
): Promise<{ id: string; email: string }> {
  const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  const parent = await db.user.create({
    data: {
      name: overrides.name ?? "Padre de prueba",
      email: overrides.email ?? `padre-${unique}@monedin.test`,
      passwordHash: "hash-de-prueba", pinHash: "hash-de-prueba",
    },
  });

  return { id: parent.id, email: parent.email };
}

/** Crea un hijo válido colgando de un padre. */
export async function createChild(
  db: TransactionalPrisma,
  parentId: string,
  overrides: { name?: string; coins?: number; age?: number } = {},
): Promise<{ id: string; coins: number }> {
  const child = await db.childProfile.create({
    data: {
      name: overrides.name ?? "Hijo de prueba",
      pinHash: "hash-de-prueba",
      ...(overrides.coins === undefined ? {} : { coins: overrides.coins }),
      ...(overrides.age === undefined ? {} : { age: overrides.age }),
      parentId,
    },
  });

  return { id: child.id, coins: child.coins };
}

/**
 * Crea una tarea valida colgando de un padre y un hijo.
 *
 * `batchId` es obligatorio desde `add-tasks`, y salvo que se indique otro cada
 * tarea nace en su propio reparto de una: es lo que hace este ayudante util
 * tambien para los tests que no van de repartos.
 */
export async function createTask(
  db: TransactionalPrisma,
  owners: { parentId: string; childId: string },
  overrides: {
    title?: string;
    coins?: number;
    status?: "PENDING" | "COMPLETED" | "APPROVED";
    batchId?: string;
    dueDate?: Date;
  } = {},
): Promise<{ id: string; batchId: string; status: string; coins: number }> {
  const task = await db.task.create({
    data: {
      title: overrides.title ?? "Ordenar el cuarto",
      coins: overrides.coins ?? 50,
      batchId: overrides.batchId ?? `reparto-${Math.random().toString(36).slice(2, 12)}`,
      ...(overrides.status === undefined ? {} : { status: overrides.status }),
      ...(overrides.dueDate === undefined ? {} : { dueDate: overrides.dueDate }),
      childId: owners.childId,
      parentId: owners.parentId,
    },
  });

  return { id: task.id, batchId: task.batchId, status: task.status, coins: task.coins };
}

/**
 * Borra el historial de un hijo, desactivando el disparador que lo protege.
 *
 * Es limpieza de tests, no una operación del dominio. Que haga falta desactivar
 * el disparador a mano es exactamente la prueba de que el historial no se puede
 * borrar por accidente: hay que quererlo.
 */
export async function deleteLedgerRows(childId: string): Promise<void> {
  const prisma = testPrisma();

  await prisma.$executeRawUnsafe(
    `ALTER TABLE coin_transactions DISABLE TRIGGER coin_transactions_immutable`,
  );
  try {
    await prisma.$executeRawUnsafe(`DELETE FROM coin_transactions WHERE "childId" = $1`, childId);
  } finally {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE coin_transactions ENABLE TRIGGER coin_transactions_immutable`,
    );
  }
}
