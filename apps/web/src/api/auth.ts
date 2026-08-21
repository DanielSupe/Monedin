import {
  type ChangePasswordInput,
  type EnterChildProfileInput,
  type LoginParentInput,
  type RegisterParentInput,
  type SelectableChildren,
  type SessionState,
  selectableChildrenSchema,
  sessionStateSchema,
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

export function fetchChildProfiles(): Promise<SelectableChildren> {
  return apiFetch("/auth/child-profiles", selectableChildrenSchema);
}

export function enterChildProfile(input: EnterChildProfileInput): Promise<SessionState> {
  return apiFetch("/auth/child-profiles/enter", sessionStateSchema, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function leaveChildProfile(): Promise<void> {
  await apiFetch("/auth/child-profiles/leave", emptySchema, { method: "POST" });
}

export async function changePassword(input: ChangePasswordInput): Promise<void> {
  await apiFetch("/auth/password", emptySchema, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export const sessionQueryKey = ["auth", "session"] as const;
export const childProfilesQueryKey = ["auth", "child-profiles"] as const;
