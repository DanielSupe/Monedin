import { z } from "zod";

/**
 * Respuesta de `GET /api/v1/health`.
 *
 * El cuerpo es DETERMINISTA a proposito: dos llamadas seguidas devuelven
 * exactamente lo mismo. Por eso no lleva marca de tiempo ni tiempo de actividad,
 * que ademas no aportan nada a una sonda de vida.
 */
export const healthResponseSchema = z.object({
  status: z.literal("ok"),
  service: z.string(),
  version: z.string(),
});

export type HealthResponse = z.infer<typeof healthResponseSchema>;
