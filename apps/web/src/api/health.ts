import { type HealthResponse, healthResponseSchema } from "@monedin/contracts";
import { apiFetch } from "../lib/http-client.js";

export function fetchHealth(): Promise<HealthResponse> {
  return apiFetch("/health", healthResponseSchema);
}

export const healthQueryKey = ["health"] as const;
