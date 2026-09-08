import { ERROR_CODES } from "@monedin/contracts";
import { useMutation } from "@tanstack/react-query";
import * as api from "../../api/assistant.js";
import { ApiRequestError } from "../../lib/http-client.js";
import { messages } from "../../lib/messages.js";

/**
 * Preguntarle a Monedín.
 *
 * ES LA PRIMERA MUTACIÓN DEL PROYECTO QUE NO INVALIDA NINGUNA CLAVE, y lleva
 * escrito el porqué porque el patrón de todas las demás invita a copiar un
 * `invalidateQueries` que aquí sería falso: preguntar no cambia ningún dato del
 * producto, así que no hay nada que se haya quedado viejo. Ni siquiera hay una
 * conversación guardada que refrescar.
 *
 * Tampoco reintenta: el `QueryClient` global no reintenta con `status >= 400`,
 * y un 503 es 503. Reintentar es una decisión de quien está esperando, y se la
 * ofrece la pantalla con un botón.
 */
export function useAskAssistant() {
  return useMutation({ mutationFn: api.askAssistant });
}

/**
 * Cómo se cuenta el fallo, por el CÓDIGO del error y nunca por su texto.
 *
 * El 503 tiene su propia rama, y esa es la razón de que exista el código: sin
 * él, un fallo de Google caería en `messages.errors.network` —«revisa tu
 * conexión»—, que es mentira cuando la red iba perfectamente.
 */
export function describeAssistantError(error: unknown): string {
  if (!(error instanceof ApiRequestError)) {
    return messages.errors.network;
  }

  switch (error.code) {
    case ERROR_CODES.SERVICE_UNAVAILABLE:
      return messages.assistant.unavailable;
    case ERROR_CODES.VALIDATION_ERROR:
      return messages.assistant.invalidQuestion;
    case ERROR_CODES.UNAUTHORIZED:
      return messages.assistant.signedOut;
    default:
      return messages.errors.network;
  }
}
