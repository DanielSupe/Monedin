import {
  type Child,
  type ChildrenPage,
  type CreateChildInput,
  type OwnChild,
  type PaginationQuery,
  type UpdateChildInput,
  type UpdateOwnChildInput,
  childSchema,
  childrenPageSchema,
  ownChildSchema,
} from "@monedin/contracts";
import { z } from "zod";
import { apiFetch } from "../lib/http-client.js";

/**
 * Llamadas de los perfiles de hijo.
 *
 * Los tipos NO se declaran aquí: vienen de `@monedin/contracts`, el mismo
 * paquete del que la API deriva su validación. Si el contrato cambia, esto deja
 * de compilar.
 */

const emptySchema = z.unknown();

export function createChild(input: CreateChildInput): Promise<Child> {
  return apiFetch("/children", childSchema, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function fetchChildren(query: Partial<PaginationQuery> = {}): Promise<ChildrenPage> {
  const params = new URLSearchParams();
  if (query.page !== undefined) params.set("page", String(query.page));
  if (query.pageSize !== undefined) params.set("pageSize", String(query.pageSize));

  const cadena = params.toString();

  return apiFetch(`/children${cadena === "" ? "" : `?${cadena}`}`, childrenPageSchema);
}

export function fetchChild(childId: string): Promise<Child> {
  return apiFetch(`/children/${childId}`, childSchema);
}

export function updateChild(childId: string, input: UpdateChildInput): Promise<Child> {
  return apiFetch(`/children/${childId}`, childSchema, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function deactivateChild(childId: string): Promise<void> {
  await apiFetch(`/children/${childId}`, emptySchema, { method: "DELETE" });
}

// --- Vista propia del niño --------------------------------------------------

export function fetchOwnChild(): Promise<OwnChild> {
  return apiFetch("/children/me", ownChildSchema);
}

export function updateOwnChild(input: UpdateOwnChildInput): Promise<OwnChild> {
  return apiFetch("/children/me", ownChildSchema, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export const childrenQueryKey = ["children"] as const;
export const childrenPageQueryKey = (page: number, pageSize?: number) =>
  ["children", { page, pageSize }] as const;
export const childQueryKey = (childId: string) => ["children", childId] as const;
export const ownChildQueryKey = ["children", "me"] as const;
