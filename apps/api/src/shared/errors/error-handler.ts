import { randomUUID } from "node:crypto";
import { ERROR_CODES, type ApiError } from "@monedin/contracts";
import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { logger } from "../logger/index.js";
import { messages } from "../messages/index.js";
import { DomainError, ValidationError } from "./domain-errors.js";
import { HTTP_STATUS_BY_ERROR_CODE } from "./http-status.js";
import { zodToFieldErrors } from "./zod-to-field-errors.js";

/**
 * Traductor ÚNICO de error a respuesta HTTP.
 *
 * Va al final de la cadena de middlewares. Es el único punto del sistema que
 * sabe convertir un fallo en estado y cuerpo; ningún módulo de dominio escribe
 * respuestas de error.
 *
 * Express 5 reenvía aquí también los errores lanzados dentro de handlers
 * asíncronos, así que no hace falta envolver cada controlador en un try/catch.
 */
export const errorHandler: ErrorRequestHandler = (error, _req, res, next) => {
  // Si la respuesta ya empezó a enviarse no se puede reescribir: que Express
  // cierre la conexión.
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

  // Un ZodError que llega hasta aquí es entrada inválida que no pasó por el
  // middleware de validación. Se trata igual: 422 con detalle por campo.
  if (error instanceof ZodError) {
    const body: ApiError = {
      code: ERROR_CODES.VALIDATION_ERROR,
      message: messages.errors.validation,
      details: zodToFieldErrors(error),
    };
    res.status(HTTP_STATUS_BY_ERROR_CODE[ERROR_CODES.VALIDATION_ERROR]).json(body);
    return;
  }

  // El parser de JSON de Express rechaza un cuerpo malformado con un
  // SyntaxError propio. Es entrada inválida como cualquier otra, así que sale
  // por 422 y con el mismo cuerpo, no con el 400 en HTML del framework.
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

  // Fallo no previsto. La respuesta lleva un mensaje genérico y un
  // identificador; el detalle completo se queda en el log del servidor bajo ese
  // mismo identificador, para poder correlacionar el reporte de un usuario.
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

/** Detecta el error que lanza `express.json()` ante un cuerpo no parseable. */
function isBodyParseError(error: unknown): boolean {
  return (
    error instanceof SyntaxError &&
    "type" in error &&
    (error as { type?: unknown }).type === "entity.parse.failed"
  );
}
