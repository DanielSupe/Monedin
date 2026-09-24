import { ERROR_CODES, type ListOwnRedemptionsQuery, type ListRedemptionsQuery } from "@monedin/contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as authApi from "../../api/auth.js";
import * as childrenApi from "../../api/children.js";
import * as coinsApi from "../../api/coins.js";
import * as api from "../../api/redemptions.js";
import * as rewardsApi from "../../api/rewards.js";
import { ApiRequestError } from "../../lib/http-client.js";
import { messages } from "../../lib/messages.js";

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

    await queryClient.invalidateQueries({ queryKey: coinsApi.coinHistoryQueryKey });
    await queryClient.invalidateQueries({ queryKey: rewardsApi.rewardsQueryKey });
  };
}

export function useRedemptions(query: Partial<ListRedemptionsQuery>) {
  return useQuery({
    queryKey: api.redemptionsPageQueryKey(query),
    queryFn: () => api.fetchRedemptions(query),
  });
}

export function useApproveRedemption() {
  const refresh = useRefreshRedemptionsAndCoins();

  return useMutation({ mutationFn: api.approveRedemption, onSuccess: refresh });
}

export function useRejectRedemption() {
  const refresh = useRefreshRedemptions();

  return useMutation({ mutationFn: api.rejectRedemption, onSuccess: refresh });
}

export function useOwnRedemptions(query: Partial<ListOwnRedemptionsQuery> = {}) {
  return useQuery({
    queryKey: api.ownRedemptionsQueryKey(query),
    queryFn: () => api.fetchOwnRedemptions(query),
  });
}

export function useCreateRedemption() {
  const refresh = useRefreshRedemptions();

  return useMutation({ mutationFn: api.createRedemption, onSuccess: refresh });
}

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
