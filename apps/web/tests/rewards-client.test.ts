import { API_PREFIX, DEFAULT_AVATAR_KEY, ERROR_CODES } from "@monedin/contracts";
import { afterEach, describe, expect, it, vi } from "vitest";
import * as api from "../src/api/rewards.js";
import { describeRewardsError } from "../src/features/rewards/use-rewards.js";
import { describeTasksError } from "../src/features/tasks/use-tasks.js";
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

const UN_PREMIO = {
  id: "premio-1",
  title: "Ir al cine",
  description: null,
  status: "ACTIVE",
  offers: [{ child: { id: "hijo-1", name: "Ana", avatar: DEFAULT_AVATAR_KEY }, coins: 200 }],
  createdAt: "2026-08-24T10:00:00.000Z",
  updatedAt: "2026-08-24T10:00:00.000Z",
};

const MI_PREMIO = {
  id: "premio-1",
  title: "Ir al cine",
  description: null,
  coins: 200,
  affordable: false,
  createdAt: "2026-08-24T10:00:00.000Z",
};

function unaPaginaDeCatalogo(items: unknown[] = [UN_PREMIO]) {
  return { items, page: 1, pageSize: 20, total: items.length, totalPages: 1 };
}

function unaPaginaPropia(items: unknown[] = [MI_PREMIO]) {
  return { items, page: 1, pageSize: 20, total: items.length, totalPages: 1 };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("cliente de premios", () => {
  it("usa las rutas del contrato compartido", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, unaPaginaDeCatalogo()));
    vi.stubGlobal("fetch", fetchMock);

    await api.fetchRewards();

    expect(fetchMock).toHaveBeenCalledWith(`${API_PREFIX}/rewards`, expect.anything());
  });

  it("construye el query string del filtro tal cual lo espera la API", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, unaPaginaDeCatalogo()));
    vi.stubGlobal("fetch", fetchMock);

    await api.fetchRewards({ page: 2, pageSize: 5, status: "RETIRED" });

    expect(fetchMock).toHaveBeenCalledWith(
      `${API_PREFIX}/rewards?page=2&pageSize=5&status=RETIRED`,
      expect.anything(),
    );
  });

  it("sin filtros no añade parámetros vacíos", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, unaPaginaDeCatalogo()));
    vi.stubGlobal("fetch", fetchMock);

    await api.fetchRewards({});

    expect(fetchMock.mock.calls[0]?.[0]).not.toContain("?");
  });

  it("el alta va por POST y NO envía el padre dueño ni el estado inicial", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(201, UN_PREMIO));
    vi.stubGlobal("fetch", fetchMock);

    await api.createReward({ title: "Ir al cine", childIds: ["hijo-1"], coins: 200 });

    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe(`${API_PREFIX}/rewards`);
    expect(init.method).toBe("POST");
    expect(init.body).not.toContain("parentId");
    expect(init.body).not.toContain("isActive");
  });

  it("editar el premio va por PATCH y NO envía monedas", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, UN_PREMIO));
    vi.stubGlobal("fetch", fetchMock);

    await api.updateReward("premio-1", { title: "Otro título" });

    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe(`${API_PREFIX}/rewards/premio-1`);
    expect(init.method).toBe("PATCH");
    expect(init.body).not.toContain("coins");
  });

  it("el reemplazo de ofertas va por PUT sobre /assignments", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, UN_PREMIO));
    vi.stubGlobal("fetch", fetchMock);

    await api.replaceAssignments("premio-1", {
      assignments: [{ childId: "hijo-1", coins: 200 }],
    });

    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe(`${API_PREFIX}/rewards/premio-1/assignments`);
    expect(init.method).toBe("PUT");
  });

  it("retirar va por DELETE y no espera cuerpo", async () => {
    const fetchMock = vi.fn().mockResolvedValue(emptyResponse(204));
    vi.stubGlobal("fetch", fetchMock);

    await api.retireReward("premio-1");

    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe(`${API_PREFIX}/rewards/premio-1`);
    expect(init.method).toBe("DELETE");
  });

  it("el escaparate no lleva identificador de hijo", async () => {
    // Si lo llevara, un niño podría apuntar al precio de su hermano. La API lo
    // rechazaría con 422 porque su esquema es estricto, pero la garantía buena
    // es que aquí no hay ningún parámetro que ponerlo.
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, unaPaginaPropia()));
    vi.stubGlobal("fetch", fetchMock);

    await api.fetchOwnRewards({ page: 2 });

    const url = fetchMock.mock.calls[0]?.[0] as string;
    expect(url).toBe(`${API_PREFIX}/rewards/mine?page=2`);
    expect(url).not.toContain("childId");
  });

  it("una página sin items falla como forma inesperada, no pasa en silencio", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(jsonResponse(200, { page: 1, pageSize: 20, total: 0, totalPages: 1 })),
    );

    await expect(api.fetchRewards()).rejects.toBeInstanceOf(ApiRequestError);
  });

  it("un premio propio sin affordable tampoco pasa: no es la forma del contrato", async () => {
    const { affordable: _affordable, ...sinAffordable } = MI_PREMIO as typeof MI_PREMIO & {
      affordable: boolean;
    };
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse(200, unaPaginaPropia([sinAffordable]))),
    );

    await expect(api.fetchOwnRewards()).rejects.toBeInstanceOf(ApiRequestError);
  });
});

describe("traducción de errores de premios", () => {
  function errorCon(
    code: string,
    details: Array<{ field: string; code: string; message: string }> = [],
  ) {
    return new ApiRequestError({
      status: 400,
      code,
      message: "da igual lo que ponga",
      details,
    });
  }

  it("un 404 es «no encontramos ese premio», y NO reutiliza el texto de tareas", () => {
    // Es el test que impide reutilizar `describeTasksError`: allí un 404
    // significa «esa tarea ya no está». Un mismo código HTTP no dice lo mismo
    // en dos módulos distintos.
    const texto = describeRewardsError(errorCon(ERROR_CODES.NOT_FOUND));

    expect(texto).toBe(messages.rewards.notFound);
    expect(texto).not.toBe(messages.tasks.notFound);
    expect(describeTasksError(errorCon(ERROR_CODES.NOT_FOUND))).not.toBe(texto);
  });

  it("un 403 explica que no es desde este perfil", () => {
    expect(describeRewardsError(errorCon(ERROR_CODES.FORBIDDEN))).toBe(messages.rewards.forbidden);
  });

  it("una validación enseña el primer campo que falla", () => {
    const texto = describeRewardsError(
      errorCon(ERROR_CODES.VALIDATION_ERROR, [
        { field: "coins", code: "too_small", message: "Tiene que ser como mínimo 1 moneda." },
      ]),
    );

    expect(texto).toBe("Tiene que ser como mínimo 1 moneda.");
  });

  it("un fallo de red no se confunde con un error de la API", () => {
    expect(describeRewardsError(new Error("boom"))).toBe(messages.errors.network);
  });
});
