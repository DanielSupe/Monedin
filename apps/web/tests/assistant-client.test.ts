import { API_PREFIX, ERROR_CODES } from "@monedin/contracts";
import { afterEach, describe, expect, it, vi } from "vitest";
import * as api from "../src/api/assistant.js";
import { describeAssistantError } from "../src/features/assistant/use-assistant.js";
import { ApiRequestError } from "../src/lib/http-client.js";
import { messages } from "../src/lib/messages.js";

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("cliente del asistente", () => {
  it("usa la ruta del contrato compartido, con POST", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, { answer: "hola" }));
    vi.stubGlobal("fetch", fetchMock);

    await api.askAssistant({ question: "¿cuánto me falta?", history: [] });

    expect(fetchMock).toHaveBeenCalledWith(
      `${API_PREFIX}/assistant/ask`,
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("manda la pregunta y el hilo tal cual", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, { answer: "hola" }));
    vi.stubGlobal("fetch", fetchMock);

    await api.askAssistant({
      question: "¿y ahora?",
      history: [{ role: "user", text: "antes" }],
    });

    const enviado: unknown = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body));

    expect(enviado).toEqual({
      question: "¿y ahora?",
      history: [{ role: "user", text: "antes" }],
    });
  });

  it("devuelve la respuesta validada contra el contrato", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(200, { answer: "Tienes 120." })));

    await expect(api.askAssistant({ question: "hola", history: [] })).resolves.toEqual({
      answer: "Tienes 120.",
    });
  });

  it("una respuesta con otra forma NO se deja pasar", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(200, { texto: "hola" })));

    await expect(api.askAssistant({ question: "hola", history: [] })).rejects.toBeInstanceOf(
      ApiRequestError,
    );
  });
});

describe("cómo se cuenta cada fallo", () => {
  /*
   * Por el CÓDIGO y nunca por el texto. Y con el 503 en su propia rama: sin
   * él, un fallo de Google caería en «no se pudo contactar con el servidor»,
   * que es mentira cuando la red iba perfectamente. Ese es justamente el motivo
   * de que el código exista.
   */
  it.each([
    [ERROR_CODES.SERVICE_UNAVAILABLE, messages.assistant.unavailable],
    [ERROR_CODES.VALIDATION_ERROR, messages.assistant.invalidQuestion],
    [ERROR_CODES.UNAUTHORIZED, messages.assistant.signedOut],
    [ERROR_CODES.INTERNAL_ERROR, messages.errors.network],
  ])("%s se cuenta con su propio mensaje", (code, esperado) => {
    const error = new ApiRequestError({ status: 500, code, message: "da igual el texto" });

    expect(describeAssistantError(error)).toBe(esperado);
  });

  it("lo que no es un error de la API se cuenta como fallo de red", () => {
    expect(describeAssistantError(new Error("otra cosa"))).toBe(messages.errors.network);
  });
});
