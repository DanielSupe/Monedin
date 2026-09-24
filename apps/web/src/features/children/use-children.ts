import { ERROR_CODES, type UpdateChildInput } from "@monedin/contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as authApi from "../../api/auth.js";
import * as api from "../../api/children.js";
import { ApiRequestError } from "../../lib/http-client.js";
import { messages } from "../../lib/messages.js";

function useRefreshChildren(): () => Promise<void> {
  const queryClient = useQueryClient();

  return async () => {
    await queryClient.invalidateQueries({ queryKey: api.childrenQueryKey });
    await queryClient.invalidateQueries({ queryKey: authApi.profilesQueryKey });
  };
}

export function useChildren(page: number, pageSize?: number) {
  return useQuery({
    queryKey: api.childrenPageQueryKey(page, pageSize),
    queryFn: () =>
      api.fetchChildren(pageSize === undefined ? { page } : { page, pageSize }),
  });
}

export function useChild(childId: string) {
  return useQuery({
    queryKey: api.childQueryKey(childId),
    queryFn: () => api.fetchChild(childId),
  });
}

export function useCreateChild() {
  const refresh = useRefreshChildren();

  return useMutation({ mutationFn: api.createChild, onSuccess: refresh });
}

export function useUpdateChild() {
  const refresh = useRefreshChildren();

  return useMutation({
    mutationFn: ({ childId, input }: { childId: string; input: UpdateChildInput }) =>
      api.updateChild(childId, input),
    onSuccess: refresh,
  });
}

export function useDeactivateChild() {
  const refresh = useRefreshChildren();

  return useMutation({ mutationFn: api.deactivateChild, onSuccess: refresh });
}

export function useOwnChild() {
  return useQuery({ queryKey: api.ownChildQueryKey, queryFn: api.fetchOwnChild });
}

export function useUpdateOwnChild() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.updateOwnChild,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: api.ownChildQueryKey });

      await queryClient.invalidateQueries({ queryKey: authApi.sessionQueryKey });
      await queryClient.invalidateQueries({ queryKey: authApi.profilesQueryKey });
    },
  });
}

export function describeChildrenError(error: unknown): string {
  if (!(error instanceof ApiRequestError)) {
    return messages.errors.network;
  }

  switch (error.code) {
    case ERROR_CODES.CONFLICT:
      return messages.children.maxReached;
    case ERROR_CODES.NOT_FOUND:
      return messages.children.notFound;
    case ERROR_CODES.FORBIDDEN:
      return messages.children.forbidden;
    case ERROR_CODES.VALIDATION_ERROR:
      return error.details[0]?.message ?? messages.children.invalidData;
    default:
      return messages.errors.network;
  }
}
