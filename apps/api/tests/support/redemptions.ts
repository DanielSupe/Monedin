import { testPrisma } from "./database.js";

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

export async function estadoDeCanje(redemptionId: string): Promise<string> {
  const { status } = await testPrisma().rewardRedemption.findUniqueOrThrow({
    where: { id: redemptionId },
    select: { status: true },
  });
  return status;
}

export async function movimientosDeCanje(
  redemptionId: string,
): Promise<Array<{ amount: number; balanceAfter: number; reason: string }>> {
  return testPrisma().coinTransaction.findMany({
    where: { redemptionId },
    select: { amount: true, balanceAfter: true, reason: true },
    orderBy: { createdAt: "asc" },
  });
}

export function cuantosCanjesTiene(childId: string, rewardId: string): Promise<number> {
  return testPrisma().rewardRedemption.count({ where: { childId, rewardId } });
}
