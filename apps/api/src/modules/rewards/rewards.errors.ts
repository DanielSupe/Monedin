import { ForbiddenError, NotFoundError, ValidationError } from "../../shared/errors/domain-errors.js";
import { messages } from "../../shared/messages/index.js";

/**
 * Errores de dominio del módulo `rewards`.
 *
 * Todos extienden los de `shared/errors`, así que heredan su estado HTTP sin
 * escribir una línea de mapeo. Lo único que aportan es un mensaje del catálogo.
 *
 * No hay un error de conflicto propio del módulo: retirar un premio no mueve
 * monedas, así que perder la carrera de un doble tap es un 404 y no un 409.
 * Ver la decisión 4 del design de `add-rewards`.
 */

/**
 * El premio no existe, es de otra familia, no se le ofrece a este niño, o ya
 * estaba retirado cuando se intentó retirar de nuevo.
 *
 * Los mismos casos dan lo mismo a propósito: un 403 sobre el identificador de
 * un premio ajeno confirmaría que ese premio existe. Es la misma regla que en
 * `children` y en `tasks`.
 */
export class RewardNotFoundError extends NotFoundError {
  constructor() {
    super(messages.rewards.notFound);
  }
}

/** Publicar, editar, reemplazar ofertas y retirar son cosa del adulto. */
export class ParentRoleRequiredError extends ForbiddenError {
  constructor() {
    super(messages.rewards.parentRoleRequired);
  }
}

/** El escaparate propio lo ve un niño sobre su propio perfil. */
export class ChildRoleRequiredError extends ForbiddenError {
  constructor() {
    super(messages.rewards.childRoleRequired);
  }
}

/** La foto que se confirma no es de este premio, o nunca llegó a subirse. */
export class InvalidImageUploadError extends ValidationError {
  constructor() {
    super(
      [{ field: "imageUploadKey", code: "invalid_upload", message: messages.rewards.invalidImageUpload }],
      messages.rewards.invalidImageUpload,
    );
  }
}
