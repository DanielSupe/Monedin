import { z } from "zod";
import { COINS_MAX, COINS_MIN } from "../constants/domain.js";

/**
 * La regla de «cuánto le corresponde a cada hijo», compartida por tareas y
 * premios: el mismo valor para todos los hijos indicados, o uno distinto para
 * cada uno, y hay que cumplirse EXACTAMENTE una de las dos formas.
 *
 *   A) { childIds: [...], coins }             el mismo valor para todos
 *   B) { assignments: [{ childId, coins }] }  un valor distinto por hijo
 *
 * Nace en `createTaskSchema` y se extrae aquí cuando `rewards` se convierte en
 * su segundo cliente: la regla 3 de `CLAUDE.md` es clara sobre cuándo una
 * segunda copia deja de salir barata. Ver la decisión 2 del design de
 * `add-rewards`.
 *
 * Los mensajes son deliberadamente neutros («valor», no «vale» ni «cuesta»):
 * los usan tanto una tarea como un premio, y una sola redacción es la garantía
 * de que no se despeguen entre los dos módulos con la primera reescritura.
 */

/** Identificador de un hijo dentro de un reparto o de un conjunto de ofertas. */
export const childIdSchema = z.string().min(1, "Falta el identificador del hijo.");

/**
 * Un valor en monedas, con el mismo rango que garantiza el CHECK del motor en
 * cada tabla que lo usa.
 */
export const coinsAmountSchema = z
  .number({ invalid_type_error: "Las monedas tienen que ser un número." })
  .int("Las monedas tienen que ser un número entero.")
  .min(COINS_MIN, `Tiene que ser como mínimo ${COINS_MIN} moneda.`)
  .max(COINS_MAX, `Tiene que ser como máximo ${COINS_MAX} monedas.`);

/** Un hijo con el valor que le toca a él. La forma B. */
export const coinsPerChildAssignmentSchema = z
  .object({
    childId: childIdSchema,
    coins: coinsAmountSchema,
  })
  .strict();

export type CoinsPerChildAssignmentInput = z.infer<typeof coinsPerChildAssignmentSchema>;

/**
 * Los tres campos, listos para mezclarse en el esquema de objeto de quien los
 * usa junto a sus propios campos (título, descripción...).
 */
export const coinsPerChildFields = {
  childIds: z.array(childIdSchema).min(1, "Elige al menos un hijo.").optional(),
  coins: coinsAmountSchema.optional(),
  assignments: z.array(coinsPerChildAssignmentSchema).min(1, "Elige al menos un hijo.").optional(),
};

/** La forma mínima que necesita comprobar cada uno de los dos `.refine()`. */
interface CoinsPerChildShape {
  childIds?: string[] | undefined;
  coins?: number | undefined;
  assignments?: Array<{ childId: string; coins: number }> | undefined;
}

function hasExactlyOneForm(value: CoinsPerChildShape): boolean {
  const compartido = value.childIds !== undefined && value.coins !== undefined;
  const porHijo = value.assignments !== undefined;

  // Ni las dos formas, ni ninguna, ni media: si `compartido` y `porHijo`
  // valen lo mismo es que faltan campos o sobran.
  if (compartido === porHijo) return false;
  if (compartido) return value.assignments === undefined;
  return value.childIds === undefined && value.coins === undefined;
}

function hasNoDuplicateChild(value: CoinsPerChildShape): boolean {
  // Un hijo repetido dejaría dos precios para el mismo hijo en la misma
  // operación, que no es lo que nadie quiere decir al repetirlo.
  const ids = value.childIds ?? value.assignments?.map((one) => one.childId) ?? [];
  return new Set(ids).size === ids.length;
}

/**
 * Aplica los dos `.refine()` de la regla sobre un esquema de objeto que ya
 * incluya los tres campos de {@link coinsPerChildFields}.
 *
 * Separado de los campos porque quien llama todavía tiene que añadir sus
 * propios campos y llamar a `.strict()` antes de que los refinamientos vean el
 * objeto completo. `T` se infiere del esquema concreto que se pasa, así que el
 * tipo de salida sigue siendo el suyo y no se pierde nada de precisión para
 * quien use `z.infer<>` sobre el resultado.
 */
export function withCoinsPerChildRules<T extends z.AnyZodObject>(schema: T) {
  return schema
    .refine((value) => hasExactlyOneForm(value as CoinsPerChildShape), {
      message: "Indica el mismo valor para todos los hijos o uno por hijo, pero no las dos cosas.",
    })
    .refine((value) => hasNoDuplicateChild(value as CoinsPerChildShape), {
      message: "Hay un hijo repetido.",
    });
}

/**
 * Deja las dos formas en una sola lista de `{ childId, coins }`.
 *
 * Da por hecho que `value` ya pasó por {@link withCoinsPerChildRules}: la rama
 * de «ninguna de las dos formas» es inalcanzable en ese caso, y lanza para que
 * el tipo de retorno no tenga que fingir que puede devolver vacío.
 */
export function normalizeCoinsPerChild(
  value: CoinsPerChildShape,
): Array<{ childId: string; coins: number }> {
  if (value.assignments !== undefined) {
    return value.assignments;
  }

  const { childIds, coins } = value;
  if (childIds === undefined || coins === undefined) {
    throw new Error(
      "normalizeCoinsPerChild: ninguna de las dos formas está presente. " +
        "¿Se llamó sin pasar antes por withCoinsPerChildRules?",
    );
  }

  return childIds.map((childId) => ({ childId, coins }));
}
