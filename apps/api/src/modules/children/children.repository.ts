import { getPrisma, withTranslatedErrors } from "../../shared/database/index.js";

/**
 * Capa de datos del módulo `children`.
 *
 * ÚNICO archivo del módulo que toca Prisma. No toca la tabla de sesiones: es de
 * `auth`, y la baja de un hijo pasa por su repositorio para revocarlas.
 *
 * Ningún `select` de este archivo incluye `pinHash`. No es una precaución
 * cosmética: es lo que hace imposible que una respuesta lo filtre por descuido.
 */

/** Un hijo tal como sale de la base, antes de resolver el avatar. */
export interface ChildRow {
  id: string;
  name: string;
  avatar: string | null;
  age: number | null;
  coins: number;
  lockedUntil: Date | null;
  createdAt: Date;
}

/** Los campos que devuelve cualquier lectura de este módulo. */
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
        // `exactOptionalPropertyTypes` no admite pasar `undefined` explícito.
        ...(data.age === undefined ? {} : { age: data.age }),
        ...(data.avatar === undefined ? {} : { avatar: data.avatar }),
      },
      select: CHILD_FIELDS,
    }),
  );
}

/** Hijos ACTIVOS de una familia. Es lo que cuenta para el tope. */
export function countActiveChildren(parentId: string): Promise<number> {
  return withTranslatedErrors(() =>
    getPrisma().childProfile.count({ where: { parentId, deletedAt: null } }),
  );
}

/**
 * Una página de hijos activos, con el total sin paginar.
 *
 * Dos cosas que son parte del patrón y no adorno:
 *
 * 1. Contar y leer van en la MISMA transacción. Sin ella, un alta concurrente
 *    entre las dos consultas deja `total` e `items` contradiciéndose.
 * 2. El `orderBy` desempata por `id`. `createdAt` NO es único, y dos filas
 *    creadas en el mismo milisegundo tienen orden indefinido: sin desempate,
 *    una fila puede salir en dos páginas o en ninguna. Es el bug clásico de la
 *    paginación por desplazamiento.
 */
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

/**
 * Un hijo por identificador, con lo necesario para decidir si es tuyo.
 *
 * Devuelve `parentId` y `deletedAt` a propósito, porque el SERVICIO es quien
 * decide qué significan. El repositorio no sabe de pertenencia.
 */
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
  // `| undefined` explícito porque `exactOptionalPropertyTypes` distingue entre
  // «campo ausente» y «campo presente valiendo undefined», y lo que llega del
  // esquema de edición es lo segundo. `age: null` sí es significativo: borra.
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

/**
 * Baja lógica, condicionada a que siga activo.
 *
 * Se escribe con `updateMany` y `deletedAt: null` en el WHERE para que dos
 * bajas simultáneas no se pisen la fecha: la segunda afecta a CERO filas y el
 * servicio lo traduce a «ese hijo ya no existe».
 *
 * Devuelve cuántas filas cambió, que es lo que hay que comprobar.
 */
export function deactivateChild(id: string): Promise<number> {
  return withTranslatedErrors(async () => {
    const result = await getPrisma().childProfile.updateMany({
      where: { id, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    return result.count;
  });
}
