import { ERROR_CODES } from "@monedin/contracts";
import type { AlertTone } from "../ui/index.js";
import { ApiRequestError } from "./http-client.js";

/**
 * Con qué tono se cuenta el fallo de una operación.
 *
 * `Alert` distingue el conflicto desde `add-design-system` y lo explica en su
 * propia cabecera: **el 409 es advertencia, no peligro**. Nadie hizo nada mal —el
 * padre aprobó dos veces, o el hermano llegó antes—, y pintarlo de rojo le echa
 * la culpa a quien está mirando.
 *
 * Hasta `redesign-parent-inbox` esa distinción no llegaba a ninguna pantalla:
 * las dos bandejas del padre, que son las ÚNICAS que producen un 409 de verdad,
 * aplanaban todos sus errores en el mismo párrafo rojo. La API está construida
 * entera alrededor de esa diferencia —transiciones condicionales, comprobación
 * de filas afectadas, tests de doble tap— y la interfaz la tiraba.
 *
 * Vive en `lib/` y no en `ui/` porque mira el CÓDIGO de un error de la API, y una
 * pieza del sistema no sabe de códigos de error. Y no dentro de cada
 * `describe*Error` porque el mapeo es del contrato de errores, que es uno solo.
 *
 * Solo dos ramas a propósito: inventar tratamiento para códigos que ninguna
 * pantalla distingue sería adivinar.
 */
export function alertToneFor(error: unknown): AlertTone {
  if (error instanceof ApiRequestError && error.code === ERROR_CODES.CONFLICT) {
    return "warning";
  }

  return "danger";
}
