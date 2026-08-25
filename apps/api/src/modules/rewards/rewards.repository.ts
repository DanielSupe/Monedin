import { getPrisma, withTranslatedErrors } from "../../shared/database/index.js";

/**
 * Capa de datos del módulo `rewards`.
 *
 * ÚNICO archivo del módulo que toca Prisma. No sabe de roles ni de
 * pertenencia: eso lo comprueba el servicio, con el actor, antes de llamar
 * aquí. Lo único que este archivo decide es si una operación condicional
 * encontró el estado del que decía partir.
 *
 * Este módulo no mueve monedas: no hay `applyCoinMovement`, ni transición
 * condicional que pueda perder una carrera de doble tap. Eso vuelve en
 * `add-redemptions`. Ver el Context del design.
 */

/** Un hijo con lo que le cuesta A ÉL, tal como sale de la base. */
export interface RewardOfferRow {
  coins: number;
  child: { id: string; name: string; avatar: string | null };
}

/** Un premio tal como sale de la base, con TODAS sus ofertas. */
export interface RewardRow {
  id: string;
  title: string;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  offers: RewardOfferRow[];
}

/** Un premio desde el lado del hijo al que se le ofrece: solo SU precio. */
export interface OwnRewardRow {
  id: string;
  title: string;
  description: string | null;
  coins: number;
  createdAt: Date;
}

/** Los campos que devuelve cualquier lectura de un premio para el padre. */
const REWARD_FIELDS = {
  id: true,
  title: true,
  description: true,
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

/** La forma que devuelve Prisma con `REWARD_FIELDS`, antes de renombrar. */
interface RewardSelection {
  id: string;
  title: string;
  description: string | null;
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
    isActive: reward.isActive,
    createdAt: reward.createdAt,
    updatedAt: reward.updatedAt,
    offers: reward.assignments,
  };
}

// ---------------------------------------------------------------------------
// Alta
// ---------------------------------------------------------------------------

/**
 * Crea un premio con TODAS sus ofertas de una vez.
 *
 * Es una escritura anidada de Prisma: el premio y sus asignaciones se crean en
 * la MISMA operación, así que o entran las dos cosas o no entra ninguna. No
 * hace falta un `$transaction` explícito para esto en concreto —una única
 * escritura anidada ya es atómica—, a diferencia del reemplazo de más abajo,
 * que sí son dos operaciones distintas.
 */
export function createReward(data: {
  parentId: string;
  title: string;
  description?: string;
  assignments: Array<{ childId: string; coins: number }>;
}): Promise<RewardRow> {
  return withTranslatedErrors(async () => {
    const reward = await getPrisma().reward.create({
      data: {
        parentId: data.parentId,
        title: data.title,
        // `exactOptionalPropertyTypes` no admite pasar `undefined` explícito.
        ...(data.description === undefined ? {} : { description: data.description }),
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

/**
 * De los identificadores pedidos, cuáles son hijos ACTIVOS de este padre.
 *
 * Mismo patrón que `tasks.repository.findChildIdsOwnedBy`: los tres casos que
 * hacen que un identificador no salga —no existe, es de otra familia, está
 * dado de baja— son indistinguibles desde fuera, y es deliberado. No se
 * reutiliza la de `tasks` porque cada módulo es el único que toca Prisma
 * dentro de sí mismo; `children` todavía no expone una equivalente. Ver la
 * tarea 3.3 del change.
 */
export function findChildIdsOwnedBy(parentId: string, childIds: string[]): Promise<string[]> {
  return withTranslatedErrors(async () => {
    const rows = await getPrisma().childProfile.findMany({
      where: { id: { in: childIds }, parentId, deletedAt: null },
      select: { id: true },
    });

    return rows.map((row) => row.id);
  });
}

// ---------------------------------------------------------------------------
// Lecturas del padre
// ---------------------------------------------------------------------------

/**
 * Una página del catálogo del padre, con el total sin paginar.
 *
 * Contar y leer van en la MISMA transacción, y el `orderBy` desempata por
 * `id`: mismas dos razones de siempre del patrón de paginación.
 */
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

/**
 * Un premio por identificador, con TODAS sus ofertas y `parentId`.
 *
 * Devuelve `parentId` a propósito, porque el SERVICIO es quien decide qué
 * significa: para el padre, si es suyo; para el niño, si una de las ofertas es
 * la suya. El repositorio no sabe de pertenencia.
 */
export function findRewardById(id: string): Promise<(RewardRow & { parentId: string }) | null> {
  return withTranslatedErrors(async () => {
    const reward = await getPrisma().reward.findUnique({
      where: { id },
      select: { ...REWARD_FIELDS, parentId: true },
    });

    return reward === null ? null : { ...toRewardRow(reward), parentId: reward.parentId };
  });
}

// ---------------------------------------------------------------------------
// Lecturas del niño
// ---------------------------------------------------------------------------

/**
 * Una página del escaparate de un niño: solo premios ACTIVOS ofrecidos a él,
 * con SU precio.
 *
 * El saldo se lee en la MISMA transacción que la página, para que
 * `affordable` no se calcule contra un saldo de hace dos consultas. Ver la
 * decisión 5 del design.
 *
 * El desempate ordena por cuándo se publicó el PREMIO, no por cuándo se creó
 * la oferta: reemplazar el conjunto de ofertas reinicia el `createdAt` de la
 * asignación (decisión 3 del design), y nada debe depender de ese valor.
 */
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
          reward: { select: { id: true, title: true, description: true, createdAt: true } },
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
        coins: assignment.coins,
        createdAt: assignment.reward.createdAt,
      })),
      total,
      balance: child.coins,
    };
  });
}

