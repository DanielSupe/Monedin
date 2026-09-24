import { getPrisma, withTranslatedErrors } from "../../shared/database/index.js";

export interface ChildRow {
  id: string;
  name: string;
  avatar: string | null;
  age: number | null;
  coins: number;
  lockedUntil: Date | null;
  createdAt: Date;
}

const CHILD_FIELDS = {
  id: true,
  name: true,
  avatar: true,
  age: true,
  coins: true,
  lockedUntil: true,
  createdAt: true,
} as const;

export function createChild(data: {
  parentId: string;
  name: string;
  pinHash: string;
  age?: number;
  avatar?: string;
}): Promise<ChildRow> {
  return withTranslatedErrors(() =>
    getPrisma().childProfile.create({
      data: {
        parentId: data.parentId,
        name: data.name,
        pinHash: data.pinHash,

        ...(data.age === undefined ? {} : { age: data.age }),
        ...(data.avatar === undefined ? {} : { avatar: data.avatar }),
      },
      select: CHILD_FIELDS,
    }),
  );
}

export function countActiveChildren(parentId: string): Promise<number> {
  return withTranslatedErrors(() =>
    getPrisma().childProfile.count({ where: { parentId, deletedAt: null } }),
  );
}

export function findChildrenPage(
  parentId: string,
  { skip, take }: { skip: number; take: number },
): Promise<{ items: ChildRow[]; total: number }> {
  return withTranslatedErrors(async () => {
    const prisma = getPrisma();
    const where = { parentId, deletedAt: null };

    const [items, total] = await prisma.$transaction([
      prisma.childProfile.findMany({
        where,
        select: CHILD_FIELDS,
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
        skip,
        take,
      }),
      prisma.childProfile.count({ where }),
    ]);

    return { items, total };
  });
}

export function findChildById(
  id: string,
): Promise<(ChildRow & { parentId: string; deletedAt: Date | null }) | null> {
  return withTranslatedErrors(() =>
    getPrisma().childProfile.findUnique({
      where: { id },
      select: { ...CHILD_FIELDS, parentId: true, deletedAt: true },
    }),
  );
}

export function updateChild(
  id: string,

  data: { name?: string | undefined; age?: number | null | undefined; avatar?: string | undefined },
): Promise<ChildRow> {
  return withTranslatedErrors(() =>
    getPrisma().childProfile.update({
      where: { id },
      data: {
        ...(data.name === undefined ? {} : { name: data.name }),
        ...(data.age === undefined ? {} : { age: data.age }),
        ...(data.avatar === undefined ? {} : { avatar: data.avatar }),
      },
      select: CHILD_FIELDS,
    }),
  );
}

export function deactivateChild(id: string): Promise<number> {
  return withTranslatedErrors(async () => {
    const result = await getPrisma().childProfile.updateMany({
      where: { id, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    return result.count;
  });
}
