import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { API_PREFIX, ERROR_CODES } from "@monedin/contracts";
import request from "supertest";
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createApp } from "../../src/app.js";
import { setAiProviderForTests } from "../../src/shared/ai/index.js";
import { GeminiProvider } from "../../src/shared/ai/gemini-provider.js";
import { espiaIA } from "../support/ai.js";
import { resetAuthData } from "../support/auth.js";
import { familiaOperando } from "../support/tasks.js";

const CLAVE = "CLAVE-DE-MENTIRA-ZZQX";

const app = createApp();

let servidor: Server | undefined;

beforeEach(async () => {
  await resetAuthData();
});

afterEach(async () => {
  setAiProviderForTests(espiaIA());

  const abierto = servidor;
  servidor = undefined;
  if (abierto !== undefined) {
    await new Promise<void>((resolve) => { abierto.close(() => { resolve(); }); });
  }
});

afterAll(async () => {
  await resetAuthData();
});

async function proveedorQueFalla(estado: number): Promise<void> {
  const abierto = createServer((_req, res) => {
    res.writeHead(estado, { "Content-Type": "application/json" });

    res.end(JSON.stringify({ error: { message: `clave rechazada: ${CLAVE}` } }));
  });
  servidor = abierto;
  await new Promise<void>((resolve) => { abierto.listen(0, "127.0.0.1", resolve); });
  const { port } = abierto.address() as AddressInfo;

  setAiProviderForTests(
    new GeminiProvider({ apiKey: CLAVE, baseUrl: `http://127.0.0.1:${port}`, timeoutMs: 3_000 }),
  );
}

async function preguntarConTodoEspiado(
  estado: number,
): Promise<{ cuerpo: string; emitido: string; status: number; code: unknown }> {
  await proveedorQueFalla(estado);

  const familia = await familiaOperando(app, ["Mateo"]);

  const salida = vi.spyOn(console, "log").mockImplementation(() => {});
  const fallos = vi.spyOn(console, "error").mockImplementation(() => {});

  const response = await request(app)
    .post(`${API_PREFIX}/assistant/ask`)
    .set("Cookie", familia.cookies)
    .send({ question: "¿cuántas monedas tiene Mateo?" });

  const emitido = [...salida.mock.calls, ...fallos.mock.calls]
    .map((call) => JSON.stringify(call))
    .join("\n");

  salida.mockRestore();
  fallos.mockRestore();

  return {
    cuerpo: JSON.stringify(response.body),
    emitido,
    status: response.status,
    code: response.body.code,
  };
}

describe("la clave del proveedor no se filtra cuando la llamada falla", () => {
  it.each([
    ["un 500 del proveedor", 500],
    ["una cuota agotada", 429],
    ["una clave rechazada", 401],
  ])("%s: la clave no aparece ni en el log ni en la respuesta", async (_titulo, estado) => {
    const { cuerpo, emitido, status, code } = await preguntarConTodoEspiado(estado);

    expect(status).toBe(503);
    expect(code).toBe(ERROR_CODES.SERVICE_UNAVAILABLE);

    expect(emitido).not.toContain(CLAVE);
    expect(cuerpo).not.toContain(CLAVE);
  }, 90_000);

  it("tampoco se filtra la dirección del proveedor ni la traza", async () => {
    const { cuerpo, emitido } = await preguntarConTodoEspiado(500);

    expect(emitido).not.toContain("clave rechazada");
    expect(cuerpo).not.toContain("clave rechazada");

    expect(cuerpo).not.toContain("at ");
    expect(cuerpo).not.toContain(".ts:");
    expect(cuerpo).not.toContain("stack");
  }, 90_000);

  it("lo que SÍ se registra es el motivo, que es lo que sirve para diagnosticar", async () => {
    const { emitido } = await preguntarConTodoEspiado(429);

    expect(emitido).toContain("rate_limited");
  }, 90_000);
});
