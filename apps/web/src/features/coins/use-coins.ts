import { ERROR_CODES, type PaginationQuery } from "@monedin/contracts";
import { useQuery } from "@tanstack/react-query";
import * as api from "../../api/coins.js";
import { ApiRequestError } from "../../lib/http-client.js";
import { messages } from "../../lib/messages.js";

/**
 * Datos del historial de monedas. Solo consultas: no hay ninguna mutación que
 * escriba en él desde aquí, y es a propósito.
 */

export function useOwnCoinHistory(query: Partial<PaginationQuery> = {}) {
  return useQuery({
    queryKey: api.ownCoinHistoryQueryKey(query),
    queryFn: () => api.fetchOwnCoinHistory(query),
  });
}

export function useChildCoinHistory(childId: string, query: Partial<PaginationQuery> = {}) {
  return useQuery({
    queryKey: api.childCoinHistoryQueryKey(childId, query),
    queryFn: () => api.fetchChildCoinHistory(childId, query),
  });
}

/** Cómo se lee el fallo, por el CÓDIGO del error y nunca por su texto. */
export function describeCoinsError(error: unknown): string {
  if (!(error instanceof ApiRequestError)) {
    return messages.errors.network;
  }

  switch (error.code) {
    case ERROR_CODES.NOT_FOUND:
      return messages.coins.notFound;
    case ERROR_CODES.FORBIDDEN:
      return messages.coins.forbidden;
    default:
      return messages.errors.network;
  }
}
