import { API_PREFIX, DEFAULT_AVATAR_KEY, ERROR_CODES } from "@monedin/contracts";
import { afterEach, describe, expect, it, vi } from "vitest";
import * as api from "../src/api/tasks.js";
import { describeTaskStatus, describeTasksError } from "../src/features/tasks/use-tasks.js";
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

const UNA_TAREA = {
  id: "tarea-1",
  batchId: "reparto-1",
  title: "Sacar la basura",
  description: null,
  coins: 25,
  status: "PENDING",
  dueDate: null,
  child: { id: "hijo-1", name: "Ana", avatar: DEFAULT_AVATAR_KEY },
  createdAt: "2026-08-24T10:00:00.000Z",
  updatedAt: "2026-08-24T10:00:00.000Z",
};

const UNA_TAREA_PROPIA = {
  id: "tarea-1",
  title: "Sacar la basura",
  description: null,
  coins: 25,
  status: "PENDING",
  dueDate: null,
  createdAt: "2026-08-24T10:00:00.000Z",
};

function unaPaginaDeRepartos(items: unknown[] = [
  {
    batchId: "reparto-1",
    title: "Sacar la basura",
    description: null,
    dueDate: null,
    createdAt: "2026-08-24T10:00:00.000Z",
    tasks: [UNA_TAREA],
  },
]) {
  return { items, page: 1, pageSize: 20, total: items.length, totalPages: 1 };
}

function unaPaginaPropia(items: unknown[] = [UNA_TAREA_PROPIA]) {
  return { items, page: 1, pageSize: 20, total: items.length, totalPages: 1 };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("cliente de tareas", () => {
  it("usa las rutas del contrato compartido", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, unaPaginaDeRepartos()));
    vi.stubGlobal("fetch", fetchMock);

    await api.fetchTaskBatches();

    expect(fetchMock).toHaveBeenCalledWith(`${API_PREFIX}/tasks`, expect.anything());
  });

  it("construye el query string de los filtros tal cual lo espera la API", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, unaPaginaDeRepartos()));
    vi.stubGlobal("fetch", fetchMock);

    await api.fetchTaskBatches({ page: 2, pageSize: 5, status: "COMPLETED", childId: "hijo-1" });

    expect(fetchMock).toHaveBeenCalledWith(
      `${API_PREFIX}/tasks?page=2&pageSize=5&status=COMPLETED&childId=hijo-1`,
      expect.anything(),
    );
  });

  it("sin filtros no añade parámetros vacíos", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, unaPaginaDeRepartos()));
    vi.stubGlobal("fetch", fetchMock);

    await api.fetchTaskBatches({});

    expect(fetchMock.mock.calls[0]?.[0]).not.toContain("?");
  });

  it("el alta va por POST y NO envía el padre dueño ni el estado", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(201, [UNA_TAREA]));
    vi.stubGlobal("fetch", fetchMock);

    await api.createTasks({ title: "Sacar la basura", childIds: ["hijo-1"], coins: 25 });

    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe(`${API_PREFIX}/tasks`);
    expect(init.method).toBe("POST");
    expect(init.body).not.toContain("parentId");
    expect(init.body).not.toContain("status");
  });

  it("el alta devuelve UNA TAREA POR HIJO, no un objeto suelto", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse(201, [UNA_TAREA, { ...UNA_TAREA, id: "tarea-2" }])),
    );

    const creadas = await api.createTasks({
      title: "Sacar la basura",
      childIds: ["hijo-1", "hijo-2"],
      coins: 25,
    });

    expect(creadas).toHaveLength(2);
  });

  it("las transiciones van por POST, no por PATCH", async () => {
    // Una `Response` solo se puede leer una vez, así que cada llamada necesita
    // la suya: con `mockResolvedValue` las dos compartirían el mismo cuerpo.
    const fetchMock = vi
      .fn()
      .mockImplementation(() => Promise.resolve(jsonResponse(200, UNA_TAREA)));
    vi.stubGlobal("fetch", fetchMock);

    await api.approveTask("tarea-1");
    await api.rejectTask("tarea-1");

    expect(fetchMock.mock.calls[0]?.[0]).toBe(`${API_PREFIX}/tasks/tarea-1/approve`);
    expect(fetchMock.mock.calls[0]?.[1].method).toBe("POST");
    expect(fetchMock.mock.calls[1]?.[0]).toBe(`${API_PREFIX}/tasks/tarea-1/reject`);
    expect(fetchMock.mock.calls[1]?.[1].method).toBe("POST");
  });

  it("el borrado va por DELETE y no espera cuerpo", async () => {
    const fetchMock = vi.fn().mockResolvedValue(emptyResponse(204));
    vi.stubGlobal("fetch", fetchMock);

    await api.deleteTask("tarea-1");

    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe(`${API_PREFIX}/tasks/tarea-1`);
    expect(init.method).toBe("DELETE");
  });

  it("la lista del niño no lleva identificador de hijo", async () => {
    // Si lo llevara, un niño podría apuntar a las tareas de su hermano. La API
    // lo rechazaría con 422 porque su esquema es estricto, pero la garantía
    // buena es que aquí no hay ningún parámetro que ponerlo.
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, unaPaginaPropia()));
    vi.stubGlobal("fetch", fetchMock);

    await api.fetchOwnTasks({ status: "PENDING" });

    const url = fetchMock.mock.calls[0]?.[0] as string;
    expect(url).toBe(`${API_PREFIX}/tasks/mine?status=PENDING`);
    expect(url).not.toContain("childId");
  });

  it("marcar como hecha es POST sobre la propia tarea", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, UNA_TAREA_PROPIA));
    vi.stubGlobal("fetch", fetchMock);

    await api.completeTask("tarea-1");

    expect(fetchMock.mock.calls[0]?.[0]).toBe(`${API_PREFIX}/tasks/tarea-1/complete`);
    expect(fetchMock.mock.calls[0]?.[1].method).toBe("POST");
  });

  it("una página sin items falla como forma inesperada, no pasa en silencio", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(jsonResponse(200, { page: 1, pageSize: 20, total: 0, totalPages: 1 })),
    );

    await expect(api.fetchTaskBatches()).rejects.toBeInstanceOf(ApiRequestError);
  });

  it("un reparto sin sus tareas tampoco pasa", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse(
          200,
          unaPaginaDeRepartos([
            {
              batchId: "reparto-1",
              title: "Sacar la basura",
              description: null,
              dueDate: null,
              createdAt: "2026-08-24T10:00:00.000Z",
            },
          ]),
        ),
      ),
    );

    await expect(api.fetchTaskBatches()).rejects.toBeInstanceOf(ApiRequestError);
  });

  it("un estado que no existe en el contrato tampoco pasa", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(jsonResponse(200, unaPaginaPropia([{ ...UNA_TAREA_PROPIA, status: "REJECTED" }]))),
    );

    await expect(api.fetchOwnTasks()).rejects.toBeInstanceOf(ApiRequestError);
  });
});

