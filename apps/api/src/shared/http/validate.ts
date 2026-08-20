import type { RequestHandler } from "express";
import type { ZodTypeAny, z } from "zod";
import { ValidationError } from "../errors/domain-errors.js";
import { zodToFieldErrors } from "../errors/zod-to-field-errors.js";
import type { FieldError } from "@monedin/contracts";

/** Partes de la petición que se pueden validar. */
export interface ValidationSchemas {
  body?: ZodTypeAny;
  query?: ZodTypeAny;
  params?: ZodTypeAny;
}

/** Datos ya validados, disponibles para el controlador. */
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

/**
 * Valida la entrada de una petición ANTES de que se ejecute el controlador.
 *
 * Recorre las tres partes y acumula los problemas de todas, de modo que la
 * respuesta 422 señale de una vez cada campo que hay que corregir en el
 * formulario, en vez de obligar a descubrirlos uno por uno.
 *
 * Si algo falla, nada de la lógica de negocio llega a ejecutarse.
 */
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

      // El prefijo sitúa el campo: `coins` del cuerpo y `coins` de la query
      // no son el mismo campo para quien recibe el error.
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

    // `req.query` es de solo lectura en Express 5, así que lo validado vive en
    // `req.validated` y el controlador lo lee de ahí.
    req.validated = validated;
    if ("body" in validated) {
      req.body = validated.body;
    }

    next();
  };
}

/** Lee una parte ya validada de la petición, con el tipo del esquema. */
export function validatedPart<T extends ZodTypeAny>(
  req: { validated?: ValidatedData },
  part: keyof ValidatedData,
  _schema: T,
): z.infer<T> {
  return req.validated?.[part] as z.infer<T>;
}
