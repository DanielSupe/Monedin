import { ERROR_CODES, type ErrorCode, type FieldError } from "@monedin/contracts";
import { messages } from "../messages/index.js";

export abstract class DomainError extends Error {
  abstract readonly code: ErrorCode;

  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export class NotFoundError extends DomainError {
  readonly code = ERROR_CODES.NOT_FOUND;

  constructor(message: string = messages.errors.notFound) {
    super(message);
  }
}

export class ForbiddenError extends DomainError {
  readonly code = ERROR_CODES.FORBIDDEN;

  constructor(message: string = messages.errors.forbidden) {
    super(message);
  }
}

export class UnauthorizedError extends DomainError {
  readonly code = ERROR_CODES.UNAUTHORIZED;

  constructor(message: string = messages.errors.unauthorized) {
    super(message);
  }
}

export class ConflictError extends DomainError {
  readonly code = ERROR_CODES.CONFLICT;

  constructor(message: string = messages.errors.conflict) {
    super(message);
  }
}

export class ValidationError extends DomainError {
  readonly code = ERROR_CODES.VALIDATION_ERROR;

  constructor(
    readonly fields: FieldError[],
    message: string = messages.errors.validation,
  ) {
    super(message);
  }
}

export class TooManyAttemptsError extends DomainError {
  readonly code = ERROR_CODES.TOO_MANY_ATTEMPTS;

  constructor(
    readonly retryAt: Date,
    message: string = messages.errors.tooManyAttempts,
  ) {
    super(message);
  }
}

export class ServiceUnavailableError extends DomainError {
  readonly code = ERROR_CODES.SERVICE_UNAVAILABLE;

  constructor(message: string = messages.errors.serviceUnavailable) {
    super(message);
  }
}

export class RouteNotFoundError extends DomainError {
  readonly code = ERROR_CODES.ROUTE_NOT_FOUND;

  constructor(message: string = messages.errors.routeNotFound) {
    super(message);
  }
}
