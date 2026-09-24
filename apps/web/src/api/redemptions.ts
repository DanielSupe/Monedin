import {
  type CreateRedemptionInput,
  type ListOwnRedemptionsQuery,
  type ListRedemptionsQuery,
  type OwnRedemption,
  type OwnRedemptionsPage,
  type Redemption,
  type RedemptionsPage,
  ownRedemptionSchema,
  ownRedemptionsPageSchema,
  redemptionSchema,
  redemptionsPageSchema,
} from "@monedin/contracts";
import { apiFetch } from "../lib/http-client.js";

function queryString(query: Record<string, string | number | undefined>): string {
  const params = new URLSearchParams();

  for (const [clave, valor] of Object.entries(query)) {
    if (valor !== undefined) params.set(clave, String(valor));
  }

  const cadena = params.toString();
  return cadena === "" ? "" : `?${cadena}`;
}

export function createRedemption(input: CreateRedemptionInput): Promise<OwnRedemption> {
  return apiFetch("/redemptions", ownRedemptionSchema, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function fetchRedemptions(
  query: Partial<ListRedemptionsQuery> = {},
): Promise<RedemptionsPage> {
  return apiFetch(
    `/redemptions${queryString({
      page: query.page,
      pageSize: query.pageSize,
      status: query.status,
      childId: query.childId,
    })}`,
    redemptionsPageSchema,
  );
}

export function approveRedemption(redemptionId: string): Promise<Redemption> {
  return apiFetch(`/redemptions/${redemptionId}/approve`, redemptionSchema, { method: "POST" });
}

export function rejectRedemption(redemptionId: string): Promise<Redemption> {
  return apiFetch(`/redemptions/${redemptionId}/reject`, redemptionSchema, { method: "POST" });
}

export function fetchOwnRedemptions(
  query: Partial<ListOwnRedemptionsQuery> = {},
): Promise<OwnRedemptionsPage> {
  return apiFetch(
    `/redemptions/mine${queryString({
      page: query.page,
      pageSize: query.pageSize,
      status: query.status,
    })}`,
    ownRedemptionsPageSchema,
  );
}

export const redemptionsQueryKey = ["redemptions"] as const;

export const redemptionsPageQueryKey = (query: Partial<ListRedemptionsQuery>) =>
  ["redemptions", "batches", query] as const;

export const ownRedemptionsQueryKey = (query: Partial<ListOwnRedemptionsQuery> = {}) =>
  ["redemptions", "mine", query] as const;
