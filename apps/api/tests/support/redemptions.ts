import { testPrisma } from "./database.js";

/**
 * Soporte para los tests de canjes.
 *
 * `familiaOperando` (de `support/tasks.ts`), `sembrarPremio` y `fijarSaldo`
 * (de `support/rewards.ts`) se reutilizan tal cual.
 */

/**
 * Crea un canje saltándose la API, con el estado y el precio congelado que se
 * indique.
 *
 * Sirve para colocar un canje en un estado concreto sin recorrer la
 * solicitud, que es lo que hace legible un test de «aprobar uno ya resuelto».
 */
export async function sembrarCanje(
  owners: { childId: string; rewardId: string },
  overrides: {
    coins?: number;
    status?: "PENDING" | "APPROVED" | "REJECTED";
    createdAt?: Date;
  } = {},
): Promise<{ id: string; coins: number }> {
  const redemption = await testPrisma().rewardRedemption.create({
    data: {
      childId: owners.childId,
      rewardId: owners.rewardId,
      coins: overrides.coins ?? 60,
      ...(overrides.status === undefined ? {} : { status: overrides.status }),
      ...(overrides.createdAt === undefined ? {} : { createdAt: overrides.createdAt }),
    },
    select: { id: true, coins: true },
  });

  return redemption;
}

/** El estado en el que ha quedado un canje. */
export async function estadoDeCanje(redemptionId: string): Promise<string> {
  const { status } = await testPrisma().rewardRedemption.findUniqueOrThrow({
    where: { id: redemptionId },
    select: { status: true },
  });
  return status;
}

/** Las entradas de historial que señalan un canje concreto. */
export async function movimientosDeCanje(
  redemptionId: string,
): Promise<Array<{ amount: number; balanceAfter: number; reason: string }>> {
  return testPrisma().coinTransaction.findMany({
    where: { redemptionId },
    select: { amount: true, balanceAfter: true, reason: true },
    orderBy: { createdAt: "asc" },
  });
}

/** Cuántos canjes hay creados para un hijo. Para comprobar el bloqueo de duplicados. */
export function cuantosCanjesTiene(childId: string, rewardId: string): Promise<number> {
  return testPrisma().rewardRedemption.count({ where: { childId, rewardId } });
}
