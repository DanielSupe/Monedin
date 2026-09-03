import { messages } from "../../shared/messages/index.js";
import { ForbiddenError, NotFoundError } from "../../shared/errors/domain-errors.js";

/**
 * Errores de dominio del módulo `coins`.
 *
 * Extienden los de `shared/errors`, así que heredan su estado HTTP sin escribir
 * una línea de mapeo.
 */

/**
 * El hijo cuyo historial se pide no existe, no es de esta familia, o está dado
 * de baja.
 *
 * Los tres casos dan lo mismo, y es deliberado: un 403 sobre el identificador de
 * un hijo ajeno confirmaría que ese perfil existe. Mismo criterio que
 * `ChildNotFoundError` en `children`, y aquí pesa más — un historial es el
 * registro más detallado de lo que otro niño ha hecho y ha gastado, y los
 * hermanos comparten la tablet.
 */
export class CoinHistoryNotFoundError extends NotFoundError {
  constructor() {
    super(messages.coins.notFound);
  }
}

/** La operación es del padre y quien llama no lo es. */
export class ParentRoleRequiredError extends ForbiddenError {
  constructor() {
    super(messages.coins.forbidden);
  }
}

/** La operación es del niño y quien llama no lo es. */
export class ChildRoleRequiredError extends ForbiddenError {
  constructor() {
    super(messages.coins.forbidden);
  }
}
