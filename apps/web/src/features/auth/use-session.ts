import { ERROR_CODES, type SessionState } from "@monedin/contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import * as api from "../../api/auth.js";
import { ApiRequestError } from "../../lib/http-client.js";
import { messages } from "../../lib/messages.js";

export function useSession(): {
  session: SessionState | undefined;
  isLoading: boolean;
} {
  const { data, isPending } = useQuery({
    queryKey: api.sessionQueryKey,
    queryFn: api.fetchSession,

    staleTime: 0,
  });

  return { session: data, isLoading: isPending };
}

function useRefreshSession(): () => Promise<void> {
  const queryClient = useQueryClient();
  const router = useRouter();

  return async () => {
    await queryClient.invalidateQueries({ queryKey: api.sessionQueryKey });
    await queryClient.invalidateQueries({ queryKey: api.profilesQueryKey });
    await router.invalidate();
  };
}

export function useLogin() {
  const refresh = useRefreshSession();

  return useMutation({
    mutationFn: api.loginParent,
    onSuccess: refresh,
  });
}

export function useRegister() {
  const refresh = useRefreshSession();

  return useMutation({
    mutationFn: api.registerParent,
    onSuccess: refresh,
  });
}

export function useLogout() {
  const refresh = useRefreshSession();

  return useMutation({
    mutationFn: api.logout,
    onSuccess: refresh,
  });
}

export function useProfiles(enabled: boolean) {
  return useQuery({
    queryKey: api.profilesQueryKey,
    queryFn: api.fetchProfiles,
    enabled,
  });
}

export function useEnterProfile() {
  const refresh = useRefreshSession();

  return useMutation({
    mutationFn: api.enterProfile,
    onSuccess: refresh,
  });
}

export function useLeaveProfile() {
  const refresh = useRefreshSession();

  return useMutation({
    mutationFn: api.leaveProfile,
    onSuccess: refresh,
  });
}

export function useUpdateTutorial() {
  const refresh = useRefreshSession();

  return useMutation({
    mutationFn: api.updateTutorial,
    onSuccess: refresh,
  });
}

export function useUpdateTheme() {
  const refresh = useRefreshSession();

  return useMutation({
    mutationFn: api.updateTheme,
    onSuccess: refresh,
  });
}

export function useChangeAdultPin() {
  return useMutation({ mutationFn: api.changeAdultPin });
}

export function useChangeOwnChildPin() {
  return useMutation({ mutationFn: api.changeOwnChildPin });
}

export function useSetChildPin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.setChildPin,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: api.profilesQueryKey }),
  });
}

export function useUnlockChildProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.unlockChildProfile,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: api.profilesQueryKey }),
  });
}

export function useResetAdultPin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.resetAdultPin,

    onSuccess: () => queryClient.invalidateQueries({ queryKey: api.profilesQueryKey }),
  });
}

export function describeAuthError(error: unknown): string {
  if (!(error instanceof ApiRequestError)) {
    return messages.errors.network;
  }

  switch (error.code) {
    case ERROR_CODES.TOO_MANY_ATTEMPTS:
      return messages.auth.tooManyAttempts;
    case ERROR_CODES.UNAUTHORIZED:
      return messages.auth.invalidCredentials;
    case ERROR_CODES.CONFLICT:
      return messages.auth.emailTaken;
    case ERROR_CODES.VALIDATION_ERROR:
      return error.details[0]?.message ?? messages.auth.invalidData;
    default:
      return messages.errors.network;
  }
}

export type Screen = "signIn" | "profiles" | "app";

export function screenFor(session: SessionState | undefined): Screen {
  if (session === undefined || !session.hasAccount) return "signIn";
  return session.actor === null ? "profiles" : "app";
}

export function isLockout(error: unknown): boolean {
  return error instanceof ApiRequestError && error.code === ERROR_CODES.TOO_MANY_ATTEMPTS;
}
