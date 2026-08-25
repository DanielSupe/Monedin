import type { RedemptionStatus } from "@monedin/contracts";
import { applyCoinMovement, getPrisma, withTranslatedErrors } from "../../shared/database/index.js";
import { RedemptionTransitionConflictError } from "./redemptions.errors.js";

/**
 * Capa de datos del módulo `redemptions`.
 *
 * ÚNICO archivo del módulo que toca Prisma. No sabe de roles ni de
 * pertenencia: eso lo comprueba el servicio, con el actor, antes de llamar
 * aquí. `approve()` es una copia literal de `tasks.repository.approve()`, con
 * `amount` negativo y sin comprobación de saldo propia: `applyCoinMovement` ya
 * la hace de forma atómica. Ver la decisión 1 del design de `add-redemptions`.
 */

/** Los campos que devuelve cualquier lectura de un canje para el padre. */
const REDEMPTION_FIELDS = {
  id: true,
  coins: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  reward: { select: { id: true, title: true } },
  child: { select: { id: true, name: true, avatar: true } },
} as const;

/** Un canje tal como sale de la base, con el hijo que lo solicitó. */
export interface RedemptionRow {
  id: string;
  coins: number;
  status: RedemptionStatus;
  createdAt: Date;
  updatedAt: Date;
  reward: { id: string; title: string };
  child: { id: string; name: string; avatar: string | null };
}

/** Filtros del listado. */
export interface RedemptionFilters {
  status?: RedemptionStatus;
  childId?: string;
}

/** Lo que hace falta para decidir si un premio se le puede ofrecer a un hijo. */
export interface OfferForChild {
  coins: number;
  rewardIsActive: boolean;
  childBalance: number;
}

// ---------------------------------------------------------------------------
// Alta
// ---------------------------------------------------------------------------

/**
 * La oferta vigente de un premio a un hijo, con el estado del premio y el
 * saldo del hijo en el mismo viaje.
 *
 * Una sola lectura por la clave compuesta `rewardId_childId`: es lo que
 * resuelve, de una vez, las tres comprobaciones del alta (el premio existe y
 * está activo, le fue ofertado a este hijo, y su saldo alcanza).
 */
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

/** Si ya hay una solicitud `PENDING` de ese mismo premio para ese mismo hijo. */
export function existsPendingRedemption(rewardId: string, childId: string): Promise<boolean> {
  return withTranslatedErrors(async () => {
    const found = await getPrisma().rewardRedemption.findFirst({
      where: { rewardId, childId, status: "PENDING" },
      select: { id: true },
    });

    return found !== null;
  });
}

/** Crea la solicitud. Una sola fila, sin transacción. */
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

// ---------------------------------------------------------------------------
// Lecturas
// ---------------------------------------------------------------------------

/**
 * Un canje por identificador, con `parentId` (del hijo que lo solicitó) para
 * que el SERVICIO decida pertenencia. El repositorio no sabe de eso.
 */
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

/**
 * Una página de la bandeja del padre, con el total sin paginar.
 *
 * Contar y leer van en la MISMA transacción, y el `orderBy` desempata por
 * `id`: mismas dos razones de siempre del patrón de paginación.
 */
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

/** Una página de los canjes propios de un niño, mismo patrón. */
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

// ---------------------------------------------------------------------------
// Transiciones
// ---------------------------------------------------------------------------

/**
 * Mueve un canje de un estado a otro, con el estado de ORIGEN en la
 * condición. Copia de `tasks.repository.transition`. La usa el rechazo, que
 * no mueve monedas.
 */
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

/**
 * Aprueba un canje Y descuenta sus monedas, o no hace ninguna de las dos
 * cosas. Copia literal de `tasks.repository.approve()`, con `amount`
 * negativo.
 *
 * `applyCoinMovement` ya comprueba el saldo de forma atómica dentro de su
 * propio `updateMany` condicional: si no alcanza, o si el hijo fue dado de
 * baja mientras tanto, lanza su `ConflictError` genérico, y aquí NO se
 * captura — se deja subir tal cual. Ver la decisión 3 del design.
 */
export function approve(redemptionId: string, childId: string, coins: number): Promise<RedemptionRow> {
  return withTranslatedErrors(() =>
    getPrisma().$transaction(async (tx) => {
      // 1. La transición, condicionada a que siga pendiente.
      const affected = await tx.rewardRedemption.updateMany({
        where: { id: redemptionId, status: "PENDING" },
        data: { status: "APPROVED" },
      });

      if (affected.count !== 1) {
        throw new RedemptionTransitionConflictError();
      }

      // 2. Y solo entonces, el descuento. Su propio saldo insuficiente sube tal cual.
      await applyCoinMovement(tx, {
        childId,
        amount: -coins,
        reason: "REDEMPTION_APPROVED",
        redemptionId,
      });

      // 3. El canje ya aprobado, leído dentro de la misma transacción.
      return tx.rewardRedemption.findUniqueOrThrow({
        where: { id: redemptionId },
        select: REDEMPTION_FIELDS,
      });
    }),
  );
}