/**
 * El saldo actual de un hijo. Para el detalle propio de un solo premio: la
 * página lo lee dentro de su propia transacción, pero un ítem suelto no la
 * necesita.
 *
 * `findUniqueOrThrow`: el actor sale de una sesión activa, y dar de baja a un
 * hijo revoca sus sesiones. Que no exista aquí es inalcanzable en la práctica.
 */
export function findChildBalance(childId: string): Promise<number> {
  return withTranslatedErrors(async () => {
    const child = await getPrisma().childProfile.findUniqueOrThrow({
      where: { id: childId },
      select: { coins: true },
    });

    return child.coins;
  });
}

// ---------------------------------------------------------------------------
// Edición
// ---------------------------------------------------------------------------

/** Cambia título y/o descripción. Nunca el precio: eso es `replaceAssignments`. */
export function updateReward(
  id: string,
  data: { title?: string | undefined; description?: string | null | undefined },
): Promise<RewardRow> {
  return withTranslatedErrors(async () => {
    const reward = await getPrisma().reward.update({
      where: { id },
      data: {
        ...(data.title === undefined ? {} : { title: data.title }),
        ...(data.description === undefined ? {} : { description: data.description }),
      },
      select: REWARD_FIELDS,
    });

    return toRewardRow(reward);
  });
}

/**
 * Reemplaza el conjunto COMPLETO de ofertas de un premio: borra todas las que
 * tenía y crea las del conjunto nuevo, en una transacción.
 *
 * Y no un `upsert` por hijo calculando la diferencia: una asignación no lleva
 * historial, nadie la referencia —`RewardRedemption` congela su propio precio
 * apuntando al premio y al hijo, no a la asignación— así que borrarla y
 * recrearla es indistinguible de haberla actualizado. Ver la decisión 3 del
 * design. Un conjunto vacío es válido: retira la oferta a todos sin retirar el
 * premio.
 */
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

/**
 * Retira un premio, condicionado a que siguiera activo. Devuelve cuántas
 * filas cambió.
 *
 * Es el mismo mecanismo que la baja de un hijo: `updateMany` con el estado de
 * ORIGEN en el `WHERE`, para que dos retiros simultáneos no se pisen. Cero
 * filas es 404 y no 409: retirar no mueve monedas, así que quien pierde la
 * carrera pregunta por un premio que ya no está activo. Ver la decisión 4.
 */
export function retireReward(id: string): Promise<number> {
  return withTranslatedErrors(async () => {
    const result = await getPrisma().reward.updateMany({
      where: { id, isActive: true },
      data: { isActive: false },
    });
    return result.count;
  });
}
