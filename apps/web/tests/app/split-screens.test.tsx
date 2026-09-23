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

/**
 * LA BANDA: contenido principal a la izquierda, panel de apoyo a la derecha.
 *
 * Cinco pantallas la necesitan y ninguna la tenía: su maqueta reparte en dos y la
 * aplicación apilaba. Se escapó porque el repaso que cuadró las treinta y dos
 * comparaba el TEXTO y los pasos de escala, y ese método no ve la forma — apilado
 * y en dos columnas llevan el mismo texto y la misma escala.
 *
 * LÍMITE de estos tests, dicho para que nadie les pida más: jsdom no aplica CSS,
 * así que no pueden ver dos columnas. Lo que comprueban es la ESTRUCTURA —que el
 * panel esté dentro de la banda y no suelto debajo—, que es lo que decide el
 * resultado. Que se vea repartida se mira abriendo la aplicación.
 */

/** La banda de una pantalla montada, por la declaración que la define. */
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

  /*
   * El panel de apoyo va DESPUÉS en el documento, en los dos anchos: quien
   * recorre la pantalla con teclado llega primero a lo que hay que hacer y
   * después a lo que lo explica, igual que quien la mira. Colocarlo antes y
   * moverlo con `order` separaría lo que se ve de lo que se recorre.
   */
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

/**
 * LOS CONTADORES CUENTAN LAS FILAS, no el total del listado.
 *
 * El caso está elegido para que las tres cifras sean DISTINTAS entre sí y
 * distintas del total: con 2, 3 y 1 sobre seis canjes, contar mal —devolver el
 * total en los tres, o intercambiar dos estados— da números que no coinciden.
 * Con dos estados del mismo tamaño el test pasaría con los contadores cruzados.
 */
describe("los canjes del niño se resumen por estado", () => {
  const MEZCLA = [
    canje("p1", "PENDING"),
    canje("p2", "PENDING"),
    canje("a1", "APPROVED"),
    canje("a2", "APPROVED"),
    canje("a3", "APPROVED"),
    canje("r1", "REJECTED"),
  ];

  /** El bloque de un estado, por su rótulo. */
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

  /*
   * El que vale cero SE DIBUJA. Un estado que desaparece al quedarse vacío
   * convierte el resumen en tres cajas que cambian de sitio, y hay que volver a
   * leer cuál es cuál en cada visita.
   */
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
