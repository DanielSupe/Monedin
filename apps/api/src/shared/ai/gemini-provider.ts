import { z } from "zod";
import {
  AI_MAX_OUTPUT_TOKENS,
  AI_MODEL,
  AI_REQUEST_TIMEOUT_MS,
  AI_TEMPERATURE,
  AiProviderError,
  type AiCompletion,
  type AiCompletionRequest,
  type AiProvider,
} from "./provider.js";

const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com";

const geminiResponseSchema = z.object({
  candidates: z
    .array(
      z.object({
        content: z
          .object({
            parts: z.array(z.object({ text: z.string().optional() })).optional(),
          })
          .optional(),
      }),
    )
    .optional(),
});

export interface GeminiOptions {
  apiKey: string;
  model?: string | undefined;
  timeoutMs?: number | undefined;

  baseUrl?: string | undefined;
}

export class GeminiProvider implements AiProvider {
  readonly #apiKey: string;
  readonly #model: string;
  readonly #timeoutMs: number;
  readonly #baseUrl: string;

  constructor(options: GeminiOptions) {
    this.#apiKey = options.apiKey;
    this.#model = options.model ?? AI_MODEL;
    this.#timeoutMs = options.timeoutMs ?? AI_REQUEST_TIMEOUT_MS;
    this.#baseUrl = options.baseUrl ?? GEMINI_BASE_URL;
  }

  async complete(request: AiCompletionRequest): Promise<AiCompletion> {
    const response = await this.#post(request);

    if (response.status === 429) {
      throw new AiProviderError("rate_limited", response.status);
    }
    if (!response.ok) {
      throw new AiProviderError("unavailable", response.status);
    }

    return { text: extractText(await readJson(response)) };
  }

  async #post(request: AiCompletionRequest): Promise<Response> {
    try {
      return await fetch(
        `${this.#baseUrl}/v1beta/models/${this.#model}:generateContent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",

            "x-goog-api-key": this.#apiKey,
          },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: request.system }] },
            contents: [
              ...request.history.map((turn) => ({
                role: turn.role,
                parts: [{ text: turn.text }],
              })),
              { role: "user", parts: [{ text: request.question }] },
            ],
            generationConfig: {
              maxOutputTokens: AI_MAX_OUTPUT_TOKENS,
              temperature: AI_TEMPERATURE,
            },
          }),
          signal: AbortSignal.timeout(this.#timeoutMs),
        },
      );
    } catch (error) {
      throw new AiProviderError(isTimeout(error) ? "timeout" : "unavailable");
    }
  }
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    throw new AiProviderError("invalid_response", response.status);
  }
}

function extractText(body: unknown): string {
  const parsed = geminiResponseSchema.safeParse(body);
  if (!parsed.success) {
    throw new AiProviderError("invalid_response");
  }

  const text = (parsed.data.candidates?.[0]?.content?.parts ?? [])
    .map((part) => part.text ?? "")
    .join("")
    .trim();

  if (text === "") {
    throw new AiProviderError("invalid_response");
  }

  return text;
}

function isTimeout(error: unknown): boolean {
  return error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError");
}
