import {
  type AskAssistantInput,
  type AssistantAnswer,
  assistantAnswerSchema,
} from "@monedin/contracts";
import { apiFetch } from "../lib/http-client.js";

export function askAssistant(input: AskAssistantInput): Promise<AssistantAnswer> {
  return apiFetch("/assistant/ask", assistantAnswerSchema, {
    method: "POST",
    body: JSON.stringify(input),
  });
}
