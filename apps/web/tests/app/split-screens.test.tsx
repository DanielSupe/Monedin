import { API_PREFIX, type OwnRedemption, type OwnTask } from "@monedin/contracts";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MyRedemptions } from "../../src/features/redemptions/MyRedemptions.js";
import { MyTasks } from "../../src/features/tasks/MyTasks.js";
import { messages } from "../../src/lib/messages.js";
import { comoNino, comoPadre, montarApp, pagina } from "../support/router.js";

afterEach(() => {
  vi.unstubAllGlobals();
});

function banda(dentro: HTMLElement = document.body): HTMLElement {
  const encontrada = dentro.querySelector<HTMLElement>('[class*="lg:grid-cols-5"]');

  expect(encontrada, "la pantalla no monta la banda").not.toBeNull();

  return encontrada as HTMLElement;
}

function json(cuerpo: unknown): Response {
  return new Response(JSON.stringify(cuerpo), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

function paginaDe<T>(items: T[], total = items.length): unknown {
  return { items, page: 1, pageSize: 20, total, totalPages: 1 };
}

function tarea(id: string, status: OwnTask["status"]): OwnTask {
  return {
    id,
    title: `Tarea ${id}`,
    description: null,
    coins: 20,
    status,
    dueDate: null,
    evidence: null,
    createdAt: "2026-09-01T10:00:00.000Z",
    updatedAt: "2026-09-01T10:00:00.000Z",
  };
}

function canje(id: string, status: OwnRedemption["status"]): OwnRedemption {
  return {
    id,
    coins: 60,
    status,
    reward: { id: `r-${id}`, title: `Premio ${id}` },
    createdAt: "2026-09-01T10:00:00.000Z",
    updatedAt: "2026-09-01T10:00:00.000Z",
  };
}

function servir(datos: { tareas?: OwnTask[]; canjes?: OwnRedemption[] }): void {
  vi.stubGlobal(
    "fetch",
    vi.fn((entrada: RequestInfo | URL) => {
      const url = String(entrada);

      if (url.startsWith(`${API_PREFIX}/auth/session`)) return Promise.resolve(json(comoNino()));
      if (url.startsWith(`${API_PREFIX}/tasks/mine`))
        return Promise.resolve(json(paginaDe(datos.tareas ?? [])));
      if (url.startsWith(`${API_PREFIX}/redemptions/mine`))
        return Promise.resolve(json(paginaDe(datos.canjes ?? [])));

      return Promise.resolve(json(paginaDe([])));
    }),
  );
}

function montar(pantalla: React.ReactElement): void {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(<QueryClientProvider client={queryClient}>{pantalla}</QueryClientProvider>);
}

describe("las pantallas con panel de apoyo lo colocan en la banda", () => {
  it("las tareas del niño llevan «Cómo funciona» dentro de la banda", async () => {
    servir({ tareas: [tarea("t1", "PENDING"), tarea("t2", "APPROVED")] });
    montar(<MyTasks />);

    const explicacion = await screen.findByText(messages.tasks.howTitle);

    expect(banda().contains(explicacion)).toBe(true);
  });

  it("los canjes del niño llevan su explicación dentro de la banda", async () => {
    servir({ canjes: [canje("c1", "PENDING")] });
    montar(<MyRedemptions />);

    const explicacion = await screen.findByText(
      messages.redemptions.myRedemptionsExplainTitle,
    );

    expect(banda().contains(explicacion)).toBe(true);
  });

  it("el alta de una tarea lleva «Qué pasa al repartir» dentro de la banda", async () => {
    await montarApp("/tasks/new", comoPadre(), [], { "/children": pagina([]) });

    const explicacion = await screen.findByText(messages.tasks.handOutTitle);

    expect(banda().contains(explicacion)).toBe(true);
  });

  it("el alta de un premio lleva «Qué pasa al publicar» dentro de la banda", async () => {
    await montarApp("/rewards/new", comoPadre(), [], { "/children": pagina([]) });

    const explicacion = await screen.findByText(messages.rewards.publishTitle);

    expect(banda().contains(explicacion)).toBe(true);
  });

  it("el panel de apoyo va después del contenido en el documento", async () => {
    servir({ tareas: [tarea("t1", "PENDING")] });
    montar(<MyTasks />);

    const explicacion = await screen.findByText(messages.tasks.howTitle);
    const tareaDeLaLista = screen.getByText("Tarea t1");

    expect(
      tareaDeLaLista.compareDocumentPosition(explicacion) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });
});

describe("los canjes del niño se resumen por estado", () => {
  const MEZCLA = [
    canje("p1", "PENDING"),
    canje("p2", "PENDING"),
    canje("a1", "APPROVED"),
    canje("a2", "APPROVED"),
    canje("a3", "APPROVED"),
    canje("r1", "REJECTED"),
  ];

  function resumen(rotulo: string): HTMLElement {
    return screen.getByText(rotulo).closest("li") as HTMLElement;
  }

  it("cada estado dice cuántos hay de los suyos", async () => {
    servir({ canjes: MEZCLA });
    montar(<MyRedemptions />);

    await screen.findByText(messages.redemptions.summaryScope);

    expect(within(resumen(messages.redemptions.summaryPending)).getByText("2")).toBeInTheDocument();
    expect(within(resumen(messages.redemptions.summaryApproved)).getByText("3")).toBeInTheDocument();
    expect(within(resumen(messages.redemptions.summaryRejected)).getByText("1")).toBeInTheDocument();
  });

  it("un estado sin ninguno dice cero y no desaparece", async () => {
    servir({ canjes: [canje("p1", "PENDING")] });
    montar(<MyRedemptions />);

    await screen.findByText(messages.redemptions.summaryScope);

    await waitFor(() => {
      expect(
        within(resumen(messages.redemptions.summaryApproved)).getByText("0"),
      ).toBeInTheDocument();
    });
    expect(within(resumen(messages.redemptions.summaryRejected)).getByText("0")).toBeInTheDocument();
  });
});
