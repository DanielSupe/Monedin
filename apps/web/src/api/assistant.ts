import {
  type AskAssistantInput,
  type AssistantAnswer,
  assistantAnswerSchema,
} from "@monedin/contracts";
import { apiFetch } from "../lib/http-client.js";

/**
 * El asistente. Una sola llamada.
 *
 * SIN QUERY KEY, y no es un olvido: los otros seis clientes exportan las suyas
 * porque lo que piden se cachea. Aquí no hay nada que cachear —no se persiste
 * ninguna conversación, y la misma pregunta dos veces es legítimamente otra
 * respuesta—, así que una clave sería una promesa falsa sobre lo que hay
 * detrás.
 *
 * Y no lleva ningún identificador. El contexto lo compone el servidor desde la
 * sesión: no existe el parámetro con el que se apuntaría a otro perfil.
 */
export function askAssistant(input: AskAssistantInput): Promise<AssistantAnswer> {
  return apiFetch("/assistant/ask", assistantAnswerSchema, {
    method: "POST",
    body: JSON.stringify(input),
  });
}
