import type { FamilyRole } from "@monedin/contracts";

/**
 * Quién está haciendo la petición.
 *
 * El controlador lo construye a partir de la sesión y lo pasa como PRIMER
 * argumento a todo método de servicio: `service.method(actor, dto)`.
 *
 * Esta firma es lo que hace cumplible la regla de que la autorización se valida
 * en la capa de negocio: si el actor es el primer parámetro obligatorio, no se
 * puede escribir un servicio que ignore quién llama sin que se note al leer la
 * firma. Ver decisión 3 del design.
 *
 * La sesión real llega en `add-authentication`; aquí solo se fija el contrato.
 */
export interface Actor {
  /** Identificador del usuario autenticado. */
  userId: string;
  /** Rol familiar, que decide qué reglas se aplican. */
  familyRole: FamilyRole;
  /** Perfil del niño, presente únicamente cuando `familyRole` es `CHILD`. */
  childProfileId?: string;
}
