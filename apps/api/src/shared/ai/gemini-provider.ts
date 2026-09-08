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

/**
 * El proveedor de IA de Google, hablado con `fetch` y sin SDK.
 *
 * Recibe TODAS sus opciones por constructor y NUNCA llama a `getConfig()`,
 * igual que `S3StorageProvider`. Es lo que permite construirlo en un test
 * apuntando a otro servidor sin tocar la configuración de la aplicación.
 *
 * POR QUÉ NO EL SDK. Tres razones, y la tercera es la que decide:
 *
 * 1. La superficie que usamos es UNA llamada: un POST de JSON. Sin streaming,
 *    sin herramientas, sin ficheros, sin embeddings, sin caché de contexto. Un
 *    árbol de dependencias entero para envolver eso.
 * 2. El precedente de AWS no aplica, y conviene decirlo antes de que alguien lo
 *    invoque: se usa el SDK de S3 porque firmar SigV4 a mano es un algoritmo
 *    crítico que no se reimplementa. Aquí no hay nada análogo.
 * 3. LA CLAVE. El logger del proyecto no enmascara nada en ejecución, así que
 *    lo único que protege el secreto es qué lleva dentro el error que sube. Con
 *    un cliente propio, ese error lo construimos nosotros y lleva un motivo y
 *    un número. Un error de SDK puede arrastrar la configuración de la petición
 *    —dirección, cabeceras— y basta que alguien escriba `logger.error("…", {
 *    error })` para filtrarla. No es hipótesis: es lo que hace hoy el
 *    `errorHandler` con cualquier error no controlado.
 *
 * COSTE ACEPTADO: somos dueños de la forma del cable y Google puede cambiarla
 * bajo nosotros. Lo tapa el esquema de abajo. Ver la decisión 1 del design.
 */

const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com";

/**
 * La forma de la respuesta de Google, validada.
 *
 * Vive AQUÍ y no en `@monedin/contracts` a propósito: la forma del cable de
 * Google no es contrato entre nuestro front y nuestro back, es asunto exclusivo
 * de este archivo. Y si Google la cambia, esto convierte el cambio en un
 * `invalid_response` —que acaba en un 503 honesto— en vez de en un `undefined`
 * llegando a la pantalla de un niño.
 */
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
  /**
   * Contra qué servidor se habla.
   *
   * Existe solo para apuntar a un doble en un test. NO está cableada a ninguna
   * variable de entorno, a diferencia de `S3_ENDPOINT`: aquella existe porque
   * MinIO existe, y aquí no hay un Gemini local al que apuntar.
   */
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
            /*
             * La clave va en una CABECERA y jamás en la dirección.
             *
             * Con `?key=…`, cualquier sitio que registre una URL —un log de
             * acceso, un mensaje de error de red, una traza— la publica. En una
             * cabecera que nadie imprime, una dirección registrada es inocua.
             */
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
      /*
       * Nada de lo capturado viaja hacia arriba: ni el mensaje, ni la causa.
       * Solo el motivo, que es lo único que el resto del sistema puede usar.
       */
      throw new AiProviderError(isTimeout(error) ? "timeout" : "unavailable");
    }
  }
}

/** Un cuerpo que no es JSON es tan ilegible como uno con otra forma. */
async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    throw new AiProviderError("invalid_response", response.status);
  }
}

/**
 * El texto de la respuesta, o `invalid_response`.
 *
 * Un candidato sin texto NO es una respuesta vacía legítima: pasa cuando el
 * modelo se corta por su filtro de contenido o por el tope de salida, y
 * devolver `""` dejaría al usuario mirando un turno en blanco sin saber que
 * algo falló. Es el mismo criterio que `objectExists()` con un 403: no
 * ablandar un fallo hasta hacerlo pasar por un caso normal.
 */
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

/** `AbortSignal.timeout()` aborta con `TimeoutError`; una cancelación, con `AbortError`. */
function isTimeout(error: unknown): boolean {
  return error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError");
}
