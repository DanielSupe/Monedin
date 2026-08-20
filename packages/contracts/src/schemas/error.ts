import { z } from "zod";

/**
 * Codigos de error de la API.
 *
 * El codigo es la parte ESTABLE del contrato: el front decide que hacer mirando
 * unicamente el codigo. El mensaje es texto y puede reescribirse sin romper a
 * nadie. Ver la spec `api-error-contract`.
 */
export const ERROR_CODES = {
  /** No hay sesion. 401. */
  UNAUTHORIZED: "UNAUTHORIZED",
  /** Hay sesion, pero el actor no puede operar sobre el recurso. 403. */
  FORBIDDEN: "FORBIDDEN",
  /** El recurso solicitado no existe. 404. */
  NOT_FOUND: "NOT_FOUND",
  /** La ruta no esta registrada en la API. 404. */
  ROUTE_NOT_FOUND: "ROUTE_NOT_FOUND",
  /** La operacion choca con el estado actual del recurso. 409. */
  CONFLICT: "CONFLICT",
  /** La entrada no cumple su esquema. 422, con detalle por campo. */
  VALIDATION_ERROR: "VALIDATION_ERROR",
  /** Fallo no previsto. 500, con identificador de incidente. */
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

/** Detalle de un campo que no supero la validacion. */
export const fieldErrorSchema = z.object({
  /** Ruta del campo dentro del cuerpo, p. ej. `assignments.0.coins`. */
  field: z.string(),
  /** Motivo legible por maquina, proveniente del esquema. */
  code: z.string(),
  /** Motivo legible por humanos, en espanol. */
  message: z.string(),
});

export type FieldError = z.infer<typeof fieldErrorSchema>;

/**
 * Cuerpo de TODA respuesta de error de la API, sea 4xx o 5xx.
 *
 * La forma es identica en todos los endpoints. `details` solo aparece en errores
 * de validacion; `incidentId` solo en errores inesperados.
 */
export const apiErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.array(fieldErrorSchema).optional(),
  incidentId: z.string().optional(),
});

export type ApiError = z.infer<typeof apiErrorSchema>;
