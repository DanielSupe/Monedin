import type { CoinReason } from "../../generated/prisma/enums.js";
import { ConflictError, NotFoundError } from "../errors/domain-errors.js";
import type { TransactionClient } from "./types.js";

export interface CoinMovement {
  childId: string;

  amount: number;
  reason: CoinReason;
  taskId?: string;
  redemptionId?: string;
}

export interface CoinMovementResult {
  balanceAfter: number;
  transactionId: string;
}

export async function applyCoinMovement(
  tx: TransactionClient,
  movement: CoinMovement,
): Promise<CoinMovementResult> {
  const { childId, amount, reason } = movement;

  if (amount === 0) {
    throw new ConflictError();
  }

  const affected = await tx.childProfile.updateMany({
    where: {
      id: childId,
      deletedAt: null,
      ...(amount < 0 ? { coins: { gte: -amount } } : {}),
    },
    data: { coins: { increment: amount } },
  });

  if (affected.count !== 1) {
    const child = await tx.childProfile.findUnique({
      where: { id: childId },
      select: { deletedAt: true },
    });

    if (child === null) {
      throw new NotFoundError();
    }
    throw new ConflictError();
  }

  const { coins } = await tx.childProfile.findUniqueOrThrow({
    where: { id: childId },
    select: { coins: true },
  });

  const entry = await tx.coinTransaction.create({
    data: {
      childId,
      amount,
      balanceAfter: coins,
      reason,
      ...(movement.taskId === undefined ? {} : { taskId: movement.taskId }),
      ...(movement.redemptionId === undefined ? {} : { redemptionId: movement.redemptionId }),
    },
    select: { id: true },
  });

  return { balanceAfter: coins, transactionId: entry.id };
}
