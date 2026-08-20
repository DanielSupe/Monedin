import { ERROR_CODES, type ErrorCode } from "@monedin/contracts";

/**
 * Correspondencia entre código de error y estado HTTP.
 *
 * Se define UNA sola vez y se aplica a toda la API. Un módulo nuevo que lance
 * los errores de dominio existentes obtiene el estado correcto sin escribir una
 * línea de mapeo. Ver la spec `api-error-contract`.
 */
export const HTTP_STATUS_BY_ERROR_CODE: Record<ErrorCode, number> = {
  [ERROR_CODES.UNAUTHORIZED]: 401,
  [ERROR_CODES.FORBIDDEN]: 403,
  [ERROR_CODES.NOT_FOUND]: 404,
  [ERROR_CODES.ROUTE_NOT_FOUND]: 404,
  [ERROR_CODES.CONFLICT]: 409,
  [ERROR_CODES.VALIDATION_ERROR]: 422,
  [ERROR_CODES.INTERNAL_ERROR]: 500,
};
