import { messages } from "../../shared/messages/index.js";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "../../shared/errors/domain-errors.js";

/**
 * Errores de dominio del módulo `children`.
 *
 * Todos extienden los de `shared/errors`, así que heredan su estado HTTP sin
 * escribir una línea de mapeo. Lo único que aportan es un mensaje del catálogo.
 */

/**
 * El hijo no existe, no es de esta familia, o está dado de baja.
 *
 * Los TRES casos dan lo mismo, y es deliberado: un 403 sobre el identificador
 * de un hijo ajeno confirmaría que ese perfil existe. Ver la decisión 4 del
 * design de `add-children`.
 */
export class ChildNotFoundError extends NotFoundError {
  constructor() {
    super(messages.children.notFound);
  }
}

/**
 * La familia ya tiene el máximo de hijos activos.
 *
 * Es un límite de política, no de integridad: lo impone el servicio y no el
 * motor, porque excederlo no corrompe nada.
 */
export class MaxChildrenReachedError extends ConflictError {
  constructor() {
    super(messages.children.maxReached);
  }
}

/** La operación es de gestión y exige el perfil del adulto. */
export class ParentRoleRequiredError extends ForbiddenError {
  constructor() {
    super(messages.children.parentRoleRequired);
  }
}

/** La operación es la vista propia de un niño y exige su perfil. */
export class ChildRoleRequiredError extends ForbiddenError {
  constructor() {
    super(messages.children.childRoleRequired);
  }
}

/**
 * La foto que se confirma como avatar no es de este perfil, o nunca llegó a
 * subirse.
 *
 * Es 422 y no 404: lo que falla es el dato que viene en la petición, no el
 * perfil sobre el que se opera —ese ya se comprobó y es suyo—.
 */
export class InvalidAvatarUploadError extends ValidationError {
  constructor() {
    super(
      [{ field: "avatarUploadKey", code: "invalid_upload", message: messages.children.invalidAvatarUpload }],
      messages.children.invalidAvatarUpload,
    );
  }
}
