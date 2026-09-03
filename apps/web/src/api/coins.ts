import {
  type CoinTransactionsPage,
  type PaginationQuery,
  coinTransactionsPageSchema,
} from "@monedin/contracts";
import { apiFetch } from "../lib/http-client.js";

/**
 * El historial de monedas. Solo lectura.
 *
 * Dos rutas y ninguna escritura: la tabla es append-only y crear un movimiento
 * suelto mueve dinero, así que sigue sin exponerse. Ver la decisión 5 del design
 * de `add-coin-history`.
 */

function queryString(query: Partial<PaginationQuery>): string {
  const params = new URLSearchParams();
  if (query.page !== undefined) params.set("page", String(query.page));
  if (query.pageSize !== undefined) params.set("pageSize", String(query.pageSize));

  const cadena = params.toString();
  return cadena === "" ? "" : `?${cadena}`;
}

/**
 * El historial del propio niño.
 *
 * Sin ningún identificador: el perfil sale de la sesión, así que esta llamada no
 * tiene nada que pudiera apuntar a otro niño.
 */
export function fetchOwnCoinHistory(
  query: Partial<PaginationQuery> = {},
): Promise<CoinTransactionsPage> {
  return apiFetch(`/children/me/coins${queryString(query)}`, coinTransactionsPageSchema);
}

/** El historial de un hijo, que solo su padre puede pedir. */
export function fetchChildCoinHistory(
  childId: string,
  query: Partial<PaginationQuery> = {},
): Promise<CoinTransactionsPage> {
  return apiFetch(`/children/${childId}/coins${queryString(query)}`, coinTransactionsPageSchema);
}

/**
 * La clave raíz del historial.
 *
 * Aprobar una tarea o un canje escribe en él, así que esta clave entra donde ya
 * se invalida el saldo. Si no, el niño aprueba una tarea, ve su saldo subir y su
 * historial sigue sin la fila que lo explica.
 */
export const coinHistoryQueryKey = ["coins"] as const;
export const ownCoinHistoryQueryKey = (query: Partial<PaginationQuery> = {}) =>
  ["coins", "me", query] as const;
export const childCoinHistoryQueryKey = (childId: string, query: Partial<PaginationQuery> = {}) =>
  ["coins", childId, query] as const;
