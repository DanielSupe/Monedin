import { API_PREFIX, ERROR_CODES, type Redemption, type TaskBatch } from "@monedin/contracts";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider, createMemoryHistory, createRouter } from "@tanstack/react-router";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { routeTree } from "../../src/routeTree.gen";
import { messages } from "../../src/lib/messages.js";
import { comoPadre } from "../support/router.js";

afterEach(() => {
  vi.unstubAllGlobals();
});

function tarea(id: string, status: "PENDING" | "COMPLETED" | "APPROVED") {
  return {
    id,
    batchId: "b1",
    title: "Recoger la mesa",
    description: null,
    coins: 20,
    status,
    dueDate: null,
    evidence: null,
    child: { id: `h-${id}`, name: `Hijo ${id}`, avatar: "zorro" },
    createdAt: "2026-09-01T10:00:00.000Z",
    updatedAt: "2026-09-01T10:00:00.000Z",
  };
}

function acciones(accion: string): HTMLElement[] {
  return screen.getAllByRole("button", { name: new RegExp(`^${accion}\\b`) });
}

const REPARTO_MEZCLADO = {
  batchId: "b1",
  title: "Recoger la mesa",
  description: null,
  dueDate: null,
  createdAt: "2026-09-01T10:00:00.000Z",
  tasks: [tarea("t1", "COMPLETED"), tarea("t2", "PENDING"), tarea("t3", "APPROVED")],
} as TaskBatch;

const CANJE_PENDIENTE = {
  id: "c1",
  coins: 60,
  status: "PENDING",
  reward: { id: "r1", title: "Helado" },
  child: { id: "h1", name: "Mateo", avatar: "zorro" },
  createdAt: "2026-09-01T10:00:00.000Z",
  updatedAt: "2026-09-01T10:00:00.000Z",
} as Redemption;

const CANJE_RESUELTO = { ...CANJE_PENDIENTE, id: "c2", status: "APPROVED" } as Redemption;

function pagina(items: unknown[], totalPages = 1): unknown {
  return { items, page: 1, pageSize: 20, total: items.length, totalPages };
}

