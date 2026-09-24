import { getConfig } from "../../config/index.js";
import { GeminiProvider } from "./gemini-provider.js";
import { AI_MODEL, AI_REQUEST_TIMEOUT_MS, type AiProvider } from "./provider.js";

let provider: AiProvider | undefined;

function createProvider(): AiProvider {
  const { GEMINI_API_KEY } = getConfig();

  return new GeminiProvider({
    apiKey: GEMINI_API_KEY,
    model: AI_MODEL,
    timeoutMs: AI_REQUEST_TIMEOUT_MS,
  });
}

export function getAiProvider(): AiProvider {
  provider ??= createProvider();
  return provider;
}

export function setAiProviderForTests(replacement: AiProvider | undefined): void {
  provider = replacement;
}
