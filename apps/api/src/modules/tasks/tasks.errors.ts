import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "../../shared/errors/domain-errors.js";
import { messages } from "../../shared/messages/index.js";

/**
 * Errores de dominio del módulo `tasks`.
 *
 * Todos extienden los de `shared/errors`, así que heredan su estado HTTP sin
 * escribir una línea de mapeo. Lo único que aportan es un mensaje del catálogo.
 */

/**
 * La tarea no existe, es de otra familia, o es de un hermano.
 *
 * Los tres casos dan lo mismo, y es deliberado: un 403 sobre el identificador
 * de una tarea ajena confirmaría que esa tarea existe. Es la misma regla que en
 * `children`.
 */
export class TaskNotFoundError extends NotFoundError {
  constructor() {
    super(messages.tasks.notFound);
  }
}

/**
 * Se intentó editar o borrar una tarea que ya no está pendiente.
 *
 * Es 409 y no 404: la tarea sigue ahí, lo que no encaja es su estado. Ver la
 * decisión 3 del design de `add-tasks`.
 */
export class TaskNotEditableError extends ConflictError {
  constructor() {
    super(messages.tasks.notEditable);
  }
}

/**
 * La transición no encontró el estado del que decía partir.
 *
 * Es el error que sostiene el change entero: cuando dos peticiones simultáneas
 * intentan aprobar la misma tarea, la que pierde la carrera afecta a CERO filas
 * y acaba aquí, en vez de acreditar por segunda vez.
 *
 * Las tres transiciones lo usan, también `complete` y `reject`, que no mueven
 * monedas: son transiciones y su estado de origen importa.
 */
export class TaskTransitionConflictError extends ConflictError {
  constructor() {
    super(messages.tasks.transitionConflict);
  }
}

/** Repartir, editar, borrar, aprobar y rechazar son cosa del adulto. */
export class ParentRoleRequiredError extends ForbiddenError {
  constructor() {
    super(messages.tasks.parentRoleRequired);
  }
}

/** Ver las tareas propias y marcarlas como hechas lo hace el niño. */
export class ChildRoleRequiredError extends ForbiddenError {
  constructor() {
    super(messages.tasks.childRoleRequired);
  }
}

/**
 * La evidencia adjunta no es de esta tarea, o nunca llegó a subirse.
 *
 * Se lanza ANTES de la transición, así que la tarea sigue pendiente: es
 * preferible que el niño reintente a que quede como hecha con una foto que no
 * está.
 */
export class InvalidEvidenceUploadError extends ValidationError {
  constructor() {
    super(
      [{ field: "evidenceUploadKey", code: "invalid_upload", message: messages.tasks.invalidEvidenceUpload }],
      messages.tasks.invalidEvidenceUpload,
    );
  }
}
