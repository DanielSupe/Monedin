import type { CoinTransaction, Page, PaginationQuery } from "@monedin/contracts";
import type { Actor } from "../../shared/actor.js";
import { toPage, toSkipTake } from "../../shared/pagination.js";
import * as childrenService from "../children/children.service.js";
import { ChildRoleRequiredError, ParentRoleRequiredError } from "./coins.errors.js";
import * as repository from "./coins.repository.js";
import type { MovementRow } from "./coins.repository.js";

/**
 * Reglas de negocio y autorización del historial de monedas.
 *
 * Solo lectura. Crear un movimiento suelto —el `MANUAL_ADJUSTMENT` que corrige
 * una acreditación equivocada— mueve dinero, así que exige transacción
 * interactiva, comprobación de fila afectada y pruebas de doble tap: es un
 * change entero, no un método más. Ver la decisión 5 del design de
 * `add-coin-history`.
 */

/**
 * El historial del propio niño que llama.
 *
 * El identificador sale del ACTOR y nunca de la petición. Es lo que hace cierto
 * por construcción que un niño no lea el de su hermano: no hay ningún parámetro
 * que pudiera apuntar a otro perfil, así que no hay nada que se pueda olvidar de
 * comprobar. Y su query es `.strict()`, así que mandar uno es 422.
 */
export async function listOwnHistory(
  actor: Actor,
  query: PaginationQuery,
): Promise<Page<CoinTransaction>> {
  if (actor.familyRole !== "CHILD") {
    throw new ChildRoleRequiredError();
  }

  return leer(actor.childProfileId, query);
}

/**
 * El historial de un hijo, pedido por su padre.
 *
 * La propiedad NO se comprueba aquí a mano: se delega en el servicio de
 * `children`, que ya sabe qué significa «este hijo es tuyo» y responde 404 —y no
 * 403— para no confirmar que existe el perfil de otra familia. Duplicar esa
 * comprobación sería tener la misma regla en dos sitios, y el día que cambie uno
 * se quedaría mintiendo el otro.
 *
 * Un servicio llamado desde otro servicio SIGUE comprobando permisos, que es
 * justo lo que hace que el actor sea un parámetro obligatorio.
 */
export async function listChildHistory(
  actor: Actor,
  childId: string,
  query: PaginationQuery,
): Promise<Page<CoinTransaction>> {
  if (actor.familyRole !== "PARENT") {
    throw new ParentRoleRequiredError();
  }

  // Lanza si no es suyo, si no existe o si está dado de baja. Los tres iguales.
  await childrenService.getChild(actor, childId);

  return leer(childId, query);
}

async function leer(childId: string, query: PaginationQuery): Promise<Page<CoinTransaction>> {
  const result = await repository.findCoinHistoryPage(childId, toSkipTake(query));

  return toPage(query, {
    items: result.items.map(toTransaction),
    total: result.total,
  });
}

/**
 * De fila a contrato.
 *
 * `balanceAfter` se devuelve tal cual está guardado y NO se calcula: la columna
 * es redundante a propósito desde `add-data-model` —«convierte auditar el saldo
 * en una comparación, no en una agregación»— y acumular sería además incorrecto
 * en cuanto haya paginación, porque la segunda página no sabe con qué saldo
 * empezó.
 */
function toTransaction(row: MovementRow): CoinTransaction {
  return {
    id: row.id,
    amount: row.amount,
    balanceAfter: row.balanceAfter,
    reason: row.reason,
    createdAt: row.createdAt.toISOString(),
    taskId: row.taskId,
    redemptionId: row.redemptionId,
  };
}
