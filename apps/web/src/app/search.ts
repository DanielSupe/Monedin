import { z } from "zod";

/**
 * Parámetros de búsqueda de los listados.
 *
 * Un valor inválido **cae al valor por defecto** en vez de rechazarse, y es lo
 * contrario del criterio de la API a propósito.
 *
 * Allí, un `pageSize` fuera de rango es 422 porque quien llama es código y
 * recortar en silencio esconde su error. Aquí quien «llama» es una persona que
 * pegó una dirección vieja o la escribió a mano, y dejarle la pantalla en blanco
 * no arregla nada: no hay nada que proteger, porque el servidor valida su propia
 * entrada de todas formas. Ver decisión 4 del design de `add-app-shell`.
 */

/** La página de un listado. Siempre 1 o más. */
export const pageSearch = z.object({
  page: z.coerce.number().int().min(1).catch(1),
});

export type PageSearch = z.infer<typeof pageSearch>;

/**
 * Un filtro por estado, con `ALL` como valor por defecto.
 *
 * Recibe los estados válidos del módulo, que salen de `@monedin/contracts`: la
 * lista de estados no se vuelve a escribir aquí.
 */
export function statusSearch<const T extends readonly [string, ...string[]]>(estados: T) {
  return pageSearch.extend({
    status: z
      .enum(estados)
      .or(z.literal("ALL"))
      .catch("ALL"),
  });
}
