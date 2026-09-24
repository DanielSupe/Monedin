import { z } from "zod";
import {
  ASSISTANT_MAX_HISTORY_TURNS,
  ASSISTANT_QUESTION_MAX_LENGTH,
  ASSISTANT_ROLES,
  ASSISTANT_TURN_MAX_LENGTH,
} from "../constants/domain.js";

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

export const assistantAnswerSchema = z.object({
  answer: z.string(),
});

export type AssistantAnswer = z.infer<typeof assistantAnswerSchema>;