function json(cuerpo: unknown, status = 200): Response {
  return new Response(JSON.stringify(cuerpo), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function montar(
  direccion: string,
  {
    repartos = [] as TaskBatch[],
    canjes = [] as Redemption[],
    totalPages = 1,
    fallaAlResolver,
  }: {
    repartos?: TaskBatch[];
    canjes?: Redemption[];
    totalPages?: number;
    fallaAlResolver?: { status: number; code: string; message: string };
  } = {},
) {
  vi.stubGlobal(
    "fetch",
    vi.fn((entrada: RequestInfo | URL, init?: RequestInit) => {
      const url = String(entrada);

      if (init?.method === "POST" && fallaAlResolver !== undefined) {
        return Promise.resolve(json(fallaAlResolver, fallaAlResolver.status));
      }

      if (url.startsWith(`${API_PREFIX}/auth/session`)) return Promise.resolve(json(comoPadre()));
      if (url.startsWith(`${API_PREFIX}/auth/profiles`))
        return Promise.resolve(json({ profiles: [] }));
      if (url.startsWith(`${API_PREFIX}/tasks`))
        return Promise.resolve(json(pagina(repartos, totalPages)));
      if (url.startsWith(`${API_PREFIX}/redemptions`))
        return Promise.resolve(json(pagina(canjes, totalPages)));

      return Promise.resolve(json(pagina([])));
    }),
  );

  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const router = createRouter({
    routeTree,
    context: { queryClient },
    history: createMemoryHistory({ initialEntries: [direccion] }),
  });

  await router.load();

  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
}

function tonoDelAviso(texto: string): string {
  const parrafo = screen.getByText(texto);
  return (parrafo.closest("[role]") ?? parrafo).className;
}

describe("un conflicto no se cuenta como un error", () => {
  const CONFLICTO = {
    status: 409,
    code: ERROR_CODES.CONFLICT,
    message: "ya no está pendiente",
  };
  const FALLO = {
    status: 422,
    code: ERROR_CODES.VALIDATION_ERROR,
    message: "algo no es válido",
  };

  it("el 409 sale en advertencia y el 422 en peligro, y NO se parecen", async () => {
    await montar("/tasks?page=1&status=ALL", {
      repartos: [REPARTO_MEZCLADO],
      fallaAlResolver: CONFLICTO,
    });

    await userEvent.click(
      (await screen.findAllByRole("button", { name: new RegExp(`^${messages.tasks.approve}\\b`) }))[0] as HTMLElement,
    );

    await screen.findByText(messages.tasks.conflict);
    const tonoConflicto = tonoDelAviso(messages.tasks.conflict);

    vi.unstubAllGlobals();
    document.body.innerHTML = "";

    await montar("/tasks?page=1&status=ALL", {
      repartos: [REPARTO_MEZCLADO],
      fallaAlResolver: FALLO,
    });

    await userEvent.click(
      (await screen.findAllByRole("button", { name: new RegExp(`^${messages.tasks.approve}\\b`) }))[0] as HTMLElement,
    );

    await screen.findByText(messages.tasks.invalidData);
    const tonoError = tonoDelAviso(messages.tasks.invalidData);

    expect(tonoConflicto).not.toEqual(tonoError);
  });
});

describe("cada fila ofrece solo lo que su estado permite", () => {
  it("en las tareas, solo la completada se puede resolver", async () => {
    await montar("/tasks?page=1&status=ALL", { repartos: [REPARTO_MEZCLADO] });

    await screen.findByText("Recoger la mesa");

    expect(acciones(messages.tasks.approve)).toHaveLength(1);
    expect(acciones(messages.tasks.reject)).toHaveLength(1);

    expect(acciones(messages.tasks.remove)).toHaveLength(1);
  });

  it("un canje ya resuelto no se puede volver a resolver", async () => {
    await montar("/redemptions?page=1&status=ALL", {
      canjes: [CANJE_PENDIENTE, { ...CANJE_RESUELTO, child: { ...CANJE_RESUELTO.child, name: "Emma" } }],
    });

    await screen.findByText("Emma");

    expect(acciones(messages.redemptions.approve)).toHaveLength(1);
    expect(acciones(messages.redemptions.reject)).toHaveLength(1);
  });
});

describe("el filtro es un conjunto de direcciones", () => {
  it("cada opción es un enlace, y la vigente se anuncia como actual", async () => {
    await montar("/tasks?page=1&status=COMPLETED", { repartos: [REPARTO_MEZCLADO] });

    const filtro = await screen.findByRole("navigation", { name: messages.tasks.filterLabel });

    const opciones = within(filtro).getAllByRole("link");
    expect(opciones).toHaveLength(4);
    expect(within(filtro).queryAllByRole("button")).toHaveLength(0);

    const vigente = within(filtro).getByRole("link", { name: messages.tasks.filterCompleted });
    expect(vigente).toHaveAttribute("aria-current", "page");
  });

  it("cambiar de filtro vuelve a la primera página", async () => {
    await montar("/tasks?page=4&status=ALL", { repartos: [REPARTO_MEZCLADO], totalPages: 6 });

    const filtro = await screen.findByRole("navigation", { name: messages.tasks.filterLabel });
    const otro = within(filtro).getByRole("link", { name: messages.tasks.filterCompleted });

    expect(otro).toHaveAttribute("href", expect.stringContaining("page=1"));
  });
});

describe("un reparto filtrado explica por qué enseña lo que no casa", () => {
  it("con filtro, lo dice", async () => {
    await montar("/tasks?page=1&status=COMPLETED", { repartos: [REPARTO_MEZCLADO] });

    await screen.findByText("Recoger la mesa");

    expect(screen.getByText(messages.tasks.wholeBatchNote)).toBeInTheDocument();

    expect(screen.getByText("Hijo t2")).toBeInTheDocument();
  });

  it("sin filtro, no hay nada que explicar", async () => {
    await montar("/tasks?page=1&status=ALL", { repartos: [REPARTO_MEZCLADO] });

    await screen.findByText("Recoger la mesa");
    expect(screen.queryByText(messages.tasks.wholeBatchNote)).toBeNull();
  });
});

describe("aprobar manda y rechazar acompaña", () => {
  it("no comparten forma, y rechazar no es una acción peligrosa", async () => {
    await montar("/tasks?page=1&status=ALL", { repartos: [REPARTO_MEZCLADO] });
    await screen.findByText("Recoger la mesa");

    const aprobar = acciones(messages.tasks.approve)[0] as HTMLElement;
    const rechazar = acciones(messages.tasks.reject)[0] as HTMLElement;
    const borrar = acciones(messages.tasks.remove)[0] as HTMLElement;

    expect(aprobar.className).not.toEqual(rechazar.className);

    expect(rechazar.className).not.toEqual(borrar.className);
  });

  it("cada acción dice sobre qué tarea y qué hijo actúa", async () => {
    await montar("/tasks?page=1&status=ALL", {
      repartos: [
        {
          batchId: "b9",
          title: "Tender la cama",
          description: null,
          dueDate: null,
          createdAt: "2026-09-01T10:00:00.000Z",
          tasks: [
            {
              ...tarea("t1", "COMPLETED"),
              title: "Tender la cama",
              child: { id: "h1", name: "Mateo", avatar: "zorro" },
            },
            {
              ...tarea("t2", "COMPLETED"),
              title: "Tender la cama",
              child: { id: "h2", name: "Emma", avatar: "lechuza" },
            },
          ],
        } as TaskBatch,
      ],
    });

    await screen.findByText("Tender la cama");

    const nombres = acciones(messages.tasks.approve).map((boton) =>
      boton.getAttribute("aria-label"),
    );

    expect(nombres).toHaveLength(2);

    expect(new Set(nombres).size).toBe(2);
    for (const nombre of nombres) {
      expect(nombre).toContain("Tender la cama");
    }
    expect(nombres.some((n) => n?.includes("Mateo"))).toBe(true);
    expect(nombres.some((n) => n?.includes("Emma"))).toBe(true);
  });
});

describe("la bandeja de canjes explica sus tres reglas", () => {
  const REGLAS = [
    messages.redemptions.ruleDiscountOnApprove,
    messages.redemptions.rulePriceFrozen,
    messages.redemptions.ruleRejectFree,
  ];

  it("con algo pendiente, las tres están en pantalla", async () => {
    await montar("/redemptions?page=1&status=ALL", { canjes: [CANJE_PENDIENTE] });

    await screen.findByText("Helado");

    for (const regla of REGLAS) {
      expect(screen.getByText(regla)).toBeInTheDocument();
    }
  });

  it("sin nada pendiente, no se dicen", async () => {
    await montar("/redemptions?page=1&status=APPROVED", { canjes: [CANJE_RESUELTO] });

    await screen.findByText("Helado");

    for (const regla of REGLAS) {
      expect(screen.queryByText(regla)).toBeNull();
    }
  });
});
