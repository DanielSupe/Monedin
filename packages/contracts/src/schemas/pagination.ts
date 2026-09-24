import { z } from "zod";
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "../constants/domain.js";

export const paginationQuerySchema = z.object({
  page: z.coerce
    .number({ invalid_type_error: "La página tiene que ser un número." })
    .int("La página tiene que ser un número entero.")
    .min(1, "La primera página es la 1.")
    .default(1),
  pageSize: z.coerce
    .number({ invalid_type_error: "El tamaño de página tiene que ser un número." })
    .int("El tamaño de página tiene que ser un número entero.")
    .min(1, "El tamaño de página mínimo es 1.")
    .max(MAX_PAGE_SIZE, `El tamaño de página máximo es ${MAX_PAGE_SIZE}.`)
    .default(DEFAULT_PAGE_SIZE),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

export function pageOf<T extends z.ZodTypeAny>(item: T) {
  return z.object({
    items: z.array(item),
    page: z.number().int(),
    pageSize: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
  });
}

export interface Page<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}
