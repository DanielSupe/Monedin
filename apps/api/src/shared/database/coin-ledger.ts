import type { CoinReason } from "../../generated/prisma/enums.js";
import { ConflictError, NotFoundError } from "../errors/domain-errors.js";
import type { TransactionClient } from "./types.js";

/**
 * Operación de referencia para mover monedas.
 *
 * ESTA ES LA PLANTILLA. Todo módulo que acredite o descuente saldo pasa por
 * aquí; ninguno escribe su propia versión. Ver `CLAUDE.md`, sección 4, y la spec
 * `coin-ledger`.
 *
 * Tres cosas que hace y que son la razón de que exista:
 *
 * 1. **Modifica el saldo con `increment`**, nunca leyendo, sumando en memoria y
 *    escribiendo. Dos peticiones simultáneas escritas de la segunda forma
 *    pierden una de las dos.
 * 2. **Escribe la fila de historial en la MISMA transacción.** Recibe la
 *    transacción como primer argumento precisamente para que no se pueda llamar
 *    fuera de una.
 * 3. **Comprueba que afectó exactamente una fila.** Si el descuento no cabía en
 *    el saldo, la actualización condicional no afecta a nadie y eso es un
 *    conflicto, no un éxito silencioso. Es lo que hace que un doble tap no
 *    acredite ni descuente dos veces.
 */

export interface CoinMovement {
  childId: string;
  /** Positivo acredita, negativo descuenta. Cero no es un movimiento. */
  amount: number;
  reason: CoinReason;
  taskId?: string;
  redemptionId?: string;
}

export interface CoinMovementResult {
  balanceAfter: number;
  transactionId: string;
}

/**
 * Aplica un movimiento de monedas dentro de la transacción que se le pasa.
 *
 * @throws {ConflictError} si el hijo no está activo, o si el descuento no cabe
 *   en su saldo.
 * @throws {NotFoundError} si el hijo no existe.
 */
export async function applyCoinMovement(
  tx: TransactionClient,
  movement: CoinMovement,
): Promise<CoinMovementResult> {
  const { childId, amount, reason } = movement;

  if (amount === 0) {
    throw new ConflictError();
  }

  // Actualización CONDICIONAL. En un descuento, la condición incluye que el
  // saldo alcance: así el motor decide, de forma atómica, si la operación cabe.
  const affected = await tx.childProfile.updateMany({
    where: {
      id: childId,
      deletedAt: null,
      ...(amount < 0 ? { coins: { gte: -amount } } : {}),
    },
    data: { coins: { increment: amount } },
  });

  if (affected.count !== 1) {
    // Cero filas puede ser: el hijo no existe, está dado de baja, o el saldo no
    // llegaba. Distinguirlo importa porque el estado HTTP es distinto.
    const child = await tx.childProfile.findUnique({
      where: { id: childId },
      select: { deletedAt: true },
    });

    if (child === null) {
      throw new NotFoundError();
    }
    throw new ConflictError();
  }

  // El saldo resultante se lee dentro de la misma transacción, así que es
  // exactamente el que dejó la actualización de arriba.
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
