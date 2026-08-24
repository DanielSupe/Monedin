import { ERROR_CODES, type SessionState } from "@monedin/contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "../../api/auth.js";
import { ApiRequestError } from "../../lib/http-client.js";
import { messages } from "../../lib/messages.js";

/**
 * Estado de autenticación de la aplicación.
 *
 * Se consulta al arrancar: `GET /auth/session` responde 200 con o sin sesión,
 * así que no tener sesión todavía no es un error que haya que tratar aparte.
 */
export function useSession(): {
  session: SessionState | undefined;
  isLoading: boolean;
} {
  const { data, isPending } = useQuery({
    queryKey: api.sessionQueryKey,
    queryFn: api.fetchSession,
    // Es la fuente de verdad de quién está dentro: siempre fresca.
    staleTime: 0,
  });

  return { session: data, isLoading: isPending };
}

/** Invalida el estado de sesión para que se vuelva a consultar. */
function useRefreshSession(): () => Promise<void> {
  const queryClient = useQueryClient();

  return async () => {
    await queryClient.invalidateQueries({ queryKey: api.sessionQueryKey });
    await queryClient.invalidateQueries({ queryKey: api.profilesQueryKey });
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

/** Cambia el PIN de adulto indicando el actual. Exige perfil de padre activo. */
export function useChangeAdultPin() {
  return useMutation({ mutationFn: api.changeAdultPin });
}

/**
 * Restablece el PIN de adulto con la contraseña. No exige perfil activo: es
 * la vía de rescate para un padre bloqueado fuera de su propio perfil.
 */
export function useResetAdultPin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.resetAdultPin,
    // El bloqueo se limpia al restablecer: la rejilla necesita saberlo para
    // dejar de mostrar el perfil como bloqueado.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: api.profilesQueryKey }),
  });
}

/**
 * Traduce un error de la API a un texto para la persona.
 *
 * Decide por el CÓDIGO, nunca por el texto del mensaje: cambiar la redacción en
 * el catálogo de la API no debe romper esta decisión. Y distinguir «vuelve a
 * intentarlo» de «espera» es justo para lo que existe el código 429.
 */
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

/**
 * Qué pantalla toca, según el estado de sesión.
 *
 * Son TRES, no dos: sin cuenta se pide acceso, con cuenta y sin perfil se
 * elige quién eres, y con perfil se usa la aplicación.
 */
export type Screen = "signIn" | "profiles" | "app";

export function screenFor(session: SessionState | undefined): Screen {
  if (session === undefined || !session.hasAccount) return "signIn";
  return session.actor === null ? "profiles" : "app";
}

/** Si el error es un bloqueo, para que la interfaz no invite a reintentar ya. */
export function isLockout(error: unknown): boolean {
  return error instanceof ApiRequestError && error.code === ERROR_CODES.TOO_MANY_ATTEMPTS;
}
