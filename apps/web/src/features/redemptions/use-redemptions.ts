import { ERROR_CODES, type ListOwnRedemptionsQuery, type ListRedemptionsQuery } from "@monedin/contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as authApi from "../../api/auth.js";
import * as childrenApi from "../../api/children.js";
import * as api from "../../api/redemptions.js";
import * as rewardsApi from "../../api/rewards.js";
import { ApiRequestError } from "../../lib/http-client.js";
import { messages } from "../../lib/messages.js";

/**
 * Datos de los canjes.
 *
 * Solicitar no mueve el saldo real todavía —el descuento ocurre al aprobar—,
 * así que solo invalida la lista de canjes. Aprobar SÍ descuenta, y por eso
 * usa el mismo patrón que `useApproveTask`: refresca la sesión y el perfil
 * propio del niño, MÁS `rewardsQueryKey`, porque `affordable` en el
 * escaparate se calcula contra el saldo que este canje acaba de bajar.
 */
function useRefreshRedemptions(): () => Promise<void> {
  const queryClient = useQueryClient();

  return async () => {
    await queryClient.invalidateQueries({ queryKey: api.redemptionsQueryKey });
  };
}

function useRefreshRedemptionsAndCoins(): () => Promise<void> {
  const queryClient = useQueryClient();

  return async () => {
    await queryClient.invalidateQueries({ queryKey: api.redemptionsQueryKey });
    await queryClient.invalidateQueries({ queryKey: authApi.sessionQueryKey });
    await queryClient.invalidateQueries({ queryKey: childrenApi.ownChildQueryKey });
    await queryClient.invalidateQueries({ queryKey: childrenApi.childrenQueryKey });
    await queryClient.invalidateQueries({ queryKey: rewardsApi.rewardsQueryKey });
  };
}

// --- Bandeja del padre --------------------------------------------------------

export function useRedemptions(query: Partial<ListRedemptionsQuery>) {
  return useQuery({
    queryKey: api.redemptionsPageQueryKey(query),
    queryFn: () => api.fetchRedemptions(query),
  });
}

/** Aprobar DESCUENTA: es la mutación que obliga a invalidar también el saldo. */
export function useApproveRedemption() {
  const refresh = useRefreshRedemptionsAndCoins();

  return useMutation({ mutationFn: api.approveRedemption, onSuccess: refresh });
}

export function useRejectRedemption() {
  const refresh = useRefreshRedemptions();

  return useMutation({ mutationFn: api.rejectRedemption, onSuccess: refresh });
}

// --- Alta y lista propia del niño ---------------------------------------------

export function useOwnRedemptions(query: Partial<ListOwnRedemptionsQuery> = {}) {
  return useQuery({
    queryKey: api.ownRedemptionsQueryKey(query),
    queryFn: () => api.fetchOwnRedemptions(query),
  });
}

/** Solicitar NO descuenta todavía, así que no hace falta refrescar ningún saldo. */
export function useCreateRedemption() {
  const refresh = useRefreshRedemptions();

  return useMutation({ mutationFn: api.createRedemption, onSuccess: refresh });
}

/**
 * Traduce un error de canjes a un texto para la persona.
 *
 * NO se reutiliza `describeTasksError` ni `describeRewardsError` a propósito:
 * aquí un 409 puede significar una transición perdida, un saldo que ya no
 * alcanza al aprobar, o un duplicado pendiente al solicitar, y los tres
 * casos comparten el mismo mensaje —igual que `describeTasksError` ya
 * colapsa varios casos en `messages.tasks.conflict`—. El código HTTP es
 * estable, pero no quiere decir lo mismo en dos módulos distintos.
 */
export function describeRedemptionsError(error: unknown): string {
  if (!(error instanceof ApiRequestError)) {
    return messages.errors.network;
  }

  switch (error.code) {
    case ERROR_CODES.CONFLICT:
      return messages.redemptions.conflict;
    case ERROR_CODES.NOT_FOUND:
      return messages.redemptions.notFound;
    case ERROR_CODES.FORBIDDEN:
      return messages.redemptions.forbidden;
    case ERROR_CODES.VALIDATION_ERROR:
      return error.details[0]?.message ?? messages.redemptions.invalidData;
    default:
      return messages.errors.network;
  }
}

/** El estado de un canje, tal como lo lee una persona. */
export function describeRedemptionStatus(status: "PENDING" | "APPROVED" | "REJECTED"): string {
  switch (status) {
    case "PENDING":
      return messages.redemptions.statusPending;
    case "APPROVED":
      return messages.redemptions.statusApproved;
    case "REJECTED":
      return messages.redemptions.statusRejected;
  }
}
