import {
  API_PREFIX,
  DEFAULT_PAGE_SIZE,
  MAX_CHILDREN_PER_FAMILY,
  type Child,
  type Redemption,
  type TaskBatch,
} from "@monedin/contracts";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider, createMemoryHistory, createRouter } from "@tanstack/react-router";
import { render, screen } from "@testing-library/react";
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
    title: "Recoger la mesa",
    description: null,
    coins: 20,
    dueDate: null,
    status,
    evidence: null,
    createdAt: "2026-09-01T10:00:00.000Z",
    updatedAt: "2026-09-01T10:00:00.000Z",
    child: { id: `hijo-${id}`, name: "Ana", avatar: "zorro" },
    batchId: "b1",
  };
}

function reparto(batchId: string, estados: Array<"PENDING" | "COMPLETED" | "APPROVED">): TaskBatch {
  return {
    batchId,
    title: "Recoger la mesa",
    description: null,
    dueDate: null,
    createdAt: "2026-09-01T10:00:00.000Z",
    tasks: estados.map((estado, i) => ({ ...tarea(`${batchId}-${i}`, estado), batchId })),
  } as TaskBatch;
}

const HIJOS: Child[] = [
  {
    id: "h1",
    name: "Mateo",
    avatar: "zorro",
    age: 8,
    coins: 120,
    locked: false,
    createdAt: "2026-09-01T10:00:00.000Z",
  },
];

function pagina(items: unknown[], extra: { total?: number; totalPages?: number } = {}): unknown {
  return {
    items,
    page: 1,
    pageSize: 20,
    total: extra.total ?? items.length,
    totalPages: extra.totalPages ?? 1,
  };
}

/**
 * Sirve el panel entero.
 *
 * Va con router de verdad porque lo que hay que comprobar incluye A DÓNDE
 * llevan los avisos, y un doble del router diría que sí a todo.
 */
async function montarPanel({
  repartos = [],
  totalPaginasDeTareas = 1,
  canjesPendientes = 0,
  hijos = HIJOS,
}: {
  repartos?: TaskBatch[];
  totalPaginasDeTareas?: number;
  canjesPendientes?: number;
  hijos?: Child[];
} = {}) {
  vi.stubGlobal(
    "fetch",
    vi.fn((entrada: RequestInfo | URL) => {
      const url = String(entrada);

      const cuerpo = url.startsWith(`${API_PREFIX}/auth/session`)
        ? comoPadre()
        : url.startsWith(`${API_PREFIX}/auth/profiles`)
          ? { profiles: [] }
          : url.startsWith(`${API_PREFIX}/tasks`)
            ? pagina(repartos, { total: repartos.length, totalPages: totalPaginasDeTareas })
            : url.startsWith(`${API_PREFIX}/redemptions`)
              ? pagina([] as Redemption[], { total: canjesPendientes })
              : url.startsWith(`${API_PREFIX}/children`)
                ? pagina(hijos)
                : pagina([]);

      return Promise.resolve(
        new Response(JSON.stringify(cuerpo), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );
    }),
  );

  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const router = createRouter({
    routeTree,
    context: { queryClient },
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });

  await router.load();

  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );

  return router;
}

/**
 * La trampa de este change.
 *
 * `GET /tasks?status=COMPLETED` pagina por REPARTO y devuelve el reparto
 * ENTERO, así que las dos cuentas obvias dan números equivocados en direcciones
 * opuestas. El caso de estados MEZCLADOS es el único que las distingue: con un
 * reparto de una sola tarea completada, las tres cuentas dan 1 y el test no
 * probaría nada.
 */
