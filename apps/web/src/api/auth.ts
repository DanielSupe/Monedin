import {
  type ChangeAdultPinInput,
  type ChangeOwnChildPinInput,
  type ChangePasswordInput,
  type EnterProfileInput,
  type LoginParentInput,
  type RegisterParentInput,
  type ResetAdultPinInput,
  type SelectableProfiles,
  type SessionState,
  type SetChildPinInput,
  selectableProfilesSchema,
  sessionStateSchema,
  type ImageContentType,
  type UploadUrl,
  uploadUrlSchema,
} from "@monedin/contracts";
import { z } from "zod";
import { apiFetch } from "../lib/http-client.js";

/**
 * Llamadas de autenticación.
 *
 * Los tipos NO se declaran aquí: vienen de `@monedin/contracts`, el mismo
 * paquete del que la API deriva su validación. Si el contrato cambia, esto deja
 * de compilar.
 */

const emptySchema = z.unknown();

export function fetchSession(): Promise<SessionState> {
  return apiFetch("/auth/session", sessionStateSchema);
}

export function registerParent(input: RegisterParentInput): Promise<SessionState> {
  return apiFetch("/auth/register", sessionStateSchema, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function loginParent(input: LoginParentInput): Promise<SessionState> {
  return apiFetch("/auth/login", sessionStateSchema, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function logout(): Promise<void> {
  await apiFetch("/auth/logout", emptySchema, { method: "POST" });
}

export function fetchProfiles(): Promise<SelectableProfiles> {
  return apiFetch("/auth/profiles", selectableProfilesSchema);
}

export function enterProfile(input: EnterProfileInput): Promise<SessionState> {
  return apiFetch("/auth/profiles/enter", sessionStateSchema, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function leaveProfile(): Promise<void> {
  await apiFetch("/auth/profiles/leave", emptySchema, { method: "POST" });
}

export async function changeAdultPin(input: ChangeAdultPinInput): Promise<void> {
  await apiFetch("/auth/pin", emptySchema, { method: "POST", body: JSON.stringify(input) });
}

/**
 * El niño cambia el PIN de SU perfil, el de la sesión.
 *
 * No lleva identificador: el perfil sale de la sesión. Vive en `auth` y no en
 * `children` porque tocar una credencial es de este módulo.
 */
export async function changeOwnChildPin(input: ChangeOwnChildPinInput): Promise<void> {
  await apiFetch("/auth/child-profiles/me/pin", emptySchema, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

/** El padre repone el PIN de un hijo, sin conocer el anterior. */
export async function setChildPin(input: SetChildPinInput): Promise<void> {
  await apiFetch("/auth/child-profiles/pin", emptySchema, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

/** El padre desbloquea el perfil de un hijo bloqueado por intentos. */
export async function unlockChildProfile(childProfileId: string): Promise<void> {
  await apiFetch(`/auth/child-profiles/${childProfileId}/unlock`, emptySchema, { method: "POST" });
}

export async function resetAdultPin(input: ResetAdultPinInput): Promise<void> {
  await apiFetch("/auth/pin/reset", emptySchema, { method: "POST", body: JSON.stringify(input) });
}

export async function changePassword(input: ChangePasswordInput): Promise<void> {
  await apiFetch("/auth/password", emptySchema, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export const sessionQueryKey = ["auth", "session"] as const;
export const profilesQueryKey = ["auth", "profiles"] as const;

// --- Avatar propio del padre --------------------------------------------------

export function requestParentAvatarUploadUrl(contentType: ImageContentType): Promise<UploadUrl> {
  return apiFetch("/auth/avatar/upload-url", uploadUrlSchema, {
    method: "POST",
    body: JSON.stringify({ contentType }),
  });
}

export async function updateParentAvatar(avatarUploadKey: string): Promise<void> {
  await apiFetch("/auth/avatar", z.unknown(), {
    method: "PATCH",
    body: JSON.stringify({ avatarUploadKey }),
  });
}
