import { API_PREFIX, DEFAULT_AVATAR_KEY, ERROR_CODES } from "@monedin/contracts";
import { afterEach, describe, expect, it, vi } from "vitest";
import * as api from "../src/api/redemptions.js";
import { describeRedemptionsError } from "../src/features/redemptions/use-redemptions.js";
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

const UN_CANJE = {
  id: "canje-1",
  coins: 60,
  status: "PENDING",
  reward: { id: "premio-1", title: "Helado" },
  child: { id: "hijo-1", name: "Ana", avatar: DEFAULT_AVATAR_KEY },
  createdAt: "2026-08-24T10:00:00.000Z",
  updatedAt: "2026-08-24T10:00:00.000Z",
};

const MI_CANJE = {
  id: "canje-1",
  coins: 60,
  status: "PENDING",
  reward: { id: "premio-1", title: "Helado" },
  createdAt: "2026-08-24T10:00:00.000Z",
  updatedAt: "2026-08-24T10:00:00.000Z",
};

function unaPaginaDeBandeja(items: unknown[] = [UN_CANJE]) {
  return { items, page: 1, pageSize: 20, total: items.length, totalPages: 1 };
}

function unaPaginaPropia(items: unknown[] = [MI_CANJE]) {
  return { items, page: 1, pageSize: 20, total: items.length, totalPages: 1 };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("cliente de canjes", () => {
  it("usa las rutas del contrato compartido", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, unaPaginaDeBandeja()));
    vi.stubGlobal("fetch", fetchMock);

    await api.fetchRedemptions();

    expect(fetchMock).toHaveBeenCalledWith(`${API_PREFIX}/redemptions`, expect.anything());
  });

  it("construye el query string del filtro tal cual lo espera la API", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, unaPaginaDeBandeja()));
    vi.stubGlobal("fetch", fetchMock);

    await api.fetchRedemptions({ page: 2, pageSize: 5, status: "PENDING", childId: "hijo-1" });

    expect(fetchMock).toHaveBeenCalledWith(
      `${API_PREFIX}/redemptions?page=2&pageSize=5&status=PENDING&childId=hijo-1`,
      expect.anything(),
    );
  });

  it("sin filtros no añade parámetros vacíos", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, unaPaginaDeBandeja()));
    vi.stubGlobal("fetch", fetchMock);

    await api.fetchRedemptions({});

    expect(fetchMock.mock.calls[0]?.[0]).not.toContain("?");
  });

  it("solicitar va por POST y NO envía el hijo ni el precio", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(201, MI_CANJE));
    vi.stubGlobal("fetch", fetchMock);

    await api.createRedemption({ rewardId: "premio-1" });

    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe(`${API_PREFIX}/redemptions`);
    expect(init.method).toBe("POST");
    expect(init.body).not.toContain("childId");
    expect(init.body).not.toContain("coins");
  });

  it("aprobar va por POST sobre /approve, sin cuerpo", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, UN_CANJE));
    vi.stubGlobal("fetch", fetchMock);

    await api.approveRedemption("canje-1");

    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe(`${API_PREFIX}/redemptions/canje-1/approve`);
    expect(init.method).toBe("POST");
    expect(init.body).toBeUndefined();
  });

  it("rechazar va por POST sobre /reject, sin cuerpo", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, { ...UN_CANJE, status: "REJECTED" }));
    vi.stubGlobal("fetch", fetchMock);

    await api.rejectRedemption("canje-1");

    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe(`${API_PREFIX}/redemptions/canje-1/reject`);
    expect(init.method).toBe("POST");
    expect(init.body).toBeUndefined();
  });

  it("la lista propia no lleva identificador de hijo", async () => {
    // Si lo llevara, un niño podría pedir los canjes de su hermano. La API lo
    // rechazaría con 422 porque su esquema es estricto, pero la garantía buena
    // es que aquí no hay ningún parámetro que ponerlo.
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, unaPaginaPropia()));
    vi.stubGlobal("fetch", fetchMock);

    await api.fetchOwnRedemptions({ page: 2 });

    const url = fetchMock.mock.calls[0]?.[0] as string;
    expect(url).toBe(`${API_PREFIX}/redemptions/mine?page=2`);
    expect(url).not.toContain("childId");
  });

  it("una página sin items falla como forma inesperada, no pasa en silencio", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(jsonResponse(200, { page: 1, pageSize: 20, total: 0, totalPages: 1 })),
    );

    await expect(api.fetchRedemptions()).rejects.toBeInstanceOf(ApiRequestError);
  });

  it("un canje propio sin estado tampoco pasa: no es la forma del contrato", async () => {
    const { status: _status, ...sinEstado } = MI_CANJE as typeof MI_CANJE & { status: string };
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse(200, unaPaginaPropia([sinEstado]))),
    );

    await expect(api.fetchOwnRedemptions()).rejects.toBeInstanceOf(ApiRequestError);
  });
});

describe("traducción de errores de canjes", () => {
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

  it("un 404 es «no encontramos ese canje», y NO reutiliza el texto de tareas ni premios", () => {
    const texto = describeRedemptionsError(errorCon(ERROR_CODES.NOT_FOUND));

    expect(texto).toBe(messages.redemptions.notFound);
    expect(texto).not.toBe(messages.tasks.notFound);
    expect(texto).not.toBe(messages.rewards.notFound);
    expect(describeTasksError(errorCon(ERROR_CODES.NOT_FOUND))).not.toBe(texto);
    expect(describeRewardsError(errorCon(ERROR_CODES.NOT_FOUND))).not.toBe(texto);
  });

  it("un 409 cubre transición perdida, saldo insuficiente y duplicado con el mismo texto", () => {
    const texto = describeRedemptionsError(errorCon(ERROR_CODES.CONFLICT));

    expect(texto).toBe(messages.redemptions.conflict);
    expect(describeTasksError(errorCon(ERROR_CODES.CONFLICT))).not.toBe(texto);
  });

  it("un 403 explica que no es desde este perfil", () => {
    expect(describeRedemptionsError(errorCon(ERROR_CODES.FORBIDDEN))).toBe(
      messages.redemptions.forbidden,
    );
  });

  it("una validación enseña el primer campo que falla", () => {
    const texto = describeRedemptionsError(
      errorCon(ERROR_CODES.VALIDATION_ERROR, [
        { field: "rewardId", code: "too_small", message: "Falta el identificador del premio." },
      ]),
    );

    expect(texto).toBe("Falta el identificador del premio.");
  });

  it("un fallo de red no se confunde con un error de la API", () => {
    expect(describeRedemptionsError(new Error("boom"))).toBe(messages.errors.network);
  });
});
