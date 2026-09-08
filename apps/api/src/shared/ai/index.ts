export { getAiProvider, setAiProviderForTests } from "./client.js";
export { GeminiProvider } from "./gemini-provider.js";
export type { GeminiOptions } from "./gemini-provider.js";
export {
  AI_MAX_OUTPUT_TOKENS,
  AI_MODEL,
  AI_REQUEST_TIMEOUT_MS,
  AI_TEMPERATURE,
  AiProviderError,
} from "./provider.js";
export type {
  AiCompletion,
  AiCompletionRequest,
  AiFailureReason,
  AiProvider,
  AiRole,
  AiTurn,
} from "./provider.js";
