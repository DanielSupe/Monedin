import { testPrisma } from "./database.js";

export async function sembrarPremio(
  parentId: string,
  overrides: {
    title?: string;
    description?: string;
    isActive?: boolean;
    createdAt?: Date;
    offers?: Array<{ childId: string; coins: number }>;
  } = {},
): Promise<{ id: string; isActive: boolean }> {
  const reward = await testPrisma().reward.create({
    data: {
      title: overrides.title ?? "Ir al cine",
      parentId,
      ...(overrides.description === undefined ? {} : { description: overrides.description }),
      ...(overrides.isActive === undefined ? {} : { isActive: overrides.isActive }),
      ...(overrides.createdAt === undefined ? {} : { createdAt: overrides.createdAt }),
      ...(overrides.offers === undefined
        ? {}
        : {
            assignments: {
              create: overrides.offers.map((offer) => ({
                childId: offer.childId,
                coins: offer.coins,
              })),
            },
          }),
    },
    select: { id: true, isActive: true },
  });

  return reward;
}

export function cuantosPremiosTiene(parentId: string): Promise<number> {
  return testPrisma().reward.count({ where: { parentId } });
}

export async function ofertasDe(
  rewardId: string,
): Promise<Array<{ childId: string; coins: number }>> {
  return testPrisma().rewardAssignment.findMany({
    where: { rewardId },
    select: { childId: true, coins: true },
    orderBy: { childId: "asc" },
  });
}

export async function estaActivo(rewardId: string): Promise<boolean> {
  const { isActive } = await testPrisma().reward.findUniqueOrThrow({
    where: { id: rewardId },
    select: { isActive: true },
  });
  return isActive;
}

export async function fijarSaldo(childId: string, coins: number): Promise<void> {
  await testPrisma().childProfile.update({ where: { id: childId }, data: { coins } });
}

export function valoresNumericos(valor: unknown): number[] {
  if (typeof valor === "number") return [valor];
  if (Array.isArray(valor)) return valor.flatMap(valoresNumericos);
  if (valor !== null && typeof valor === "object") {
    return Object.values(valor).flatMap(valoresNumericos);
  }

  return [];
}
