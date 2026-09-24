import type { RedemptionStatus } from "@monedin/contracts";
import { applyCoinMovement, getPrisma, withTranslatedErrors } from "../../shared/database/index.js";
import { RedemptionTransitionConflictError } from "./redemptions.errors.js";

const REDEMPTION_FIELDS = {
  id: true,
  coins: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  reward: { select: { id: true, title: true } },
  child: { select: { id: true, name: true, avatar: true } },
} as const;

export interface RedemptionRow {
  id: string;
  coins: number;
  status: RedemptionStatus;
  createdAt: Date;
  updatedAt: Date;
  reward: { id: string; title: string };
  child: { id: string; name: string; avatar: string | null };
}

export interface RedemptionFilters {
  status?: RedemptionStatus;
  childId?: string;
}

export interface OfferForChild {
  coins: number;
  rewardIsActive: boolean;
  childBalance: number;
}

export function findOfferForChild(rewardId: string, childId: string): Promise<OfferForChild | null> {
  return withTranslatedErrors(async () => {
    const assignment = await getPrisma().rewardAssignment.findUnique({
      where: { rewardId_childId: { rewardId, childId } },
      select: {
        coins: true,
        reward: { select: { isActive: true } },
        child: { select: { coins: true } },
      },
    });

    if (assignment === null) return null;

    return {
      coins: assignment.coins,
      rewardIsActive: assignment.reward.isActive,
      childBalance: assignment.child.coins,
    };
  });
}

export function existsPendingRedemption(rewardId: string, childId: string): Promise<boolean> {
  return withTranslatedErrors(async () => {
    const found = await getPrisma().rewardRedemption.findFirst({
      where: { rewardId, childId, status: "PENDING" },
      select: { id: true },
    });

    return found !== null;
  });
}

export function createRedemption(data: {
  childId: string;
  rewardId: string;
  coins: number;
}): Promise<RedemptionRow> {
  return withTranslatedErrors(() =>
    getPrisma().rewardRedemption.create({
      data: { childId: data.childId, rewardId: data.rewardId, coins: data.coins },
      select: REDEMPTION_FIELDS,
    }),
  );
}

export function findRedemptionById(
  id: string,
): Promise<(RedemptionRow & { parentId: string; childId: string }) | null> {
  return withTranslatedErrors(async () => {
    const redemption = await getPrisma().rewardRedemption.findUnique({
      where: { id },
      select: {
        id: true,
        coins: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        childId: true,
        reward: { select: { id: true, title: true } },
        child: { select: { id: true, name: true, avatar: true, parentId: true } },
      },
    });

    if (redemption === null) return null;

    const { child, ...rest } = redemption;
    return {
      ...rest,
      child: { id: child.id, name: child.name, avatar: child.avatar },
      parentId: child.parentId,
    };
  });
}

export function findRedemptionsPage(
  parentId: string,
  filters: RedemptionFilters,
  { skip, take }: { skip: number; take: number },
): Promise<{ items: RedemptionRow[]; total: number }> {
  return withTranslatedErrors(async () => {
    const prisma = getPrisma();
    const where = {
      child: { parentId },
      ...(filters.status === undefined ? {} : { status: filters.status }),
      ...(filters.childId === undefined ? {} : { childId: filters.childId }),
    };

    const [items, total] = await prisma.$transaction([
      prisma.rewardRedemption.findMany({
        where,
        select: REDEMPTION_FIELDS,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        skip,
        take,
      }),
      prisma.rewardRedemption.count({ where }),
    ]);

    return { items, total };
  });
}

export function findOwnRedemptionsPage(
  childId: string,
  filters: { status?: RedemptionStatus },
  { skip, take }: { skip: number; take: number },
): Promise<{ items: RedemptionRow[]; total: number }> {
  return withTranslatedErrors(async () => {
    const prisma = getPrisma();
    const where = {
      childId,
      ...(filters.status === undefined ? {} : { status: filters.status }),
    };

    const [items, total] = await prisma.$transaction([
      prisma.rewardRedemption.findMany({
        where,
        select: REDEMPTION_FIELDS,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        skip,
        take,
      }),
      prisma.rewardRedemption.count({ where }),
    ]);

    return { items, total };
  });
}

export function transition(
  redemptionId: string,
  from: RedemptionStatus,
  to: RedemptionStatus,
): Promise<RedemptionRow> {
  return withTranslatedErrors(async () => {
    const prisma = getPrisma();

    const affected = await prisma.rewardRedemption.updateMany({
      where: { id: redemptionId, status: from },
      data: { status: to },
    });

    if (affected.count !== 1) {
      throw new RedemptionTransitionConflictError();
    }

    return prisma.rewardRedemption.findUniqueOrThrow({
      where: { id: redemptionId },
      select: REDEMPTION_FIELDS,
    });
  });
}

export function approve(redemptionId: string, childId: string, coins: number): Promise<RedemptionRow> {
  return withTranslatedErrors(() =>
    getPrisma().$transaction(async (tx) => {
      const affected = await tx.rewardRedemption.updateMany({
        where: { id: redemptionId, status: "PENDING" },
        data: { status: "APPROVED" },
      });

      if (affected.count !== 1) {
        throw new RedemptionTransitionConflictError();
      }

      await applyCoinMovement(tx, {
        childId,
        amount: -coins,
        reason: "REDEMPTION_APPROVED",
        redemptionId,
      });

      return tx.rewardRedemption.findUniqueOrThrow({
        where: { id: redemptionId },
        select: REDEMPTION_FIELDS,
      });
    }),
  );
}
