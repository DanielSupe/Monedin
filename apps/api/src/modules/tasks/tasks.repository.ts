import type { TaskStatus } from "@monedin/contracts";
import { applyCoinMovement, getPrisma, withTranslatedErrors } from "../../shared/database/index.js";
import { TaskTransitionConflictError } from "./tasks.errors.js";

const TASK_FIELDS = {
  id: true,
  batchId: true,
  title: true,
  description: true,
  coins: true,
  status: true,
  dueDate: true,
  evidenceKey: true,
  createdAt: true,
  updatedAt: true,
  child: { select: { id: true, name: true, avatar: true } },
} as const;

const OWN_TASK_FIELDS = {
  id: true,
  title: true,
  description: true,
  coins: true,
  status: true,
  dueDate: true,
  evidenceKey: true,
  createdAt: true,
} as const;

export interface TaskRow {
  id: string;
  batchId: string;
  title: string;
  description: string | null;
  coins: number;
  status: TaskStatus;
  dueDate: Date | null;

  evidenceKey: string | null;
  createdAt: Date;
  updatedAt: Date;
  child: { id: string; name: string; avatar: string | null };
}

export interface OwnTaskRow {
  id: string;
  title: string;
  description: string | null;
  coins: number;
  status: TaskStatus;
  dueDate: Date | null;
  evidenceKey: string | null;
  createdAt: Date;
}

export interface TaskFilters {
  status?: TaskStatus;
  childId?: string;
}

export function createBatch(data: {
  parentId: string;
  batchId: string;
  title: string;
  description?: string;
  dueDate?: Date;
  assignments: Array<{ childId: string; coins: number }>;
}): Promise<TaskRow[]> {
  return withTranslatedErrors(async () => {
    const prisma = getPrisma();

    await prisma.task.createMany({
      data: data.assignments.map((assignment) => ({
        parentId: data.parentId,
        batchId: data.batchId,
        title: data.title,
        childId: assignment.childId,
        coins: assignment.coins,

        ...(data.description === undefined ? {} : { description: data.description }),
        ...(data.dueDate === undefined ? {} : { dueDate: data.dueDate }),
      })),
    });

    return prisma.task.findMany({
      where: { batchId: data.batchId },
      select: TASK_FIELDS,
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    });
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

export function findTaskById(id: string): Promise<(TaskRow & { parentId: string }) | null> {
  return withTranslatedErrors(() =>
    getPrisma().task.findUnique({
      where: { id },
      select: { ...TASK_FIELDS, parentId: true },
    }),
  );
}

export function findTaskBatchesPage(
  parentId: string,
  filters: TaskFilters,
  { skip, take }: { skip: number; take: number },
): Promise<{ batches: Array<{ batchId: string }>; tasks: TaskRow[]; total: number }> {
  return withTranslatedErrors(() => {
    const where = {
      parentId,
      ...(filters.status === undefined ? {} : { status: filters.status }),
      ...(filters.childId === undefined ? {} : { childId: filters.childId }),
    };

    return getPrisma().$transaction(async (tx) => {
      const page = await tx.task.groupBy({
        by: ["batchId"],
        where,
        _min: { createdAt: true },
        orderBy: [{ _min: { createdAt: "desc" } }, { batchId: "desc" }],
        skip,
        take,
      });

      const todos = await tx.task.groupBy({ by: ["batchId"], where });

      const batchIds = page.map((group) => group.batchId);

      const tasks =
        batchIds.length === 0
          ? []
          : await tx.task.findMany({
              where: {
                parentId,
                batchId: { in: batchIds },
                ...(filters.childId === undefined ? {} : { childId: filters.childId }),
              },
              select: TASK_FIELDS,
              orderBy: [{ createdAt: "asc" }, { id: "asc" }],
            });

      return { batches: page.map(({ batchId }) => ({ batchId })), tasks, total: todos.length };
    });
  });
}

export function findOwnTasksPage(
  childId: string,
  filters: { status?: TaskStatus },
  { skip, take }: { skip: number; take: number },
): Promise<{ items: OwnTaskRow[]; total: number }> {
  return withTranslatedErrors(async () => {
    const prisma = getPrisma();
    const where = {
      childId,
      ...(filters.status === undefined ? {} : { status: filters.status }),
    };

    const [items, total] = await prisma.$transaction([
      prisma.task.findMany({
        where,
        select: OWN_TASK_FIELDS,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        skip,
        take,
      }),
      prisma.task.count({ where }),
    ]);

    return { items, total };
  });
}

export function transition(
  taskId: string,
  from: TaskStatus,
  to: TaskStatus,
  extra: { evidenceKey?: string } = {},
): Promise<TaskRow> {
  return withTranslatedErrors(async () => {
    const prisma = getPrisma();

    const affected = await prisma.task.updateMany({
      where: { id: taskId, status: from },
      data: {
        status: to,
        ...(extra.evidenceKey === undefined ? {} : { evidenceKey: extra.evidenceKey }),
      },
    });

    if (affected.count !== 1) {
      throw new TaskTransitionConflictError();
    }

    return prisma.task.findUniqueOrThrow({ where: { id: taskId }, select: TASK_FIELDS });
  });
}

export function approve(taskId: string, childId: string, coins: number): Promise<TaskRow> {
  return withTranslatedErrors(() =>
    getPrisma().$transaction(async (tx) => {
      const affected = await tx.task.updateMany({
        where: { id: taskId, status: "COMPLETED" },
        data: { status: "APPROVED" },
      });

      if (affected.count !== 1) {
        throw new TaskTransitionConflictError();
      }

      await applyCoinMovement(tx, {
        childId,
        amount: coins,
        reason: "TASK_APPROVED",
        taskId,
      });

      return tx.task.findUniqueOrThrow({ where: { id: taskId }, select: TASK_FIELDS });
    }),
  );
}

export function updateTaskIfPending(
  id: string,
  data: {
    title?: string | undefined;
    description?: string | null | undefined;
    coins?: number | undefined;
    dueDate?: Date | null | undefined;
  },
): Promise<TaskRow | null> {
  return withTranslatedErrors(() =>
    getPrisma().$transaction(async (tx) => {
      const affected = await tx.task.updateMany({
        where: { id, status: "PENDING" },
        data: {
          ...(data.title === undefined ? {} : { title: data.title }),
          ...(data.description === undefined ? {} : { description: data.description }),
          ...(data.coins === undefined ? {} : { coins: data.coins }),
          ...(data.dueDate === undefined ? {} : { dueDate: data.dueDate }),
        },
      });

      if (affected.count !== 1) return null;

      return tx.task.findUniqueOrThrow({ where: { id }, select: TASK_FIELDS });
    }),
  );
}

export function deleteTaskIfPending(id: string): Promise<number> {
  return withTranslatedErrors(async () => {
    const result = await getPrisma().task.deleteMany({ where: { id, status: "PENDING" } });
    return result.count;
  });
}
