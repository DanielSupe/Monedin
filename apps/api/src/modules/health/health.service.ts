import type { HealthResponse } from "@monedin/contracts";
import { messages } from "../../shared/messages/index.js";
import { findServiceIdentity } from "./health.repository.js";

/**
 * Reglas de negocio y autorización del módulo.
 *
 * En un módulo de dominio, todo método de este archivo recibe el actor como
 * primer argumento — `getTasks(actor, filters)` — y comprueba aquí, no en el
 * controlador, que ese actor puede hacer lo que pide.
 *
 * `health` es la única excepción del sistema: es público por definición, así que
 * no recibe actor. Cualquier módulo que trate datos de una familia SÍ lo recibe.
 */

/**
 * Estado del servicio.
 *
 * La respuesta es determinista: dos llamadas seguidas devuelven exactamente lo
 * mismo, y ninguna produce efectos secundarios.
 */
export function getHealth(): HealthResponse {
  const identity = findServiceIdentity();

  return {
    status: "ok",
    service: messages.health.serviceName,
    version: identity.version,
  };
}
