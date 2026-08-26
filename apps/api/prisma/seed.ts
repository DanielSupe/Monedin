import { randomUUID } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { getConfig } from "../src/config/index.js";
import { hashCredential } from "../src/shared/crypto/credentials.js";
import { applyCoinMovement } from "../src/shared/database/coin-ledger.js";

/**
 * Datos de ejemplo para desarrollar.
 *
 * SOLO en desarrollo. La comprobación de abajo no es una formalidad: una siembra
 * que se ejecuta por error en producción crea usuarios con credenciales
 * conocidas, y eso es una brecha, no una molestia.
 *
 * Es idempotente: se puede ejecutar las veces que haga falta.
 *
 * Las credenciales son REALES y verificables: se puede entrar con ellas. Están
 * escritas aquí a la vista de cualquiera, que es exactamente el motivo por el
 * que esta siembra se niega a ejecutarse fuera de desarrollo.
 */

/** Credenciales de ejemplo. Documentadas en el README. */
export const CREDENCIALES_DE_EJEMPLO = {
  padre: { correo: "familia.ejemplo@monedin.dev", password: "monedin-desarrollo", pin: "1357" },
  ninos: [
    { nombre: "Mateo", pin: "1234", avatar: "zorro" },
    { nombre: "Emma", pin: "5678", avatar: "koala" },
  ],
} as const;

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

  // Limpiar lo sembrado antes para que la siembra sea idempotente sin acumular.
  // El historial es inmutable, así que hay que desactivar su disparador: es
  // justo la señal de que borrar movimientos nunca es una operación normal.
  const previos = await prisma.childProfile.findMany({
    where: { parentId: padre.id },
    select: { id: true },
  });

  // La contraseña y el PIN se refrescan en cada siembra, para que sigan siendo
  // los documentados aunque se hubieran cambiado probando, y se desbloquean los
  // dos por si una siembra anterior los dejó bloqueados.
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

  // --- Tareas ---------------------------------------------------------------
  //
  // Se siembran en los TRES estados para que la aplicacion tenga algo que
  // ensenar nada mas levantarla: pendientes que el nino puede marcar, marcadas
  // que esperan al padre en su bandeja de aprobacion, y aprobadas con su
  // acreditacion de verdad.
  //
  // Un REPARTO son las filas creadas en un mismo acto. "Ordenar el cuarto" se
  // asigno a los dos hijos a la vez, asi que sus dos filas comparten `batchId`;
  // el resto son repartos de uno. El identificador lo genera quien crea, porque
  // hace falta conocerlo antes de insertar.
  const ordenarElCuarto = randomUUID();
  const deberesDeCasa = randomUUID();

  const tareas = [
    // Pendientes: lo que cada nino tiene por hacer.
    { title: "Ordenar el cuarto", coins: 50, childId: mayor.id, batchId: ordenarElCuarto },
    { title: "Ordenar el cuarto", coins: 30, childId: menor.id, batchId: ordenarElCuarto },

    // Marcadas: esperando a que su padre las resuelva. Es la bandeja.
    { title: "Sacar la basura", coins: 20, childId: mayor.id, status: "COMPLETED" as const },
    {
      title: "Leer 15 minutos",
      description: "Un cuento antes de dormir.",
      coins: 40,
      childId: menor.id,
      status: "COMPLETED" as const,
    },

    // Aprobadas: ya pagadas. Su acreditacion se escribe justo debajo.
    { title: "Poner la mesa", coins: 70, childId: mayor.id, batchId: deberesDeCasa, status: "APPROVED" as const },
    { title: "Poner la mesa", coins: 50, childId: menor.id, batchId: deberesDeCasa, status: "APPROVED" as const },
    { title: "Hacer la cama", coins: 50, childId: mayor.id, status: "APPROVED" as const },
    { title: "Hacer la cama", coins: 30, childId: menor.id, status: "APPROVED" as const },
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

  // --- Imagenes ---------------------------------------------------------------
  //
  // La siembra NO sube ninguna foto, y es deliberado: sembrar objetos exigiria
  // que el almacen estuviera levantado, y entonces `pnpm db:seed` dejaria de
  // funcionar con solo la base de datos. Los avatares del catalogo ya ensenan el
  // caso por defecto, y subir una foto es justo lo que se prueba a mano.
  const cine = await prisma.reward.create({
    data: { title: "Ir al cine", description: "Una película a elegir.", parentId: padre.id },
  });
  const helado = await prisma.reward.create({
    data: { title: "Helado", parentId: padre.id },
  });
  // Retirado: sigue en el catálogo del padre bajo el filtro de retirados, y ya
  // no aparece en ningún escaparate. Sin este caso, un desarrollador que
  // arranca por primera vez no vería nunca ese filtro con algo dentro.
  await prisma.reward.create({
    data: {
      title: "Videojuego (retirado)",
      description: "Se dejó de ofrecer.",
      isActive: false,
      parentId: padre.id,
    },
  });
  // Sin ninguna oferta: estado válido, no un premio a medio publicar. Es como
  // se retira la oferta a todos sin retirar el premio.
  await prisma.reward.create({
    data: { title: "Sin ofertas todavía", parentId: padre.id },
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

  // El saldo sale de las tareas aprobadas y de nada mas.
  //
  // Antes era un ajuste manual, y contradecia una decision cerrada del
  // producto: el saldo solo se mueve con tareas y canjes. Ahora cada moneda
  // sembrada tiene su tarea detras, asi que el historial que ve un desarrollador
  // el primer dia es el mismo que producira la aplicacion.
  //
  // Se acredita con `applyCoinMovement`, la misma operacion que usa el modulo
  // `tasks`: la siembra no escribe su propia version de mover monedas.
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

  // --- Canjes -----------------------------------------------------------------
  //
  // Se siembran en los TRES estados sobre "Helado" (60/40): es el único premio
  // que el saldo de las tareas aprobadas alcanza a pagar (Mateo 120, Emma 80;
  // "Ir al cine" cuesta 200/150 y ninguno llega todavía). Mateo tiene una
  // solicitud PENDING que el padre verá en su bandeja, Emma ya tiene una
  // APROBADA -su saldo ya refleja el descuento-, y una segunda solicitud de
  // Mateo quedó RECHAZADA. Así el catálogo del padre enseña los tres estados
  // desde el primer arranque, igual que las tareas.
  await prisma.rewardRedemption.create({
    data: { rewardId: helado.id, childId: mayor.id, coins: 60, status: "PENDING" },
  });

  const paraAprobar = await prisma.rewardRedemption.create({
    data: { rewardId: helado.id, childId: menor.id, coins: 40, status: "PENDING" },
  });
  // Mismo orden que `redemptions.repository.approve()`: la transición primero,
  // y solo entonces el descuento, con `applyCoinMovement` y no una versión
  // propia.
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
    `Sembrado: 1 padre, 2 hijos, ${creadas.length} tareas en los tres estados,`,
    `  4 premios (uno retirado, uno sin ofertas) con 4 asignaciones, 3 canjes en`,
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
