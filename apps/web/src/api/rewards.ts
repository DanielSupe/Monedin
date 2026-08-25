import {
  type CreateRewardInput,
  type ListOwnRewardsQuery,
  type ListRewardsQuery,
  type OwnRewardsPage,
  type ReplaceAssignmentsInput,
  type Reward,
  type RewardsPage,
  type UpdateRewardInput,
  ownRewardsPageSchema,
  rewardSchema,
  rewardsPageSchema,
} from "@monedin/contracts";
import { z } from "zod";
import { apiFetch } from "../lib/http-client.js";

/**
 * Llamadas de los premios.
 *
 * Los tipos NO se declaran aquí: vienen de `@monedin/contracts`, el mismo
 * paquete del que la API deriva su validación. Si el contrato cambia, esto
 * deja de compilar.
 */

const emptySchema = z.unknown();

/** Query string de un listado, en el orden en que lo espera la API. */
function queryString(query: Record<string, string | number | undefined>): string {
  const params = new URLSearchParams();

  for (const [clave, valor] of Object.entries(query)) {
    if (valor !== undefined) params.set(clave, String(valor));
  }

  const cadena = params.toString();
  return cadena === "" ? "" : `?${cadena}`;
}

// --- Gestión del padre ------------------------------------------------------

export function createReward(input: CreateRewardInput): Promise<Reward> {
  return apiFetch("/rewards", rewardSchema, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function fetchRewards(query: Partial<ListRewardsQuery> = {}): Promise<RewardsPage> {
  return apiFetch(
    `/rewards${queryString({ page: query.page, pageSize: query.pageSize, status: query.status })}`,
    rewardsPageSchema,
  );
}

export function updateReward(rewardId: string, input: UpdateRewardInput): Promise<Reward> {
  return apiFetch(`/rewards/${rewardId}`, rewardSchema, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function replaceAssignments(
  rewardId: string,
  input: ReplaceAssignmentsInput,
): Promise<Reward> {
  return apiFetch(`/rewards/${rewardId}/assignments`, rewardSchema, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export async function retireReward(rewardId: string): Promise<void> {
  await apiFetch(`/rewards/${rewardId}`, emptySchema, { method: "DELETE" });
}

// --- Escaparate propio del niño ----------------------------------------------

/**
 * El escaparate del niño.
 *
 * NO admite un identificador de hijo, igual que la API: el perfil sale de la
 * sesión. Si esta función aceptara uno, la garantía dejaría de ser
 * estructural.
 */
export function fetchOwnRewards(
  query: Partial<ListOwnRewardsQuery> = {},
): Promise<OwnRewardsPage> {
  return apiFetch(
    `/rewards/mine${queryString({ page: query.page, pageSize: query.pageSize })}`,
    ownRewardsPageSchema,
  );
}

// --- Claves de consulta -----------------------------------------------------

/** Raíz de todo lo de premios: invalidarla refresca las dos vistas. */
export const rewardsQueryKey = ["rewards"] as const;

export const rewardsPageQueryKey = (query: Partial<ListRewardsQuery>) =>
  ["rewards", "catalog", query] as const;

export const ownRewardsQueryKey = (query: Partial<ListOwnRewardsQuery> = {}) =>
  ["rewards", "mine", query] as const;
