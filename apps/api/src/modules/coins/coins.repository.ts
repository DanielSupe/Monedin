import { getPrisma, withTranslatedErrors } from "../../shared/database/index.js";

const MOVEMENT_FIELDS = {
  id: true,
  amount: true,
  balanceAfter: true,
  reason: true,
  createdAt: true,
  taskId: true,
  redemptionId: true,
} as const;

export type MovementRow = {
  id: string;
  amount: number;
  balanceAfter: number;
  reason: "TASK_APPROVED" | "REDEMPTION_APPROVED" | "MANUAL_ADJUSTMENT";
  createdAt: Date;
  taskId: string | null;
  redemptionId: string | null;
};

export function findCoinHistoryPage(
  childId: string,
  { skip, take }: { skip: number; take: number },
): Promise<{ items: MovementRow[]; total: number }> {
  return withTranslatedErrors(async () => {
    const prisma = getPrisma();
    const where = { childId };

    const [items, total] = await prisma.$transaction([
      prisma.coinTransaction.findMany({
        where,
        select: MOVEMENT_FIELDS,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        skip,
        take,
      }),
      prisma.coinTransaction.count({ where }),
    ]);

    return { items, total };
  });
}