describe("las tareas por aprobar se cuentan por fila, no por reparto", () => {
  it("un reparto con tres hermanos en estados distintos cuenta DOS", async () => {
    await montarPanel({ repartos: [reparto("b1", ["COMPLETED", "COMPLETED", "PENDING"])] });

    /*
     * DOS completadas y no una, a propósito: es lo que hace que las tres
     * cuentas den números distintos y que este test las distinga.
     *
     *   total (repartos)            → 1
     *   items.flatMap(b => b.tasks) → 3
     *   filas en COMPLETED          → 2  ✓
     *
     * La primera versión usaba una sola completada, y entonces las tres daban
     * 1: el test pasaba con la cuenta equivocada puesta. Comprobado
     * inyectándola.
     */
    expect(
      await screen.findByText(`2 ${messages.parents.tasksToApprove}`),
    ).toBeInTheDocument();
    expect(screen.queryByText(`1 ${messages.parents.taskToApprove}`)).toBeNull();
    expect(screen.queryByText(`3 ${messages.parents.tasksToApprove}`)).toBeNull();
  });

  it("dos repartos con dos completadas cada uno cuentan CUATRO", async () => {
    await montarPanel({
      repartos: [
        reparto("b1", ["COMPLETED", "COMPLETED", "PENDING"]),
        reparto("b2", ["COMPLETED", "COMPLETED"]),
      ],
    });

    // Aquí `total` habría dicho 2 y contar filas habría dicho 5.
    expect(
      await screen.findByText(`4 ${messages.parents.tasksToApprove}`),
    ).toBeInTheDocument();
  });
});

describe("una cifra que se queda corta lo dice", () => {
  it("con todo en una página, la cifra es exacta", async () => {
    await montarPanel({ repartos: [reparto("b1", ["COMPLETED", "COMPLETED"])] });

    expect(
      await screen.findByText(`2 ${messages.parents.tasksToApprove}`),
    ).toBeInTheDocument();
  });

  it("con más páginas, la cifra se marca como mínimo", async () => {
    await montarPanel({
      repartos: [reparto("b1", ["COMPLETED", "COMPLETED"])],
      totalPaginasDeTareas: 3,
    });

    expect(
      await screen.findByText(`2+ ${messages.parents.tasksToApprove}`),
    ).toBeInTheDocument();
  });
});

describe("no tener nada pendiente es una respuesta, no dos ceros", () => {
  it("con las dos bandejas vacías sale una frase y ningún cero", async () => {
    await montarPanel();

    expect(await screen.findByText(messages.parents.allClear)).toBeInTheDocument();
    expect(screen.queryByText(new RegExp(`^0\\s`))).toBeNull();
  });

  it("con solo una bandeja llena, la otra no aparece a cero", async () => {
    await montarPanel({ canjesPendientes: 2 });

    expect(
      await screen.findByText(`2 ${messages.parents.redemptionsWaiting}`),
    ).toBeInTheDocument();
    expect(screen.queryByText(messages.parents.allClear)).toBeNull();
    expect(screen.queryByText(`0 ${messages.parents.tasksToApprove}`)).toBeNull();
  });
});

/**
 * Llevar al listado SIN filtro obligaría al padre a repetir a mano la búsqueda
 * que el panel acaba de hacer por él.
 */
describe("cada aviso lleva a su listado ya filtrado", () => {
  it("el de tareas apunta a /tasks en COMPLETED", async () => {
    await montarPanel({ repartos: [reparto("b1", ["COMPLETED"])] });

    const aviso = await screen.findByRole("link", {
      name: new RegExp(messages.parents.taskToApprove),
    });

    expect(aviso).toHaveAttribute("href", expect.stringContaining("/tasks"));
    expect(aviso).toHaveAttribute("href", expect.stringContaining("status=COMPLETED"));
  });

  it("el de canjes apunta a /redemptions en PENDING", async () => {
    await montarPanel({ canjesPendientes: 1 });

    const aviso = await screen.findByRole("link", {
      name: new RegExp(messages.parents.redemptionWaiting),
    });

    expect(aviso).toHaveAttribute("href", expect.stringContaining("/redemptions"));
    expect(aviso).toHaveAttribute("href", expect.stringContaining("status=PENDING"));
  });
});

/**
 * El panel trae a los hijos en UNA página y no pagina.
 *
 * Eso solo es correcto mientras el máximo por familia quepa en el tamaño de
 * página. Es una relación entre dos constantes que nadie escribió a propósito, y
 * de las que se rompen en silencio: subir el máximo a 25 dejaría al panel
 * escondiendo hijos sin que fallara nada. Aquí falla.
 */
describe("los saldos del panel cubren a toda la familia", () => {
  it("el máximo de hijos cabe en una página", () => {
    expect(MAX_CHILDREN_PER_FAMILY).toBeLessThanOrEqual(DEFAULT_PAGE_SIZE);
  });

  it("el saldo de un hijo sale en el panel", async () => {
    await montarPanel();

    expect(await screen.findByText("Mateo")).toBeInTheDocument();
    expect(screen.getByLabelText(/120\s+monedas/)).toBeInTheDocument();
  });
});
