import { ERROR_CODES } from "@monedin/contracts";
import { useMutation } from "@tanstack/react-query";
import * as api from "../../api/assistant.js";
import { ApiRequestError } from "../../lib/http-client.js";
import { messages } from "../../lib/messages.js";

export function useAskAssistant() {
  return useMutation({ mutationFn: api.askAssistant });
}

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
