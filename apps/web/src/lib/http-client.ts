import { API_PREFIX, ERROR_CODES, apiErrorSchema, type FieldError } from "@monedin/contracts";
import type { ZodType } from "zod";
import { messages } from "./messages.js";

/**
 * Error de una llamada a la API, ya interpretado.
 *
 * Lo importante es `code`: quien llama decide qué hacer mirando el código, NUNCA
 * comparando el texto del mensaje. Cambiar la redacción en el catálogo de la API
 * no debe romper ninguna decisión del front.
 */
export class ApiRequestError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details: FieldError[];
  readonly incidentId: string | undefined;

  constructor(params: {
    status: number;
    code: string;
    message: string;
    details?: FieldError[];
    incidentId?: string;
  }) {
    super(params.message);
    this.name = "ApiRequestError";
    this.status = params.status;
    this.code = params.code;
    this.details = params.details ?? [];
    this.incidentId = params.incidentId;
  }
}

/**
 * Interpreta el cuerpo de una respuesta de error.
 *
 * Si el cuerpo no cumple el contrato (un 502 de un proxy, una página de error de
 * Nginx), se construye igualmente un error con la misma forma: quien llama nunca
 * tiene que distinguir entre "error de la API" y "error de otra cosa".
 */
async function readErrorBody(response: Response): Promise<ApiRequestError> {
  let payload: unknown;

  try {
    payload = await response.json();
  } catch {
    return new ApiRequestError({
      status: response.status,
      code: ERROR_CODES.INTERNAL_ERROR,
      message: messages.errors.unreadableResponse,
    });
  }

  const parsed = apiErrorSchema.safeParse(payload);

  if (!parsed.success) {
    return new ApiRequestError({
      status: response.status,
      code: ERROR_CODES.INTERNAL_ERROR,
      message: messages.errors.unreadableResponse,
    });
  }

  const body = parsed.data;

  return new ApiRequestError({
    status: response.status,
    code: body.code,
    message: body.message,
    ...(body.details === undefined ? {} : { details: body.details }),
    ...(body.incidentId === undefined ? {} : { incidentId: body.incidentId }),
  });
}

/**
 * Llama a la API y devuelve la respuesta ya validada contra el esquema
 * compartido.
 *
 * La ruta se da SIN el prefijo: el prefijo sale de `@monedin/contracts`, que es
 * el mismo valor que monta la API. En desarrollo el navegador habla con Vite y
 * Vite reenvía; por eso la URL es relativa y no hay un origen configurado.
 */
export async function apiFetch<T>(
  path: string,
  schema: ZodType<T>,
  init?: RequestInit,
): Promise<T> {
  const headers = new Headers(init?.headers);
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  let response: Response;

  try {
    response = await fetch(`${API_PREFIX}${path}`, { ...init, headers });
  } catch {
    throw new ApiRequestError({
      status: 0,
      code: ERROR_CODES.INTERNAL_ERROR,
      message: messages.errors.network,
    });
  }

  if (!response.ok) {
    throw await readErrorBody(response);
  }

  const payload: unknown = await response.json();
  const parsed = schema.safeParse(payload);

  if (!parsed.success) {
    throw new ApiRequestError({
      status: response.status,
      code: ERROR_CODES.INTERNAL_ERROR,
      message: messages.errors.unexpectedShape,
    });
  }

  return parsed.data;
}
