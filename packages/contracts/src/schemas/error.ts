import { z } from "zod";

export const ERROR_CODES = {
  UNAUTHORIZED: "UNAUTHORIZED",

  FORBIDDEN: "FORBIDDEN",

  NOT_FOUND: "NOT_FOUND",

  ROUTE_NOT_FOUND: "ROUTE_NOT_FOUND",

  CONFLICT: "CONFLICT",

  VALIDATION_ERROR: "VALIDATION_ERROR",

  TOO_MANY_ATTEMPTS: "TOO_MANY_ATTEMPTS",

  SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE",

  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

export const fieldErrorSchema = z.object({
  field: z.string(),

  code: z.string(),

  message: z.string(),
});

export type FieldError = z.infer<typeof fieldErrorSchema>;

export const apiErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.array(fieldErrorSchema).optional(),
  incidentId: z.string().optional(),
});

export type ApiError = z.infer<typeof apiErrorSchema>;
