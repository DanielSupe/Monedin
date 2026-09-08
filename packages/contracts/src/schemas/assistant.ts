import { z } from "zod";
import {
  ASSISTANT_MAX_HISTORY_TURNS,
  ASSISTANT_QUESTION_MAX_LENGTH,
  ASSISTANT_ROLES,
  ASSISTANT_TURN_MAX_LENGTH,
} from "../constants/domain.js";

/**
 * Contratos del asistente, compartidos por la API y el front.
 *
 * NO hay identificador en ninguna parte de la entrada, y no es un descuido: el
 * contexto se toma del actor de la sesión. Ahí está la garantía de que un niño
 * no recibe datos de su hermano —no existe el parámetro que apuntaría a otro
 * perfil, así que no hay nada que comprobar—, exactamente como en
 * `listOwnCoinsQuerySchema`.
 *
 * Y no hay esquema de "conversación" ni de "mensaje guardado" porque no se
 * persiste nada: el hilo vive en la pantalla y viaja completo en cada petición.
 * Un nombre de recurso mentiría sobre lo que hay detrás.
 */

// ---------------------------------------------------------------------------
// Entrada
// ---------------------------------------------------------------------------

/**
 * Un turno del hilo previo, tal y como lo reenvía el cliente.
 *
 * `assistant` y no `model`: este es el vocabulario del PRODUCTO. El proveedor
 * usa el suyo en `shared/ai/provider.ts` y quien traduce entre los dos es el
 * servicio, en un solo sitio.
 *
 * OJO con lo que esto es: entrada del usuario, incluidos los turnos que dicen
 * ser respuestas anteriores del asistente. Al no persistirse nada no hay
 * transcripción contra la que contrastarlos, así que cualquiera puede
 * fabricarlos. Que eso no importe se apoya en que el hilo NO puede ampliar el
 * contexto: los datos de la familia se cargan desde la sesión. Ver la decisión
 * 8 del design de `add-family-assistant`.
 */
export const assistantTurnSchema = z
  .object({
    role: z.enum(ASSISTANT_ROLES),
    text: z
      .string()
      .trim()
      .min(1, "un turno no puede estar vacío")
      .max(ASSISTANT_TURN_MAX_LENGTH, "ese mensaje es demasiado largo"),
  })
  .strict();

export type AssistantTurn = z.infer<typeof assistantTurnSchema>;

/**
 * Lo que se envía para preguntar.
 *
 * `.strict()` a propósito: un campo desconocido es 422 y no se ignora. Es lo
 * que convierte "no existe el parámetro que apuntaría a otro perfil" en algo
 * que la entrada hace cumplir, y no solo en una afirmación sobre el código.
 *
 * Pasarse de cualquier tope es 422 y NO un recorte silencioso. El cliente
 * recorta el hilo ANTES de enviarlo, así que este 422 solo lo ve un cliente
 * roto o alguien probando a mano. Un solo mecanismo en un solo sitio: el
 * servicio no vuelve a acotar.
 */
export const askAssistantSchema = z
  .object({
    question: z
      .string()
      .trim()
      .min(1, "escribe tu pregunta")
      .max(ASSISTANT_QUESTION_MAX_LENGTH, "esa pregunta es demasiado larga"),
    history: z
      .array(assistantTurnSchema)
      .max(ASSISTANT_MAX_HISTORY_TURNS, "la conversación es demasiado larga")
      .default([]),
  })
  .strict();

export type AskAssistantInput = z.infer<typeof askAssistantSchema>;

// ---------------------------------------------------------------------------
// Respuestas
// ---------------------------------------------------------------------------

/**
 * La respuesta, entera y de una vez.
 *
 * Un solo campo: no hay identificador que devolver porque no se guarda nada, y
 * no hay marca de tiempo porque nadie va a ordenar esto después.
 */
export const assistantAnswerSchema = z.object({
  answer: z.string(),
});

export type AssistantAnswer = z.infer<typeof assistantAnswerSchema>;
