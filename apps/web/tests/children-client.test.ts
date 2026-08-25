import { API_PREFIX, DEFAULT_AVATAR_KEY, ERROR_CODES } from "@monedin/contracts";
import { afterEach, describe, expect, it, vi } from "vitest";
import * as api from "../src/api/children.js";
import { describeChildrenError } from "../src/features/children/use-children.js";
import { ApiRequestError } from "../src/lib/http-client.js";
import { messages } from "../src/lib/messages.js";

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function emptyResponse(status: number): Response {
  return new Response(null, { status });
}

const UN_HIJO = {
  id: "abc",
  name: "Mateo",
  avatar: DEFAULT_AVATAR_KEY,
  age: 8,
  coins: 0,
  locked: false,
  createdAt: "2026-08-24T10:00:00.000Z",
};

function unaPagina(items: unknown[] = [UN_HIJO]) {
  return { items, page: 1, pageSize: 20, total: items.length, totalPages: 1 };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("cliente de perfiles de hijo", () => {
  it("usa las rutas del contrato compartido", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, unaPagina()));
    vi.stubGlobal("fetch", fetchMock);

    await api.fetchChildren();

    expect(fetchMock).toHaveBeenCalledWith(`${API_PREFIX}/children`, expect.anything());
  });

  it("construye el query string de paginación tal cual lo espera la API", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, unaPagina()));
    vi.stubGlobal("fetch", fetchMock);

    await api.fetchChildren({ page: 3, pageSize: 5 });

    expect(fetchMock).toHaveBeenCalledWith(
      `${API_PREFIX}/children?page=3&pageSize=5`,
      expect.anything(),
    );
  });

  it("sin paginación no añade parámetros vacíos", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, unaPagina()));
    vi.stubGlobal("fetch", fetchMock);

    await api.fetchChildren();

    expect(fetchMock.mock.calls[0]?.[0]).not.toContain("?");
  });

  it("el alta va por POST y NO envía el padre dueño", async () => {
    // El padre sale de la sesión. Mandarlo sería además un 422, porque el
    // esquema del alta es estricto.
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(201, UN_HIJO));
    vi.stubGlobal("fetch", fetchMock);

    await api.createChild({ name: "Mateo", pin: "1234" });

    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe(`${API_PREFIX}/children`);
    expect(init.method).toBe("POST");
    expect(init.body).not.toContain("parentId");
    expect(init.body).not.toContain("coins");
  });

  it("la baja va por DELETE y no espera cuerpo", async () => {
    const fetchMock = vi.fn().mockResolvedValue(emptyResponse(204));
    vi.stubGlobal("fetch", fetchMock);

    await api.deactivateChild("abc");

    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe(`${API_PREFIX}/children/abc`);
    expect(init.method).toBe("DELETE");
  });

  it("la vista propia del niño no lleva identificador", async () => {
    // Si lo llevara, un niño podría apuntar al perfil de un hermano.
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, UN_HIJO));
    vi.stubGlobal("fetch", fetchMock);

    await api.fetchOwnChild();

    expect(fetchMock).toHaveBeenCalledWith(`${API_PREFIX}/children/me`, expect.anything());
  });

  it("una página sin items falla como forma inesperada, no pasa en silencio", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse(200, { page: 1, pageSize: 20, total: 0, totalPages: 1 })),
    );

    await expect(api.fetchChildren()).rejects.toBeInstanceOf(ApiRequestError);
  });

  it("un hijo con avatar fuera del catálogo tampoco pasa", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse(200, unaPagina([{ ...UN_HIJO, avatar: "dragon" }]))),
    );

    await expect(api.fetchChildren()).rejects.toBeInstanceOf(ApiRequestError);
  });
});

describe("traducción de errores de perfiles", () => {
  function errorCon(code: string, details: Array<{ field: string; code: string; message: string }> = []) {
    return new ApiRequestError({
      status: 400,
      code,
      message: "da igual lo que ponga",
      details,
    });
  }

  it("un conflicto es el tope de perfiles, NO un correo repetido", () => {
    // Es el test que impide reutilizar `describeAuthError`: allí el mismo
    // código significa «ese correo ya está registrado».
    const texto = describeChildrenError(errorCon(ERROR_CODES.CONFLICT));

    expect(texto).toBe(messages.children.maxReached);
    expect(texto).not.toBe(messages.auth.emailTaken);
  });

  it("decide por el código y no por el texto del mensaje", () => {
    const texto = describeChildrenError(errorCon(ERROR_CODES.NOT_FOUND));

    expect(texto).toBe(messages.children.notFound);
  });

  it("un 403 explica que no es desde este perfil", () => {
    expect(describeChildrenError(errorCon(ERROR_CODES.FORBIDDEN))).toBe(messages.children.forbidden);
  });

  it("una validación enseña el primer campo que falla", () => {
    const texto = describeChildrenError(
      errorCon(ERROR_CODES.VALIDATION_ERROR, [
        { field: "name", code: "too_small", message: "El nombre es demasiado corto." },
      ]),
    );

    expect(texto).toBe("El nombre es demasiado corto.");
  });

  it("un fallo de red no se confunde con un error de la API", () => {
    expect(describeChildrenError(new Error("boom"))).toBe(messages.errors.network);
  });
});

describe("catálogo de textos de perfiles", () => {
  it("la confirmación de baja avisa de que no se puede deshacer", () => {
    // La baja es definitiva: decirlo DESPUÉS no sirve de nada.
    expect(messages.children.deactivateConfirm).toMatch(/no se puede recuperar/i);
  });

  it("el aviso de baja tranquiliza sobre el historial", () => {
    expect(messages.children.deactivateConfirm).toMatch(/historial/i);
  });
});
