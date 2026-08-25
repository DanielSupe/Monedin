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

/**
 * Llamadas de los canjes.
 *
 * Los tipos NO se declaran aquí: vienen de `@monedin/contracts`, el mismo
 * paquete del que la API deriva su validación. Si el contrato cambia, esto
 * deja de compilar.
 *
 * Las transiciones van por POST, igual que en la API y que `tasks`.
 */

/** Query string de un listado, en el orden en que lo espera la API. */
function queryString(query: Record<string, string | number | undefined>): string {
  const params = new URLSearchParams();

  for (const [clave, valor] of Object.entries(query)) {
    if (valor !== undefined) params.set(clave, String(valor));
  }

  const cadena = params.toString();
  return cadena === "" ? "" : `?${cadena}`;
}

// --- Alta, por el niño -------------------------------------------------------

/** Quien solicita es el niño, así que la API devuelve su propia forma: sin `child`. */
export function createRedemption(input: CreateRedemptionInput): Promise<OwnRedemption> {
  return apiFetch("/redemptions", ownRedemptionSchema, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

// --- Bandeja del padre --------------------------------------------------------

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

// --- Lista propia del niño ----------------------------------------------------

/**
 * Los canjes del niño.
 *
 * NO admite un identificador de hijo, igual que la API: el perfil sale de la
 * sesión. Si esta función aceptara uno, la garantía dejaría de ser
 * estructural.
 */
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

// --- Claves de consulta -----------------------------------------------------

/** Raíz de todo lo de canjes: invalidarla refresca las dos vistas. */
export const redemptionsQueryKey = ["redemptions"] as const;

export const redemptionsPageQueryKey = (query: Partial<ListRedemptionsQuery>) =>
  ["redemptions", "batches", query] as const;

export const ownRedemptionsQueryKey = (query: Partial<ListOwnRedemptionsQuery> = {}) =>
  ["redemptions", "mine", query] as const;
