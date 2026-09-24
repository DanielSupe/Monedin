import { getPrisma, withTranslatedErrors } from "../../shared/database/index.js";

export interface RewardOfferRow {
  coins: number;
  child: { id: string; name: string; avatar: string | null };
}

export interface RewardRow {
  id: string;
  title: string;
  description: string | null;

  image: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  offers: RewardOfferRow[];
}

export interface OwnRewardRow {
  id: string;
  title: string;
  description: string | null;
  image: string | null;
  coins: number;
  createdAt: Date;
}

const REWARD_FIELDS = {
  id: true,
  title: true,
  description: true,
  image: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  assignments: {
    select: {
      coins: true,
      child: { select: { id: true, name: true, avatar: true } },
    },
  },
} as const;

interface RewardSelection {
  id: string;
  title: string;
  description: string | null;
  image: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  assignments: RewardOfferRow[];
}

function toRewardRow(reward: RewardSelection): RewardRow {
  return {
    id: reward.id,
    title: reward.title,
    description: reward.description,
    image: reward.image,
    isActive: reward.isActive,
    createdAt: reward.createdAt,
    updatedAt: reward.updatedAt,
    offers: reward.assignments,
  };
}

export function createReward(data: {
  parentId: string;
  title: string;
  description?: string;

  image?: string;
  assignments: Array<{ childId: string; coins: number }>;
}): Promise<RewardRow> {
  return withTranslatedErrors(async () => {
    const reward = await getPrisma().reward.create({
      data: {
        parentId: data.parentId,
        title: data.title,

        ...(data.description === undefined ? {} : { description: data.description }),
        ...(data.image === undefined ? {} : { image: data.image }),
        assignments: {
          create: data.assignments.map((assignment) => ({
            childId: assignment.childId,
            coins: assignment.coins,
          })),
        },
      },
      select: REWARD_FIELDS,
    });

    return toRewardRow(reward);
  });
}

export function findChildIdsOwnedBy(parentId: string, childIds: string[]): Promise<string[]> {
  return withTranslatedErrors(async () => {
    const rows = await getPrisma().childProfile.findMany({
      where: { id: { in: childIds }, parentId, deletedAt: null },
      select: { id: true },
    });

    return rows.map((row) => row.id);
  });
}

export function findRewardsPage(
  parentId: string,
  filters: { isActive: boolean },
  { skip, take }: { skip: number; take: number },
): Promise<{ items: RewardRow[]; total: number }> {
  return withTranslatedErrors(async () => {
    const prisma = getPrisma();
    const where = { parentId, isActive: filters.isActive };

    const [items, total] = await prisma.$transaction([
      prisma.reward.findMany({
        where,
        select: REWARD_FIELDS,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        skip,
        take,
      }),
      prisma.reward.count({ where }),
    ]);

    return { items: items.map(toRewardRow), total };
  });
}

export function findRewardById(id: string): Promise<(RewardRow & { parentId: string }) | null> {
  return withTranslatedErrors(async () => {
    const reward = await getPrisma().reward.findUnique({
      where: { id },
      select: { ...REWARD_FIELDS, parentId: true },
    });

    return reward === null ? null : { ...toRewardRow(reward), parentId: reward.parentId };
  });
}

export function findOwnRewardsPage(
  childId: string,
  { skip, take }: { skip: number; take: number },
): Promise<{ items: OwnRewardRow[]; total: number; balance: number }> {
  return withTranslatedErrors(async () => {
    const prisma = getPrisma();
    const where = { childId, reward: { isActive: true } };

    const [assignments, total, child] = await prisma.$transaction([
      prisma.rewardAssignment.findMany({
        where,
        select: {
          coins: true,
          reward: {
            select: { id: true, title: true, description: true, image: true, createdAt: true },
          },
        },
        orderBy: [{ reward: { createdAt: "desc" } }, { rewardId: "desc" }],
        skip,
        take,
      }),
      prisma.rewardAssignment.count({ where }),
      prisma.childProfile.findUniqueOrThrow({ where: { id: childId }, select: { coins: true } }),
    ]);

    return {
      items: assignments.map((assignment) => ({
        id: assignment.reward.id,
        title: assignment.reward.title,
        description: assignment.reward.description,
        image: assignment.reward.image,
        coins: assignment.coins,
        createdAt: assignment.reward.createdAt,
      })),
      total,
      balance: child.coins,
    };
  });
}

export function findChildBalance(childId: string): Promise<number> {
  return withTranslatedErrors(async () => {
    const child = await getPrisma().childProfile.findUniqueOrThrow({
      where: { id: childId },
      select: { coins: true },
    });

    return child.coins;
  });
}

export function updateReward(
  id: string,
  data: {
    title?: string | undefined;
    description?: string | null | undefined;
    image?: string | null | undefined;
  },
): Promise<RewardRow> {
  return withTranslatedErrors(async () => {
    const reward = await getPrisma().reward.update({
      where: { id },
      data: {
        ...(data.title === undefined ? {} : { title: data.title }),
        ...(data.description === undefined ? {} : { description: data.description }),
        ...(data.image === undefined ? {} : { image: data.image }),
      },
      select: REWARD_FIELDS,
    });

    return toRewardRow(reward);
  });
}

export function replaceAssignments(
  rewardId: string,
  assignments: Array<{ childId: string; coins: number }>,
): Promise<RewardRow> {
  return withTranslatedErrors(() =>
    getPrisma().$transaction(async (tx) => {
      await tx.rewardAssignment.deleteMany({ where: { rewardId } });

      if (assignments.length > 0) {
        await tx.rewardAssignment.createMany({
          data: assignments.map((assignment) => ({
            rewardId,
            childId: assignment.childId,
            coins: assignment.coins,
          })),
        });
      }

      const reward = await tx.reward.findUniqueOrThrow({ where: { id: rewardId }, select: REWARD_FIELDS });
      return toRewardRow(reward);
    }),
  );
}

export function retireReward(id: string): Promise<number> {
  return withTranslatedErrors(async () => {
    const result = await getPrisma().reward.updateMany({
      where: { id, isActive: true },
      data: { isActive: false },
    });
    return result.count;
  });
}
