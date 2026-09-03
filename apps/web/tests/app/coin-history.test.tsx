import { API_PREFIX, type CoinTransaction } from "@monedin/contracts";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider, createMemoryHistory, createRouter } from "@tanstack/react-router";
import { render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { routeTree } from "../../src/routeTree.gen";
import { messages } from "../../src/lib/messages.js";
import { comoNino, comoPadre } from "../support/router.js";

afterEach(() => {
  vi.unstubAllGlobals();
});

function movimiento(
  id: string,
  amount: number,
  balanceAfter: number,
  reason: CoinTransaction["reason"] = amount > 0 ? "TASK_APPROVED" : "REDEMPTION_APPROVED",
): CoinTransaction {
  return {
    id,
    amount,
    balanceAfter,
    reason,
    createdAt: "2026-09-01T10:00:00.000Z",
    taskId: null,
    redemptionId: null,
  };
}

function json(cuerpo: unknown): Response {
  return new Response(JSON.stringify(cuerpo), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

async function montar(
  direccion: string,
  movimientos: CoinTransaction[],
  sesion: "nino" | "padre" = "nino",
) {
  vi.stubGlobal(
    "fetch",
    vi.fn((entrada: RequestInfo | URL) => {
      const url = String(entrada);

      if (url.startsWith(`${API_PREFIX}/auth/session`))
        return Promise.resolve(json(sesion === "nino" ? comoNino() : comoPadre()));
      if (url.startsWith(`${API_PREFIX}/auth/profiles`)) return Promise.resolve(json({ profiles: [] }));
      if (url.includes("/coins"))
        return Promise.resolve(
          json({
            items: movimientos,
            page: 1,
            pageSize: 20,
            total: movimientos.length,
            totalPages: 1,
          }),
        );

      return Promise.resolve(json({ items: [], page: 1, pageSize: 20, total: 0, totalPages: 1 }));
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

/** La fila de ese movimiento, esperándola: la lista llega después del título. */
async function filaCon(texto: string): Promise<HTMLElement> {
  return (await screen.findByText(texto)).closest("li") as HTMLElement;
}

/**
 * Que una fila sume o reste es lo MÁS importante que dice, y `-60` frente a `60`
 * lo deja colgando de un solo carácter.
 */
describe("acreditar y descontar se distinguen por más que el signo", () => {
  it("cada uno lleva su palabra", async () => {
    await montar("/me/coins?page=1", [movimiento("m1", 20, 20), movimiento("m2", -60, 40)]);

    expect(await screen.findByText(messages.coins.earned)).toBeInTheDocument();
    expect(screen.getByText(messages.coins.spent)).toBeInTheDocument();
  });

  it("y se distinguen entre SÍ, no solo por su texto", async () => {
    await montar("/me/coins?page=1", [movimiento("m1", 20, 20), movimiento("m2", -60, 40)]);

    await screen.findByText(messages.coins.earned);

    /*
     * Se comparan los dos tonos ENTRE SÍ. Comprobar que las dos palabras están
     * en pantalla no comprueba que se distingan: con el mismo tono en las dos,
     * ese test seguiría en verde. Comprobado inyectando esa violación.
     */
    const gana = screen.getByText(messages.coins.earned).className;
    const gasta = screen.getByText(messages.coins.spent).className;

    expect(gana).not.toEqual(gasta);
  });
});

/**
 * `balanceAfter` se guarda redundante desde `add-data-model` con una razón
 * escrita, y acumular en el cliente sería además incorrecto en cuanto haya
 * paginación: la segunda página no sabe con qué saldo empezó.
 */
describe("el saldo de cada fila es el que viene, no uno acumulado", () => {
  it("aunque no cuadre con la suma de los importes", async () => {
    /*
     * Saldos deliberadamente INCOHERENTES con la suma: si la pantalla acumulara,
     * daría 20 y 80 en vez de 500 y 777. Con datos coherentes las dos
     * respuestas coincidirían y el test no probaría nada — es el error que
     * `redesign-parent-home` costó aprender.
     */
    await montar("/me/coins?page=1", [
      movimiento("m1", 20, 500),
      movimiento("m2", 60, 777),
    ]);

    const primera = await filaCon(`${messages.coins.balanceAfter} 500`);
    expect(primera).toBeInTheDocument();
    expect(screen.getByText(`${messages.coins.balanceAfter} 777`)).toBeInTheDocument();

    // Y ninguno de los dos acumulados aparece.
    expect(screen.queryByText(`${messages.coins.balanceAfter} 20`)).toBeNull();
    expect(screen.queryByText(`${messages.coins.balanceAfter} 80`)).toBeNull();
  });
});

describe("se llega al historial desde el saldo", () => {
  it("el niño, desde su inicio", async () => {
    await montar("/", []);

    const enlace = await screen.findByRole("link", { name: messages.coins.seeHistory });
    expect(enlace).toHaveAttribute("href", expect.stringContaining("/me/coins"));
  });

  it("el padre, desde la fila de cada hijo", async () => {
    vi.unstubAllGlobals();

    vi.stubGlobal(
      "fetch",
      vi.fn((entrada: RequestInfo | URL) => {
        const url = String(entrada);
        if (url.startsWith(`${API_PREFIX}/auth/session`)) return Promise.resolve(json(comoPadre()));
        if (url.startsWith(`${API_PREFIX}/auth/profiles`))
          return Promise.resolve(json({ profiles: [] }));
        if (url.startsWith(`${API_PREFIX}/children`))
          return Promise.resolve(
            json({
              items: [
                {
                  id: "h1",
                  name: "Mateo",
                  avatar: "zorro",
                  age: 8,
                  coins: 120,
                  locked: false,
                  createdAt: "2026-09-01T10:00:00.000Z",
                },
              ],
              page: 1,
              pageSize: 20,
              total: 1,
              totalPages: 1,
            }),
          );
        return Promise.resolve(json({ items: [], page: 1, pageSize: 20, total: 0, totalPages: 1 }));
      }),
    );

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const router = createRouter({
      routeTree,
      context: { queryClient },
      history: createMemoryHistory({ initialEntries: ["/children?page=1"] }),
    });
    await router.load();

    render(
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>,
    );

    const fila = (await screen.findByText("Mateo")).closest("li") as HTMLElement;
    const enlace = within(fila).getByRole("link", { name: messages.coins.seeChildHistory });

    expect(enlace).toHaveAttribute("href", expect.stringContaining("/children/h1/coins"));
  });
});
