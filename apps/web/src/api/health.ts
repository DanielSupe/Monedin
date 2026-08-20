import { type HealthResponse, healthResponseSchema } from "@monedin/contracts";
import { apiFetch } from "../lib/http-client.js";

/**
 * Consulta el estado de la API.
 *
 * El tipo de la respuesta NO se declara aquí: viene de `@monedin/contracts`, el
 * mismo paquete del que la API deriva su validación. Si el contrato cambia, esto
 * deja de compilar, que es exactamente lo que se quiere.
 */
export function fetchHealth(): Promise<HealthResponse> {
  return apiFetch("/health", healthResponseSchema);
}

export const healthQueryKey = ["health"] as const;
