import { ConflictError, ForbiddenError, NotFoundError } from "../../shared/errors/domain-errors.js";
import { messages } from "../../shared/messages/index.js";

/**
 * Errores de dominio del módulo `redemptions`.
 *
 * Todos extienden los de `shared/errors`, así que heredan su estado HTTP sin
 * escribir una línea de mapeo. Lo único que aportan es un mensaje del catálogo.
 *
 * El saldo insuficiente AL APROBAR no tiene clase propia: es el `ConflictError`
 * genérico que ya lanza `applyCoinMovement` cuando su descuento condicional no
 * afecta ninguna fila. Envolverlo mentiría en el otro caso que produce el mismo
 * error —el hijo dado de baja entre solicitar y aprobar—, porque
 * `applyCoinMovement` no distingue las dos causas en su propio código. Ver la
 * decisión 3 del design de `add-redemptions`.
 */

/**
 * El canje no existe, es de otra familia, o es de un hermano.
 *
 * Los tres casos dan lo mismo a propósito: un 403 sobre el identificador de un
 * canje ajeno confirmaría que ese canje existe. Misma regla que en `children`,
 * `tasks` y `rewards`.
 */
export class RedemptionNotFoundError extends NotFoundError {
  constructor() {
    super(messages.redemptions.notFound);
  }
}

/**
 * La transición (aprobar o rechazar) no encontró el estado `PENDING` del que
 * decía partir: alguien ya lo resolvió, o ganó la carrera de un doble tap.
 */
export class RedemptionTransitionConflictError extends ConflictError {
  constructor() {
    super(messages.redemptions.transitionConflict);
  }
}

/**
 * El saldo del niño no cubre el precio AL SOLICITAR.
 *
 * Es un límite de política comprobado antes de escribir la fila —mismo
 * argumento que `MaxChildrenReachedError` en `children`—, no una validación de
 * forma de entrada. Ver la decisión 2 del design.
 */
export class InsufficientBalanceError extends ConflictError {
  constructor() {
    super(messages.redemptions.insufficientBalance);
  }
}

/** Ya existe una solicitud `PENDING` del mismo premio para ese hijo. */
export class DuplicatePendingRedemptionError extends ConflictError {
  constructor() {
    super(messages.redemptions.duplicatePending);
  }
}

/** Aprobar y rechazar son cosa del adulto. */
export class ParentRoleRequiredError extends ForbiddenError {
  constructor() {
    super(messages.redemptions.parentRoleRequired);
  }
}

/** Solicitar un canje y ver la lista propia lo hace el niño. */
export class ChildRoleRequiredError extends ForbiddenError {
  constructor() {
    super(messages.redemptions.childRoleRequired);
  }
}
