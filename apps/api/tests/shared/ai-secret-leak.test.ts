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

/**
 * La clave de Gemini NUNCA aparece en un log ni en una respuesta.
 *
 * Este test existe porque el logger del proyecto NO enmascara nada en ejecución
 * —`maskIfSecret()` solo actúa al construir el mensaje de arranque cuando la
 * configuración es inválida—, así que lo único que protege el secreto es la
 * disciplina de qué se le pasa al logger. Una regla que solo vive en un
 * documento está muerta al tercer mes, y esta protege una credencial.
 *
 * Va por el camino COMPLETO —proveedor real contra un servidor que falla,
 * servicio, traducción del error, `errorHandler`, respuesta— porque cada una de
 * esas capas es un sitio distinto donde la clave podría escaparse, y probarlas
 * sueltas dejaría fuera precisamente las costuras.
 *
 * La inyección de la violación está escrita en la tarea 3.4 del change y se
 * ejecutó: moviendo la clave a `?key=` y registrando el error con la dirección
 * dentro, este test CAE. Sin ese paso no probaría nada.
 */

const CLAVE = "CLAVE-DE-MENTIRA-ZZQX";

const app = createApp();

let servidor: Server | undefined;

beforeEach(async () => {
  await resetAuthData();
});

afterEach(async () => {
  // Se devuelve el doble de siempre, para no dejar al resto de la batería con
  // un proveedor apuntando a un servidor que ya no existe.
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

/**
 * Instala un proveedor DE VERDAD apuntado a un servidor local que siempre falla.
 *
 * Es el único sitio de la batería que se salta el doble global, y con motivo:
 * lo que se prueba es cómo se comporta el `GeminiProvider` real cuando la
 * llamada se tuerce, que es justo el momento en que un error podría arrastrar
 * la clave.
 */
async function proveedorQueFalla(estado: number): Promise<void> {
  const abierto = createServer((_req, res) => {
    res.writeHead(estado, { "Content-Type": "application/json" });
    // El propio cuerpo del proveedor lleva la clave dentro, que es lo que hacen
    // algunos servicios al devolver un error de autenticación. Si algo de esto
    // acabara en un log o en la respuesta, este test lo caza.
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

  // Se espían LAS DOS salidas: `logger.warn` va por `console.log` y
  // `logger.error` por `console.error`. Vigilar solo una dejaría la mitad.
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

    // Primero, que el camino se recorrió de verdad: sin esto, un 401 de sesión
    // haría pasar el test sin haber llamado nunca al proveedor.
    expect(status).toBe(503);
    expect(code).toBe(ERROR_CODES.SERVICE_UNAVAILABLE);

    expect(emitido).not.toContain(CLAVE);
    expect(cuerpo).not.toContain(CLAVE);
  }, 90_000);

  it("tampoco se filtra la dirección del proveedor ni la traza", async () => {
    const { cuerpo, emitido } = await preguntarConTodoEspiado(500);

    // Ni el cuerpo del error del proveedor, que llevaba la clave dentro.
    expect(emitido).not.toContain("clave rechazada");
    expect(cuerpo).not.toContain("clave rechazada");

    // Y el 503 sigue sin filtrar detalles internos, como cualquier error.
    expect(cuerpo).not.toContain("at ");
    expect(cuerpo).not.toContain(".ts:");
    expect(cuerpo).not.toContain("stack");
  }, 90_000);

  it("lo que SÍ se registra es el motivo, que es lo que sirve para diagnosticar", async () => {
    const { emitido } = await preguntarConTodoEspiado(429);

    // La otra mitad de la aserción: sin esto, un servicio que no registrara
    // NADA pasaría los casos de arriba en verde.
    expect(emitido).toContain("rate_limited");
  }, 90_000);
});
