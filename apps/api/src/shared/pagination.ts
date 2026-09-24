import type { Page, PaginationQuery } from "@monedin/contracts";

export function toSkipTake(query: PaginationQuery): { skip: number; take: number } {
  return {
    skip: (query.page - 1) * query.pageSize,
    take: query.pageSize,
  };
}

export function toPage<T>(query: PaginationQuery, result: { items: T[]; total: number }): Page<T> {
  return {
    items: result.items,
    page: query.page,
    pageSize: query.pageSize,
    total: result.total,
    totalPages: Math.max(1, Math.ceil(result.total / query.pageSize)),
  };
}
