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
 * El modo de administración de la rejilla de perfiles.
 *
 * Va en la dirección y no en un `useState` por tres razones, y la tercera es la
 * que decide: el botón atrás sale del modo en vez de salir de la aplicación,
 * recargar lo conserva, y **la intención sobrevive a la navegación al teclado de
 * PIN**. Eso último no es comodidad: después de acertar el PIN quien navega es
 * la guarda, no el componente, y necesita saber a dónde ir. Un estado local no
 * cruza esa frontera. Ver la decisión 1 del design de `redesign-profile-grid`.
 */
export const manageSearch = z.object({
  /*
   * Nada de `z.coerce.boolean()`: convierte en `true` cualquier cadena no
   * vacía, incluida `"false"`. Aquí solo enciende el booleano —que es lo que
   * entrega el router al serializar— o la palabra exacta, para que una dirección
   * tecleada a mano se comporte como se lee.
   *
   * Se parte de `unknown` a propósito: deja el parámetro OPCIONAL en los tipos,
   * y así los enlaces a `/profiles` que no saben nada del modo siguen siendo
   * `<Link to="/profiles">` a secas. Ausente es apagado, igual que cualquier
   * otra cosa que no sea encenderlo.
   *
   * Y apagado sale como `undefined` y no como `false` para que el router NO lo
   * escriba en la dirección: el modo normal es `/profiles` a secas, no
   * `/profiles?manage=false`. Un parámetro que solo dice «lo de siempre» es
   * ruido en la barra y una dirección más fea de compartir.
   */
  manage: z.unknown().transform((valor) => (valor === true || valor === "true" ? true : undefined)),
});

export type ManageSearch = z.infer<typeof manageSearch>;

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
