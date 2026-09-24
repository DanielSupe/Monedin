import { getPrisma, withTranslatedErrors } from "../../shared/database/index.js";

export interface ContextLimits {
  tasks: number;
  rewards: number;
  redemptions: number;
  movements: number;
}

export interface ChildTaskRow {
  title: string;
  coins: number;
  status: string;
}

export interface ChildRewardRow {
  title: string;
  description: string | null;
  coins: number;
}

export interface ChildRedemptionRow {
  rewardTitle: string;
  coins: number;
  status: string;
}

export interface ChildMovementRow {
  amount: number;
  reason: string;
}

export interface ChildContextRow {
  name: string;
  age: number | null;
  coins: number;
  tasks: ChildTaskRow[];
  rewards: ChildRewardRow[];
  redemptions: ChildRedemptionRow[];
  movements: ChildMovementRow[];
}

export function findChildContext(
  childProfileId: string,
  limits: ContextLimits,
): Promise<ChildContextRow | null> {
  return withTranslatedErrors(async () => {
    const prisma = getPrisma();

    return prisma.$transaction(async (tx) => {
      const perfil = await tx.childProfile.findFirst({
        where: { id: childProfileId, deletedAt: null },
        select: { name: true, age: true, coins: true },
      });

      if (perfil === null) {
        return null;
      }

      const [tareas, ofertas, canjes, movimientos] = await Promise.all([
        tx.task.findMany({
          where: { childId: childProfileId },
          select: { title: true, coins: true, status: true },
          orderBy: [{ status: "asc" }, { createdAt: "desc" }, { id: "desc" }],
          take: limits.tasks,
        }),

        tx.rewardAssignment.findMany({
          where: { childId: childProfileId, reward: { isActive: true } },
          select: {
            coins: true,
            reward: { select: { title: true, description: true } },
          },
          orderBy: [{ coins: "asc" }, { rewardId: "asc" }],
          take: limits.rewards,
        }),
        tx.rewardRedemption.findMany({
          where: { childId: childProfileId },
          select: {
            coins: true,
            status: true,
            reward: { select: { title: true } },
          },
          orderBy: [{ createdAt: "desc" }, { id: "desc" }],
          take: limits.redemptions,
        }),

        tx.coinTransaction.findMany({
          where: { childId: childProfileId },
          select: { amount: true, reason: true },
          orderBy: [{ createdAt: "desc" }, { id: "desc" }],
          take: limits.movements,
        }),
      ]);

      return {
        name: perfil.name,
        age: perfil.age,
        coins: perfil.coins,
        tasks: tareas,
        rewards: ofertas.map((oferta) => ({
          title: oferta.reward.title,
          description: oferta.reward.description,
          coins: oferta.coins,
        })),
        redemptions: canjes.map((canje) => ({
          rewardTitle: canje.reward.title,
          coins: canje.coins,
          status: canje.status,
        })),
        movements: movimientos,
      };
    });
  });
}

export interface ParentChildRow {
  name: string;
  age: number | null;
  coins: number;
  pendingTasks: number;
}

export interface ParentTaskRow {
  childName: string;
  title: string;
  coins: number;
}

export interface ParentRewardRow {
  title: string;
  offers: number;
}

export interface ParentRedemptionRow {
  childName: string;
  rewardTitle: string;
  coins: number;
}

export interface ParentContextRow {
  name: string;
  children: ParentChildRow[];
  pendingApproval: ParentTaskRow[];
  rewards: ParentRewardRow[];
  pendingRedemptions: ParentRedemptionRow[];
}

export function findParentContext(
  parentId: string,
  limits: ContextLimits,
): Promise<ParentContextRow | null> {
  return withTranslatedErrors(async () => {
    const prisma = getPrisma();

    return prisma.$transaction(async (tx) => {
      const padre = await tx.user.findUnique({
        where: { id: parentId },
        select: { name: true },
      });

      if (padre === null) {
        return null;
      }

      const [hijos, porAprobar, premios, canjes, pendientesPorHijo] = await Promise.all([
        tx.childProfile.findMany({
          where: { parentId, deletedAt: null },
          select: { id: true, name: true, age: true, coins: true },
          orderBy: [{ createdAt: "asc" }, { id: "asc" }],
        }),

        tx.task.findMany({
          where: { parentId, status: "COMPLETED" },
          select: { title: true, coins: true, child: { select: { name: true } } },
          orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
          take: limits.tasks,
        }),
        tx.reward.findMany({
          where: { parentId, isActive: true },
          select: { title: true, _count: { select: { assignments: true } } },
          orderBy: [{ createdAt: "desc" }, { id: "desc" }],
          take: limits.rewards,
        }),
        tx.rewardRedemption.findMany({
          where: { status: "PENDING", reward: { parentId } },
          select: {
            coins: true,
            child: { select: { name: true } },
            reward: { select: { title: true } },
          },
          orderBy: [{ createdAt: "desc" }, { id: "desc" }],
          take: limits.redemptions,
        }),
        tx.task.groupBy({
          by: ["childId"],
          where: { parentId, status: "PENDING" },
          _count: { _all: true },
        }),
      ]);

      const pendientes = new Map(
        pendientesPorHijo.map((fila) => [fila.childId, fila._count._all]),
      );

      return {
        name: padre.name,
        children: hijos.map((hijo) => ({
          name: hijo.name,
          age: hijo.age,
          coins: hijo.coins,
          pendingTasks: pendientes.get(hijo.id) ?? 0,
        })),
        pendingApproval: porAprobar.map((tarea) => ({
          childName: tarea.child.name,
          title: tarea.title,
          coins: tarea.coins,
        })),
        rewards: premios.map((premio) => ({
          title: premio.title,
          offers: premio._count.assignments,
        })),
        pendingRedemptions: canjes.map((canje) => ({
          childName: canje.child.name,
          rewardTitle: canje.reward.title,
          coins: canje.coins,
        })),
      };
    });
  });
}
