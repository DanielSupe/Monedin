import { API_PREFIX, ERROR_CODES, apiErrorSchema, type FieldError } from "@monedin/contracts";
import type { ZodType } from "zod";
import { messages } from "./messages.js";

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

function hasBody(response: Response): boolean {
  if (response.status === 204 || response.status === 205) return false;
  return (response.headers.get("content-length") ?? "") !== "0";
}

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

  const payload: unknown = hasBody(response) ? await response.json() : undefined;

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