describe("traducción de errores de tareas", () => {
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

  it("un conflicto es «esa tarea ya no está pendiente», NO el tope de perfiles", () => {
    // Es el test que impide reutilizar `describeChildrenError`: allí el mismo
    // código significa «esta familia ya tiene el máximo de perfiles».
    const texto = describeTasksError(errorCon(ERROR_CODES.CONFLICT));

    expect(texto).toBe(messages.tasks.conflict);
    expect(texto).not.toBe(messages.children.maxReached);
  });

  it("decide por el código y no por el texto del mensaje", () => {
    expect(describeTasksError(errorCon(ERROR_CODES.NOT_FOUND))).toBe(messages.tasks.notFound);
  });

  it("un 403 explica que no es desde este perfil", () => {
    expect(describeTasksError(errorCon(ERROR_CODES.FORBIDDEN))).toBe(messages.tasks.forbidden);
  });

  it("una validación enseña el primer campo que falla", () => {
    const texto = describeTasksError(
      errorCon(ERROR_CODES.VALIDATION_ERROR, [
        { field: "coins", code: "too_small", message: "Una tarea vale como mínimo 1 moneda." },
      ]),
    );

    expect(texto).toBe("Una tarea vale como mínimo 1 moneda.");
  });

  it("un fallo de red no se confunde con un error de la API", () => {
    expect(describeTasksError(new Error("boom"))).toBe(messages.errors.network);
  });
});

describe("cómo se lee cada estado", () => {
  it("los tres estados tienen texto propio", () => {
    expect(describeTaskStatus("PENDING")).toBe(messages.tasks.statusPending);
    expect(describeTaskStatus("COMPLETED")).toBe(messages.tasks.statusCompleted);
    expect(describeTaskStatus("APPROVED")).toBe(messages.tasks.statusApproved);
  });

  it("el texto de «hecha» deja claro que todavía no ha pagado", () => {
    // Que marcarla no pague es lo que hace que la aprobación signifique algo:
    // la interfaz tiene que decirlo.
    expect(messages.tasks.statusCompleted).toMatch(/esperando/i);
  });
});
