import { z } from "zod";
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "../constants/domain.js";

/**
 * Paginación de los listados, compartida por API y front.
 *
 * Es el patrón que estrena `GET /children` y que copian los listados
 * siguientes: un listado sin paginación es un endpoint sin terminar.
 *
 * Ver la decisión 3 del design de `add-children` para el porqué de cada una de
 * las cuatro elecciones que hay aquí dentro.
 */

/**
 * Página y tamaño, tal como llegan en la query.
 *
 * `z.coerce` es imprescindible: un parámetro de query siempre llega como
 * cadena, y con `z.number()` a secas un `?page=2` perfectamente válido fallaría
 * la validación sin que nadie entendiera por qué.
 *
 * Un `pageSize` por encima del máximo se RECHAZA, no se recorta. Recortar en
 * silencio esconde el error de quien llama: pide 500, recibe 100 y cree que hay
 * 100.
 */
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

/**
 * Envoltura de un listado paginado.
 *
 * Los metadatos van en el CUERPO y no en cabeceras, porque el front valida cada
 * respuesta contra su esquema y una cabecera quedaría fuera del contrato.
 *
 * `total` es el total sin paginar, que es lo que hace falta para pintar el
 * paginador.
 */
export function pageOf<T extends z.ZodTypeAny>(item: T) {
  return z.object({
    items: z.array(item),
    page: z.number().int(),
    pageSize: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
  });
}

/** La forma que devuelve `pageOf`, para tipar sin repetir los campos. */
export interface Page<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}
