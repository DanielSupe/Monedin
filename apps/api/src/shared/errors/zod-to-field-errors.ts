import type { FieldError } from "@monedin/contracts";
import type { ZodError } from "zod";

/**
 * Convierte los problemas de un esquema Zod en detalle por campo.
 *
 * Devuelve TODOS los campos inválidos, no solo el primero: el front tiene que
 * poder señalar de una vez cada campo del formulario que hay que corregir.
 */
export function zodToFieldErrors(error: ZodError): FieldError[] {
  return error.issues.map((issue) => ({
    field: issue.path.length > 0 ? issue.path.join(".") : "body",
    code: issue.code,
    message: issue.message,
  }));
}
