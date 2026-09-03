import { getPrisma, withTranslatedErrors } from "../../shared/database/index.js";

/**
 * Acceso a datos del historial de monedas.
 *
 * ÚNICO archivo del módulo que toca Prisma. Y solo LEE: la tabla es append-only
 * y un disparador de PostgreSQL hace fallar cualquier `UPDATE` o `DELETE`, así
 * que aquí no hay ni podría haber una escritura. Quien escribe es
 * `applyCoinMovement`, dentro de la transacción de quien mueve el dinero.
 */

/** Lo que el contrato necesita de una fila, y nada más. */
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

/**
 * Una página del historial de un hijo, de lo más reciente a lo más antiguo.
 *
 * Cuenta y lee en la MISMA transacción: si no, un alta concurrente entre las dos
 * consultas deja `total` e `items` contradiciéndose. Y aquí ocurre de verdad —
 * aprobar un reparto escribe varias filas a la vez.
 *
 * El `orderBy` lleva el identificador como DESEMPATE, y tampoco es teórico:
 * `createdAt` no es único y aprobar un reparto escribe sus filas dentro de la
 * misma transacción, así que comparten instante. Sin desempate, dos de ellas
 * pueden salir en dos páginas o en ninguna — el bug clásico de la paginación por
 * desplazamiento.
 */
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
