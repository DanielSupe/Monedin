import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { getConfig } from "../src/config/index.js";

/**
 * Datos de ejemplo para desarrollar.
 *
 * SOLO en desarrollo. La comprobación de abajo no es una formalidad: una siembra
 * que se ejecuta por error en producción crea usuarios con credenciales
 * conocidas, y eso es una brecha, no una molestia.
 *
 * Es idempotente: se puede ejecutar las veces que haga falta.
 *
 * Las credenciales son literales de relleno. `add-authentication` decidirá el
 * algoritmo de hash y esta siembra se actualizará entonces; hoy nada las lee.
 */

const config = getConfig();

if (config.NODE_ENV !== "development") {
  console.error(
    `\nLa siembra solo se ejecuta en desarrollo, y NODE_ENV vale "${config.NODE_ENV}".\n` +
      "Sembrar datos de ejemplo fuera de desarrollo crea cuentas con credenciales\n" +
      "conocidas por cualquiera que lea el repositorio.\n",
  );
  process.exit(1);
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: config.DATABASE_URL }),
});

const PADRE = "familia.ejemplo@monedin.dev";

async function seed(): Promise<void> {
  const padre = await prisma.user.upsert({
    where: { email: PADRE },
    update: {},
    create: { name: "Lucía Ramírez", email: PADRE, passwordHash: "relleno-de-desarrollo" },
  });

  // Limpiar lo sembrado antes para que la siembra sea idempotente sin acumular.
  // El historial es inmutable, así que hay que desactivar su disparador: es
  // justo la señal de que borrar movimientos nunca es una operación normal.
  const previos = await prisma.childProfile.findMany({
    where: { parentId: padre.id },
    select: { id: true },
  });

  if (previos.length > 0) {
    const ids = previos.map((c) => c.id);
    await prisma.$executeRawUnsafe(
      `ALTER TABLE coin_transactions DISABLE TRIGGER coin_transactions_immutable`,
    );
    try {
      await prisma.coinTransaction.deleteMany({ where: { childId: { in: ids } } });
    } finally {
      await prisma.$executeRawUnsafe(
        `ALTER TABLE coin_transactions ENABLE TRIGGER coin_transactions_immutable`,
      );
    }
    await prisma.rewardRedemption.deleteMany({ where: { childId: { in: ids } } });
    await prisma.task.deleteMany({ where: { childId: { in: ids } } });
    await prisma.reward.deleteMany({ where: { parentId: padre.id } });
    await prisma.childProfile.deleteMany({ where: { id: { in: ids } } });
  }

  const mayor = await prisma.childProfile.create({
    data: { name: "Mateo", pinHash: "relleno-de-desarrollo", age: 10, coins: 0, parentId: padre.id },
  });
  const menor = await prisma.childProfile.create({
    data: { name: "Emma", pinHash: "relleno-de-desarrollo", age: 7, coins: 0, parentId: padre.id },
  });

  await prisma.task.createMany({
    data: [
      { title: "Ordenar el cuarto", coins: 50, childId: mayor.id, parentId: padre.id },
      { title: "Sacar la basura", coins: 20, childId: mayor.id, parentId: padre.id },
      { title: "Guardar los juguetes", coins: 30, childId: menor.id, parentId: padre.id },
      {
        title: "Leer 15 minutos",
        description: "Un cuento antes de dormir.",
        coins: 40,
        childId: menor.id,
        parentId: padre.id,
      },
    ],
  });

  const cine = await prisma.reward.create({
    data: { title: "Ir al cine", description: "Una película a elegir.", parentId: padre.id },
  });
  const helado = await prisma.reward.create({
    data: { title: "Helado", parentId: padre.id },
  });

  // El mismo premio cuesta distinto a cada hijo: es intencional.
  await prisma.rewardAssignment.createMany({
    data: [
      { rewardId: cine.id, childId: mayor.id, coins: 200 },
      { rewardId: cine.id, childId: menor.id, coins: 150 },
      { rewardId: helado.id, childId: mayor.id, coins: 60 },
      { rewardId: helado.id, childId: menor.id, coins: 40 },
    ],
  });

  // Saldo inicial de ejemplo, moviéndolo por el libro y no a mano, para que el
  // historial cuadre desde el primer día.
  for (const [hijo, monedas] of [
    [mayor, 120],
    [menor, 80],
  ] as const) {
    await prisma.$transaction(async (tx) => {
      await tx.childProfile.update({
        where: { id: hijo.id },
        data: { coins: { increment: monedas } },
      });
      await tx.coinTransaction.create({
        data: {
          childId: hijo.id,
          amount: monedas,
          balanceAfter: monedas,
          reason: "MANUAL_ADJUSTMENT",
        },
      });
    });
  }

  console.log(
    `Sembrado: 1 padre (${PADRE}), 2 hijos, 4 tareas, 2 premios con 4 asignaciones ` +
      "y su saldo inicial con historial.",
  );
}

try {
  await seed();
} finally {
  await prisma.$disconnect();
}
