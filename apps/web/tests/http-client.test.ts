import { API_PREFIX, ERROR_CODES } from "@monedin/contracts";
import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { ApiRequestError, apiFetch } from "../src/lib/http-client.js";

/** Respuesta falsa con el cuerpo de error estándar de la API. */
function errorResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function okResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

const schema = z.object({ status: z.literal("ok") });

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("cliente HTTP", () => {
  it("antepone el prefijo de la API que declaran los contratos", async () => {
    const fetchMock = vi.fn().mockResolvedValue(okResponse({ status: "ok" }));
    vi.stubGlobal("fetch", fetchMock);

    await apiFetch("/health", schema);

    expect(fetchMock).toHaveBeenCalledWith(`${API_PREFIX}/health`, expect.anything());
  });

  it("devuelve la respuesta validada contra el esquema compartido", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(okResponse({ status: "ok" })));

    await expect(apiFetch("/health", schema)).resolves.toEqual({ status: "ok" });
  });

  it("expone el código de error sin depender del texto del mensaje", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        errorResponse(403, {
          code: ERROR_CODES.FORBIDDEN,
          message: "No tienes permiso para acceder a esto.",
        }),
      ),
    );

    const error = await apiFetch("/children/1", schema).catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(ApiRequestError);
    expect((error as ApiRequestError).code).toBe(ERROR_CODES.FORBIDDEN);
    expect((error as ApiRequestError).status).toBe(403);
  });

  it("sigue exponiendo el mismo código aunque cambie la redacción del mensaje", async () => {
    const codigos: string[] = [];

    for (const mensaje of ["No tienes permiso.", "Otra redacción completamente distinta."]) {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue(errorResponse(403, { code: ERROR_CODES.FORBIDDEN, message: mensaje })),
      );

      const error = await apiFetch("/children/1", schema).catch((caught: unknown) => caught);
      codigos.push((error as ApiRequestError).code);
    }

    expect(new Set(codigos).size).toBe(1);
    expect(codigos[0]).toBe(ERROR_CODES.FORBIDDEN);
  });

  it("expone el detalle por campo de un error de validación", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        errorResponse(422, {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: "Algunos datos no son válidos.",
          details: [
            { field: "title", code: "too_small", message: "Título demasiado corto." },
            { field: "coins", code: "too_small", message: "Las monedas empiezan en 1." },
          ],
        }),
      ),
    );

    const error = (await apiFetch("/tasks", schema).catch((caught: unknown) => caught)) as ApiRequestError;

    expect(error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    expect(error.details.map((detail) => detail.field)).toEqual(["title", "coins"]);
  });

  it("conserva el identificador de incidente de un error inesperado", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        errorResponse(500, {
          code: ERROR_CODES.INTERNAL_ERROR,
          message: "Ocurrió un error inesperado.",
          incidentId: "0f8b2c1e-0000-4000-8000-000000000000",
        }),
      ),
    );

    const error = (await apiFetch("/health", schema).catch((caught: unknown) => caught)) as ApiRequestError;

    expect(error.incidentId).toBe("0f8b2c1e-0000-4000-8000-000000000000");
  });

  it("construye un error con la misma forma cuando el cuerpo no cumple el contrato", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response("<html>502 Bad Gateway</html>", {
          status: 502,
          headers: { "Content-Type": "text/html" },
        }),
      ),
    );

    const error = (await apiFetch("/health", schema).catch((caught: unknown) => caught)) as ApiRequestError;

    expect(error).toBeInstanceOf(ApiRequestError);
    expect(error.status).toBe(502);
    expect(error.code).toBe(ERROR_CODES.INTERNAL_ERROR);
    expect(error.details).toEqual([]);
  });

  it("señala una respuesta correcta que no cumple el contrato compartido", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(okResponse({ status: "raro" })));

    const error = (await apiFetch("/health", schema).catch((caught: unknown) => caught)) as ApiRequestError;

    expect(error).toBeInstanceOf(ApiRequestError);
    expect(error.code).toBe(ERROR_CODES.INTERNAL_ERROR);
  });

  it("convierte un fallo de red en el mismo tipo de error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));

    const error = (await apiFetch("/health", schema).catch((caught: unknown) => caught)) as ApiRequestError;

    expect(error).toBeInstanceOf(ApiRequestError);
    expect(error.status).toBe(0);
  });
});
