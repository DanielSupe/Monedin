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
  type UpdateParentAvatarInput,
  type UpdateThemeInput,
  type UpdateTutorialInput,
  selectableProfilesSchema,
  sessionStateSchema,
  type ImageContentType,
  type UploadUrl,
  uploadUrlSchema,
} from "@monedin/contracts";
import { z } from "zod";
import { apiFetch } from "../lib/http-client.js";

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

export async function changeOwnChildPin(input: ChangeOwnChildPinInput): Promise<void> {
  await apiFetch("/auth/child-profiles/me/pin", emptySchema, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function setChildPin(input: SetChildPinInput): Promise<void> {
  await apiFetch("/auth/child-profiles/pin", emptySchema, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

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

export function requestParentAvatarUploadUrl(contentType: ImageContentType): Promise<UploadUrl> {
  return apiFetch("/auth/avatar/upload-url", uploadUrlSchema, {
    method: "POST",
    body: JSON.stringify({ contentType }),
  });
}

export async function updateParentAvatar(input: UpdateParentAvatarInput): Promise<void> {
  await apiFetch("/auth/avatar", z.unknown(), {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function updateTutorial(input: UpdateTutorialInput): Promise<void> {
  await apiFetch("/auth/tutorial", z.unknown(), {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function updateTheme(input: UpdateThemeInput): Promise<void> {
  await apiFetch("/auth/theme", z.unknown(), {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}
