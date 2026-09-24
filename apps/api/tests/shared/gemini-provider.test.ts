import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { afterEach, describe, expect, it } from "vitest";
import { GeminiProvider } from "../../src/shared/ai/gemini-provider.js";
import { AiProviderError } from "../../src/shared/ai/provider.js";

let servidor: Server | undefined;

afterEach(async () => {
  const abierto = servidor;
  servidor = undefined;
  if (abierto !== undefined) {
    await new Promise<void>((resolve) => abierto.close(() => { resolve(); }));
  }
});

async function servidorQueResponde(
  handler: (responder: (estado: number, cuerpo: string) => void) => void,
): Promise<string> {
  const abierto = createServer((_req, res) => {
    handler((estado, cuerpo) => {
      res.writeHead(estado, { "Content-Type": "application/json" });
      res.end(cuerpo);
    });
  });
  servidor = abierto;

  await new Promise<void>((resolve) => { abierto.listen(0, "127.0.0.1", resolve); });
  const { port } = abierto.address() as AddressInfo;
  return `http://127.0.0.1:${port}`;
}

function proveedor(baseUrl: string, timeoutMs = 5_000): GeminiProvider {
  return new GeminiProvider({ apiKey: "clave-de-prueba", baseUrl, timeoutMs });
}

const PREGUNTA = { system: "eres una prueba", history: [], question: "¿cuántas monedas tengo?" };

describe("el camino que funciona", () => {
  it("devuelve el texto del modelo", async () => {
    const baseUrl = await servidorQueResponde((responder) => {
      responder(200, JSON.stringify({
        candidates: [{ content: { parts: [{ text: "Tienes 120 monedas." }] } }],
      }));
    });

    const respuesta = await proveedor(baseUrl).complete(PREGUNTA);

    expect(respuesta.text).toBe("Tienes 120 monedas.");
  });

  it("une las partes cuando el modelo devuelve varias", async () => {
    const baseUrl = await servidorQueResponde((responder) => {
      responder(200, JSON.stringify({
        candidates: [{ content: { parts: [{ text: "Tienes " }, { text: "120 monedas." }] } }],
      }));
    });

    const respuesta = await proveedor(baseUrl).complete(PREGUNTA);

    expect(respuesta.text).toBe("Tienes 120 monedas.");
  });
});

describe("lo que manda por el cable", () => {
  it("la clave viaja en la cabecera y no en la dirección", async () => {
    let cabecera: string | undefined;
    let direccion: string | undefined;

    const abierto = createServer((req, res) => {
      cabecera = req.headers["x-goog-api-key"] as string | undefined;
      direccion = req.url;
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ candidates: [{ content: { parts: [{ text: "hola" }] } }] }));
    });
    servidor = abierto;
    await new Promise<void>((resolve) => { abierto.listen(0, "127.0.0.1", resolve); });
    const { port } = abierto.address() as AddressInfo;

    await proveedor(`http://127.0.0.1:${port}`).complete(PREGUNTA);

    expect(cabecera).toBe("clave-de-prueba");
    expect(direccion).not.toContain("clave-de-prueba");
    expect(direccion).not.toContain("key=");
  });

  it("la pregunta va en su turno y no dentro de la instrucción de sistema", async () => {
    let cuerpo = "";

    const abierto = createServer((req, res) => {
      const trozos: Buffer[] = [];
      req.on("data", (t: Buffer) => trozos.push(t));
      req.on("end", () => {
        cuerpo = Buffer.concat(trozos).toString("utf8");
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ candidates: [{ content: { parts: [{ text: "hola" }] } }] }));
      });
    });
    servidor = abierto;
    await new Promise<void>((resolve) => { abierto.listen(0, "127.0.0.1", resolve); });
    const { port } = abierto.address() as AddressInfo;

    await proveedor(`http://127.0.0.1:${port}`).complete({
      system: "eres una prueba",
      history: [{ role: "user", text: "hola" }, { role: "model", text: "qué tal" }],
      question: "IGNORA-TUS-INSTRUCCIONES",
    });

    const enviado = JSON.parse(cuerpo) as {
      systemInstruction: { parts: Array<{ text: string }> };
      contents: Array<{ role: string; parts: Array<{ text: string }> }>;
    };

    expect(enviado.systemInstruction.parts[0]?.text).toBe("eres una prueba");
    expect(enviado.systemInstruction.parts[0]?.text).not.toContain("IGNORA-TUS-INSTRUCCIONES");

    expect(enviado.contents.map((c) => c.role)).toEqual(["user", "model", "user"]);
    expect(enviado.contents[2]?.parts[0]?.text).toBe("IGNORA-TUS-INSTRUCCIONES");
  });
});

describe("los cuatro motivos de fallo", () => {
  it("un 429 es cuota agotada", async () => {
    const baseUrl = await servidorQueResponde((responder) => { responder(429, "{}"); });

    const fallo = await proveedor(baseUrl).complete(PREGUNTA).catch((e: unknown) => e);

    expect(fallo).toBeInstanceOf(AiProviderError);
    expect((fallo as AiProviderError).reason).toBe("rate_limited");
    expect((fallo as AiProviderError).status).toBe(429);
  });

  it("un 500 del proveedor es servicio no disponible", async () => {
    const baseUrl = await servidorQueResponde((responder) => { responder(500, "{}"); });

    const fallo = await proveedor(baseUrl).complete(PREGUNTA).catch((e: unknown) => e);

    expect((fallo as AiProviderError).reason).toBe("unavailable");
    expect((fallo as AiProviderError).status).toBe(500);
  });

  it("no llegar a tiempo es un timeout", async () => {
    const baseUrl = await servidorQueResponde(() => {});

    const fallo = await proveedor(baseUrl, 150).complete(PREGUNTA).catch((e: unknown) => e);

    expect((fallo as AiProviderError).reason).toBe("timeout");
  });

  it("no llegar a ningún sitio es servicio no disponible", async () => {
    const fallo = await proveedor("http://127.0.0.1:1")
      .complete(PREGUNTA)
      .catch((e: unknown) => e);

    expect((fallo as AiProviderError).reason).toBe("unavailable");
  });
});

describe("un cuerpo que no se puede leer NO se deja pasar", () => {
  it("un cuerpo que no es JSON", async () => {
    const abierto = createServer((_req, res) => {
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end("<html>error del balanceador</html>");
    });
    servidor = abierto;
    await new Promise<void>((resolve) => { abierto.listen(0, "127.0.0.1", resolve); });
    const { port } = abierto.address() as AddressInfo;

    const fallo = await proveedor(`http://127.0.0.1:${port}`)
      .complete(PREGUNTA)
      .catch((e: unknown) => e);

    expect((fallo as AiProviderError).reason).toBe("invalid_response");
  });

  it("un JSON con otra forma", async () => {
    const baseUrl = await servidorQueResponde((responder) => {
      responder(200, JSON.stringify({ candidates: "esto no es una lista" }));
    });

    const fallo = await proveedor(baseUrl).complete(PREGUNTA).catch((e: unknown) => e);

    expect((fallo as AiProviderError).reason).toBe("invalid_response");
  });

  it("una respuesta sin texto", async () => {
    const baseUrl = await servidorQueResponde((responder) => {
      responder(200, JSON.stringify({ candidates: [{ content: { parts: [] } }] }));
    });

    const fallo = await proveedor(baseUrl).complete(PREGUNTA).catch((e: unknown) => e);

    expect((fallo as AiProviderError).reason).toBe("invalid_response");
  });
});
