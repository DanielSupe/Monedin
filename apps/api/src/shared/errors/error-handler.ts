import { randomUUID } from "node:crypto";
import { ERROR_CODES, type ApiError } from "@monedin/contracts";
import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { logger } from "../logger/index.js";
import { messages } from "../messages/index.js";
import { DomainError, ValidationError } from "./domain-errors.js";
import { HTTP_STATUS_BY_ERROR_CODE } from "./http-status.js";
import { zodToFieldErrors } from "./zod-to-field-errors.js";

export const errorHandler: ErrorRequestHandler = (error, _req, res, next) => {
  if (res.headersSent) {
    next(error);
    return;
  }

  if (error instanceof ValidationError) {
    const body: ApiError = {
      code: error.code,
      message: error.message,
      details: error.fields,
    };
    res.status(HTTP_STATUS_BY_ERROR_CODE[error.code]).json(body);
    return;
  }

  if (error instanceof ZodError) {
    const body: ApiError = {
      code: ERROR_CODES.VALIDATION_ERROR,
      message: messages.errors.validation,
      details: zodToFieldErrors(error),
    };
    res.status(HTTP_STATUS_BY_ERROR_CODE[ERROR_CODES.VALIDATION_ERROR]).json(body);
    return;
  }

  if (isBodyParseError(error)) {
    const body: ApiError = {
      code: ERROR_CODES.VALIDATION_ERROR,
      message: messages.errors.validation,
      details: [
        {
          field: "body",
          code: "invalid_json",
          message: "El cuerpo de la petición no es JSON válido.",
        },
      ],
    };
    res.status(HTTP_STATUS_BY_ERROR_CODE[ERROR_CODES.VALIDATION_ERROR]).json(body);
    return;
  }

  if (error instanceof DomainError) {
    const body: ApiError = { code: error.code, message: error.message };
    res.status(HTTP_STATUS_BY_ERROR_CODE[error.code]).json(body);
    return;
  }

  const incidentId = randomUUID();

  logger.error("Error no controlado", {
    incidentId,
    error: error instanceof Error ? { name: error.name, message: error.message } : error,
    stack: error instanceof Error ? error.stack : undefined,
  });

  const body: ApiError = {
    code: ERROR_CODES.INTERNAL_ERROR,
    message: messages.errors.internal,
    incidentId,
  };

  res.status(HTTP_STATUS_BY_ERROR_CODE[ERROR_CODES.INTERNAL_ERROR]).json(body);
};

function isBodyParseError(error: unknown): boolean {
  return (
    error instanceof SyntaxError &&
    "type" in error &&
    (error as { type?: unknown }).type === "entity.parse.failed"
  );
}
