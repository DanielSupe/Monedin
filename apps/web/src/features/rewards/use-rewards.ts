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

function useRefreshRewards(): () => Promise<void> {
  const queryClient = useQueryClient();

  return async () => {
    await queryClient.invalidateQueries({ queryKey: api.rewardsQueryKey });
  };
}

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

export function useOwnRewards(query: Partial<ListOwnRewardsQuery> = {}) {
  return useQuery({
    queryKey: api.ownRewardsQueryKey(query),
    queryFn: () => api.fetchOwnRewards(query),
  });
}

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
