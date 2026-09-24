import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client.js";
import { getConfig } from "../../src/config/index.js";

let client: PrismaClient | undefined;

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

export type TransactionalPrisma = Parameters<Parameters<PrismaClient["$transaction"]>[0]>[0];

const ROLLBACK = Symbol("rollback");

export async function withRollback<T>(body: (db: TransactionalPrisma) => Promise<T>): Promise<T> {
  let result: T;

  try {
    await testPrisma().$transaction(
      async (tx) => {
        result = await body(tx);

        throw ROLLBACK;
      },

      { timeout: 20_000, maxWait: 20_000 },
    );
  } catch (error) {
    if (error !== ROLLBACK) throw error;
  }

  return result!;
}

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
