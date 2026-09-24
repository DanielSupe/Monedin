import { randomUUID } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { getConfig } from "../src/config/index.js";
import { hashCredential } from "../src/shared/crypto/credentials.js";
import { applyCoinMovement } from "../src/shared/database/coin-ledger.js";

export const CREDENCIALES_DE_EJEMPLO = {
  padre: { correo: "familia.ejemplo@monedin.dev", password: "monedin-desarrollo", pin: "1357" },
  ninos: [
    { nombre: "Mateo", pin: "1234", avatar: "zorro" },
    { nombre: "Emma", pin: "5678", avatar: "koala" },
    { nombre: "Lucas", pin: "4321", avatar: "panda" },
  ],
} as const;

const BLOQUEO_DE_LUCAS_EN_MINUTOS = 365 * 24 * 60;

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
    create: {
      name: "Lucía Ramírez",
      email: PADRE,
      passwordHash: await hashCredential(CREDENCIALES_DE_EJEMPLO.padre.password),
      pinHash: await hashCredential(CREDENCIALES_DE_EJEMPLO.padre.pin),
      image: "pulpo",
    },
  });

  const previos = await prisma.childProfile.findMany({
    where: { parentId: padre.id },
    select: { id: true },
  });

  await prisma.user.update({
    where: { id: padre.id },
    data: {
      passwordHash: await hashCredential(CREDENCIALES_DE_EJEMPLO.padre.password),
      failedLoginAttempts: 0,
      lockedUntil: null,
      pinHash: await hashCredential(CREDENCIALES_DE_EJEMPLO.padre.pin),
      failedPinAttempts: 0,
      pinLockedUntil: null,
      image: "pulpo",
    },
  });

  if (previos.length > 0) {
    await prisma.session.deleteMany({ where: { userId: padre.id } });
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
    data: {
      name: CREDENCIALES_DE_EJEMPLO.ninos[0].nombre,
      pinHash: await hashCredential(CREDENCIALES_DE_EJEMPLO.ninos[0].pin),
      avatar: CREDENCIALES_DE_EJEMPLO.ninos[0].avatar,
      age: 10,
      coins: 0,
      parentId: padre.id,
    },
  });
  const menor = await prisma.childProfile.create({
    data: {
      name: CREDENCIALES_DE_EJEMPLO.ninos[1].nombre,
      pinHash: await hashCredential(CREDENCIALES_DE_EJEMPLO.ninos[1].pin),
      avatar: CREDENCIALES_DE_EJEMPLO.ninos[1].avatar,
      age: 7,
      coins: 0,
      parentId: padre.id,
    },
  });

  const bloqueado = await prisma.childProfile.create({
    data: {
      name: CREDENCIALES_DE_EJEMPLO.ninos[2].nombre,
      pinHash: await hashCredential(CREDENCIALES_DE_EJEMPLO.ninos[2].pin),
      avatar: CREDENCIALES_DE_EJEMPLO.ninos[2].avatar,
      coins: 0,
      failedPinAttempts: 5,
      lockedUntil: new Date(Date.now() + BLOQUEO_DE_LUCAS_EN_MINUTOS * 60 * 1000),
      parentId: padre.id,
    },
  });

  const ordenarElCuarto = randomUUID();
  const deberesDeCasa = randomUUID();
  const regarLasPlantas = randomUUID();

  const enDosDias = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
  const anteayer = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);

  const tareas = [
    { title: "Ordenar el cuarto", coins: 50, childId: mayor.id, batchId: ordenarElCuarto },
    { title: "Ordenar el cuarto", coins: 30, childId: menor.id, batchId: ordenarElCuarto },
    {
      title: "Ordenar el cuarto",
      coins: 30,
      childId: bloqueado.id,
      batchId: ordenarElCuarto,
      status: "COMPLETED" as const,
    },

    {
      title: "Regar las plantas",
      description: "Las del balcon, antes del fin de semana.",
      coins: 25,
      childId: mayor.id,
      batchId: regarLasPlantas,
      dueDate: enDosDias,
    },
    {
      title: "Regar las plantas",
      coins: 25,
      childId: menor.id,
      batchId: regarLasPlantas,
      dueDate: anteayer,
    },

    { title: "Sacar la basura", coins: 20, childId: mayor.id, status: "COMPLETED" as const },
    {
      title: "Leer 15 minutos",
      description: "Un cuento antes de dormir.",
      coins: 40,
      childId: menor.id,
      status: "COMPLETED" as const,
    },

    { title: "Poner la mesa", coins: 70, childId: mayor.id, batchId: deberesDeCasa, status: "APPROVED" as const },
    { title: "Poner la mesa", coins: 50, childId: menor.id, batchId: deberesDeCasa, status: "APPROVED" as const },
    { title: "Hacer la cama", coins: 50, childId: mayor.id, status: "APPROVED" as const },
    { title: "Hacer la cama", coins: 30, childId: menor.id, status: "APPROVED" as const },

    { title: "Dar de comer al gato", coins: 40, childId: bloqueado.id, status: "APPROVED" as const },
  ];

  const creadas = [];
  for (const tarea of tareas) {
    creadas.push(
      await prisma.task.create({
        data: {
          ...tarea,
          batchId: tarea.batchId ?? randomUUID(),
          parentId: padre.id,
        },
        select: { id: true, childId: true, coins: true, status: true },
      }),
    );
  }

  const cine = await prisma.reward.create({
    data: { title: "Ir al cine", description: "Una película a elegir.", parentId: padre.id },
  });
  const helado = await prisma.reward.create({
    data: { title: "Helado", parentId: padre.id },
  });

  const postre = await prisma.reward.create({
    data: { title: "Elegir el postre", description: "El de toda la familia.", parentId: padre.id },
  });

  await prisma.reward.create({
    data: {
      title: "Videojuego (retirado)",
      description: "Se dejó de ofrecer.",
      isActive: false,
      parentId: padre.id,
    },
  });

  await prisma.reward.create({
    data: { title: "Sin ofertas todavía", parentId: padre.id },
  });

  await prisma.rewardAssignment.createMany({
    data: [
      { rewardId: cine.id, childId: mayor.id, coins: 200 },
      { rewardId: cine.id, childId: menor.id, coins: 150 },
      { rewardId: cine.id, childId: bloqueado.id, coins: 150 },
      { rewardId: helado.id, childId: mayor.id, coins: 60 },
      { rewardId: helado.id, childId: menor.id, coins: 40 },
      { rewardId: helado.id, childId: bloqueado.id, coins: 40 },
      { rewardId: postre.id, childId: mayor.id, coins: 30 },
      { rewardId: postre.id, childId: menor.id, coins: 25 },
      { rewardId: postre.id, childId: bloqueado.id, coins: 25 },
    ],
  });

  for (const tarea of creadas.filter((una) => una.status === "APPROVED")) {
    await prisma.$transaction((tx) =>
      applyCoinMovement(tx, {
        childId: tarea.childId,
        amount: tarea.coins,
        reason: "TASK_APPROVED",
        taskId: tarea.id,
      }),
    );
  }

  await prisma.rewardRedemption.create({
    data: { rewardId: helado.id, childId: mayor.id, coins: 60, status: "PENDING" },
  });

  const paraAprobar = await prisma.rewardRedemption.create({
    data: { rewardId: helado.id, childId: menor.id, coins: 40, status: "PENDING" },
  });

  await prisma.rewardRedemption.update({
    where: { id: paraAprobar.id },
    data: { status: "APPROVED" },
  });
  await prisma.$transaction((tx) =>
    applyCoinMovement(tx, {
      childId: menor.id,
      amount: -40,
      reason: "REDEMPTION_APPROVED",
      redemptionId: paraAprobar.id,
    }),
  );

  await prisma.rewardRedemption.create({
    data: { rewardId: helado.id, childId: mayor.id, coins: 60, status: "REJECTED" },
  });

  const resumen = [
    `Sembrado: 1 padre, 3 hijos (uno BLOQUEADO y sin edad), ${creadas.length} tareas en los tres`,
    `  estados, con un reparto de tres hijos y estados mezclados y dos con fecha`,
    `  limite —una por vencer y otra pasada—,`,
    `  5 premios (uno retirado, uno sin ofertas) con 9 asignaciones, 3 canjes en`,
    `  los tres estados, y el saldo que sale de las tareas aprobadas y del canje`,
    `  aprobado.`,
    `  Padre: ${CREDENCIALES_DE_EJEMPLO.padre.correo} / ${CREDENCIALES_DE_EJEMPLO.padre.password} / PIN ${CREDENCIALES_DE_EJEMPLO.padre.pin}`,
    ...CREDENCIALES_DE_EJEMPLO.ninos.map((n) => `  ${n.nombre}: PIN ${n.pin}`),
  ];

  console.log(resumen.join(String.fromCharCode(10)));
}

try {
  await seed();
} finally {
  await prisma.$disconnect();
}
