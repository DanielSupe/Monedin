import {
  ERROR_CODES,
  type ListOwnRewardsQuery,
  type ListRewardsQuery,
  type ReplaceAssignmentsInput,
  type UpdateRewardInput,
} from "@monedin/contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "../../api/rewards.js";
import { ApiRequestError } from "../../lib/http-client.js";
import { messages } from "../../lib/messages.js";

/**
 * Datos de los premios.
 *
 * Este módulo no mueve monedas: a diferencia de aprobar una tarea, ninguna
 * mutación de aquí toca el saldo de nadie, así que no hace falta invalidar el
 * actor de la sesión ni el perfil propio del niño. Lo que sí hay que
 * refrescar siempre son las DOS vistas —catálogo y escaparate—, porque leen
 * las mismas filas: retirar un premio o cambiar sus ofertas cambia lo que ve
 * el niño tanto como lo que ve el padre.
 */
function useRefreshRewards(): () => Promise<void> {
  const queryClient = useQueryClient();

  return async () => {
    await queryClient.invalidateQueries({ queryKey: api.rewardsQueryKey });
  };
}

// --- Gestión del padre ------------------------------------------------------

export function useRewards(query: Partial<ListRewardsQuery>) {
  return useQuery({
    queryKey: api.rewardsPageQueryKey(query),
    queryFn: () => api.fetchRewards(query),
  });
}

export function useCreateReward() {
  const refresh = useRefreshRewards();

  return useMutation({ mutationFn: api.createReward, onSuccess: refresh });
}

export function useUpdateReward() {
  const refresh = useRefreshRewards();

  return useMutation({
    mutationFn: ({ rewardId, input }: { rewardId: string; input: UpdateRewardInput }) =>
      api.updateReward(rewardId, input),
    onSuccess: refresh,
  });
}

export function useReplaceAssignments() {
  const refresh = useRefreshRewards();

  return useMutation({
    mutationFn: ({ rewardId, input }: { rewardId: string; input: ReplaceAssignmentsInput }) =>
      api.replaceAssignments(rewardId, input),
    onSuccess: refresh,
  });
}

export function useRetireReward() {
  const refresh = useRefreshRewards();

  return useMutation({ mutationFn: api.retireReward, onSuccess: refresh });
}

// --- Escaparate propio del niño ----------------------------------------------

export function useOwnRewards(query: Partial<ListOwnRewardsQuery> = {}) {
  return useQuery({
    queryKey: api.ownRewardsQueryKey(query),
    queryFn: () => api.fetchOwnRewards(query),
  });
}

/**
 * Traduce un error de premios a un texto para la persona.
 *
 * NO se reutiliza `describeTasksError` a propósito: allí un 404 significa
 * «esa tarea ya no está pendiente» —bueno, un 409, pero el mismo argumento
 * aplica a su 404— y aquí significa «ese premio ya no está». El código HTTP
 * es estable, pero no quiere decir lo mismo en dos módulos distintos; el
 * mensaje lo decide el contexto.
 */
export function describeRewardsError(error: unknown): string {
  if (!(error instanceof ApiRequestError)) {
    return messages.errors.network;
  }

  switch (error.code) {
    case ERROR_CODES.NOT_FOUND:
      return messages.rewards.notFound;
    case ERROR_CODES.FORBIDDEN:
      return messages.rewards.forbidden;
    case ERROR_CODES.VALIDATION_ERROR:
      return error.details[0]?.message ?? messages.rewards.invalidData;
    default:
      return messages.errors.network;
  }
}
