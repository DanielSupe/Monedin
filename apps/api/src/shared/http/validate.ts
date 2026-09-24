import type { RequestHandler } from "express";
import type { ZodTypeAny, z } from "zod";
import { ValidationError } from "../errors/domain-errors.js";
import { zodToFieldErrors } from "../errors/zod-to-field-errors.js";
import type { FieldError } from "@monedin/contracts";

export interface ValidationSchemas {
  body?: ZodTypeAny;
  query?: ZodTypeAny;
  params?: ZodTypeAny;
}

export interface ValidatedData {
  body?: unknown;
  query?: unknown;
  params?: unknown;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      validated?: ValidatedData;
    }
  }
}

export function validate(schemas: ValidationSchemas): RequestHandler {
  return (req, _res, next) => {
    const problems: FieldError[] = [];
    const validated: ValidatedData = {};

    for (const part of ["body", "query", "params"] as const) {
      const schema = schemas[part];
      if (schema === undefined) continue;

      const result = schema.safeParse(req[part]);

      if (result.success) {
        validated[part] = result.data;
        continue;
      }

      const prefix = part === "body" ? "" : `${part}.`;
      problems.push(
        ...zodToFieldErrors(result.error).map((fieldError) => ({
          ...fieldError,
          field: `${prefix}${fieldError.field}`,
        })),
      );
    }

    if (problems.length > 0) {
      next(new ValidationError(problems));
      return;
    }

    req.validated = validated;
    if ("body" in validated) {
      req.body = validated.body;
    }

    next();
  };
}

export function validatedPart<T extends ZodTypeAny>(
  req: { validated?: ValidatedData },
  part: keyof ValidatedData,
  _schema: T,
): z.infer<T> {
  return req.validated?.[part] as z.infer<T>;
}
