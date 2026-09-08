import { ERROR_CODES, type ErrorCode, type FieldError } from "@monedin/contracts";
import { messages } from "../messages/index.js";

/**
 * Error de dominio.
 *
 * NO sabe nada de HTTP: no lleva estado, ni cabeceras, ni nada del transporte.
 * La capa de negocio lanza estos errores y un único traductor los convierte en
 * respuesta. Ver la spec `api-error-contract`.
 */
export abstract class DomainError extends Error {
  abstract readonly code: ErrorCode;

  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

/** El recurso solicitado no existe, o el actor no debe saber que existe. */
export class NotFoundError extends DomainError {
  readonly code = ERROR_CODES.NOT_FOUND;

  constructor(message: string = messages.errors.notFound) {
    super(message);
  }
}

/** El actor está autenticado pero no puede operar sobre este recurso. */
export class ForbiddenError extends DomainError {
  readonly code = ERROR_CODES.FORBIDDEN;

  constructor(message: string = messages.errors.forbidden) {
    super(message);
  }
}

/** No hay sesión. Distinto de no tener permiso. */
export class UnauthorizedError extends DomainError {
  readonly code = ERROR_CODES.UNAUTHORIZED;

  constructor(message: string = messages.errors.unauthorized) {
    super(message);
  }
}

/** La operación choca con el estado actual del recurso. */
export class ConflictError extends DomainError {
  readonly code = ERROR_CODES.CONFLICT;

  constructor(message: string = messages.errors.conflict) {
    super(message);
  }
}

/** La entrada no cumple las reglas. Lleva el detalle campo a campo. */
export class ValidationError extends DomainError {
  readonly code = ERROR_CODES.VALIDATION_ERROR;

  constructor(
    readonly fields: FieldError[],
    message: string = messages.errors.validation,
  ) {
    super(message);
  }
}

/**
 * Se agotaron los intentos permitidos y hay un bloqueo activo.
 *
 * Es distinto de `UnauthorizedError` a propósito. Ver la spec
 * `api-error-contract`.
 */
export class TooManyAttemptsError extends DomainError {
  readonly code = ERROR_CODES.TOO_MANY_ATTEMPTS;

  constructor(
    /** Cuándo se podrá volver a intentar. */
    readonly retryAt: Date,
    message: string = messages.errors.tooManyAttempts,
  ) {
    super(message);
  }
}

/**
 * Un servicio del que la API depende no pudo atender la petición.
 *
 * NO es un `INTERNAL_ERROR`, y la diferencia no es cosmética. Un 500 afirma dos
 * cosas falsas: que el problema es nuestro —así que emite un identificador de
 * incidente que no lleva a ninguna parte, porque no hay nada que investigar— y,
 * para el cliente, que lo único que puede decir es «algo salió mal», cuando lo
 * cierto es «vuelve a intentarlo en un rato». Es el mismo argumento por el que
 * un 409 se pinta en ámbar: nadie hizo nada mal.
 *
 * Tampoco es `TooManyAttemptsError`. Aquel significa que QUIEN LLAMA agotó sus
 * intentos y está bloqueado, lleva `retryAt` y existe para el bloqueo de un
 * PIN. Una cuota agotada es nuestra, no de quien pregunta.
 */
export class ServiceUnavailableError extends DomainError {
  readonly code = ERROR_CODES.SERVICE_UNAVAILABLE;

  constructor(message: string = messages.errors.serviceUnavailable) {
    super(message);
  }
}

/** La ruta pedida no está registrada en la API. */
export class RouteNotFoundError extends DomainError {
  readonly code = ERROR_CODES.ROUTE_NOT_FOUND;

  constructor(message: string = messages.errors.routeNotFound) {
    super(message);
  }
}
