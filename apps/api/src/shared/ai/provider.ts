export type AiRole = "user" | "model";

export interface AiTurn {
  role: AiRole;
  text: string;
}

export interface AiCompletionRequest {
  system: string;

  history: AiTurn[];

  question: string;
}

export interface AiCompletion {
  text: string;
}

export interface AiProvider {
  complete(request: AiCompletionRequest): Promise<AiCompletion>;
}

export type AiFailureReason = "unavailable" | "rate_limited" | "timeout" | "invalid_response";

export class AiProviderError extends Error {
  constructor(
    readonly reason: AiFailureReason,
    readonly status?: number,
  ) {
    super(`ai_provider_${reason}`);
    this.name = "AiProviderError";
  }
}

export const AI_MODEL = "gemini-3.5-flash-lite";

export const AI_REQUEST_TIMEOUT_MS = 20_000;

export const AI_MAX_OUTPUT_TOKENS = 700;

export const AI_TEMPERATURE = 0.4;
