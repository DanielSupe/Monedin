import {
  type CoinTransactionsPage,
  type PaginationQuery,
  coinTransactionsPageSchema,
} from "@monedin/contracts";
import { apiFetch } from "../lib/http-client.js";

function queryString(query: Partial<PaginationQuery>): string {
  const params = new URLSearchParams();
  if (query.page !== undefined) params.set("page", String(query.page));
  if (query.pageSize !== undefined) params.set("pageSize", String(query.pageSize));

  const cadena = params.toString();
  return cadena === "" ? "" : `?${cadena}`;
}

export function fetchOwnCoinHistory(
  query: Partial<PaginationQuery> = {},
): Promise<CoinTransactionsPage> {
  return apiFetch(`/children/me/coins${queryString(query)}`, coinTransactionsPageSchema);
}

export function fetchChildCoinHistory(
  childId: string,
  query: Partial<PaginationQuery> = {},
): Promise<CoinTransactionsPage> {
  return apiFetch(`/children/${childId}/coins${queryString(query)}`, coinTransactionsPageSchema);
}

export const coinHistoryQueryKey = ["coins"] as const;
export const ownCoinHistoryQueryKey = (query: Partial<PaginationQuery> = {}) =>
  ["coins", "me", query] as const;
export const childCoinHistoryQueryKey = (childId: string, query: Partial<PaginationQuery> = {}) =>
  ["coins", childId, query] as const;
