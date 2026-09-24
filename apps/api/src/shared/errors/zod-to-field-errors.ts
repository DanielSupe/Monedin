import type { FieldError } from "@monedin/contracts";
import type { ZodError } from "zod";

export function zodToFieldErrors(error: ZodError): FieldError[] {
  return error.issues.map((issue) => ({
    field: issue.path.length > 0 ? issue.path.join(".") : "body",
    code: issue.code,
    message: issue.message,
  }));
}
