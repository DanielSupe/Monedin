import { API_PREFIX, type CoinTransaction } from "@monedin/contracts";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider, createMemoryHistory, createRouter } from "@tanstack/react-router";
import { render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { routeTree } from "../../src/routeTree.gen";
import { fechaCorta, fechaLarga } from "../../src/lib/dates.js";
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

async function filaCon(texto: string): Promise<HTMLElement> {
  return (await screen.findByText(texto)).closest("li") as HTMLElement;
}

function dice(movimiento: CoinTransaction): string {
  const verbo = movimiento.amount > 0 ? messages.coins.earned : messages.coins.spent;
  return `${verbo} ${Math.abs(movimiento.amount)}`;
}

function teselaDe(fila: HTMLElement): HTMLElement {
  return fila.firstElementChild as HTMLElement;
}

describe("acreditar y descontar se distinguen por más que el signo", () => {
  const GANA = movimiento("m1", 20, 20);
  const GASTA = movimiento("m2", -60, 40);

  it("cada uno lleva su palabra, con su cantidad dentro", async () => {
    await montar("/me/coins?page=1", [GANA, GASTA]);

    expect(await screen.findByText(dice(GANA))).toBeInTheDocument();
    expect(screen.getByText(dice(GASTA))).toBeInTheDocument();
  });

  it("y se distinguen entre SÍ, no solo por su texto", async () => {
    await montar("/me/coins?page=1", [GANA, GASTA]);

    const gana = teselaDe(await filaCon(dice(GANA)));
    const gasta = teselaDe(await filaCon(dice(GASTA)));

    expect(gana.className).not.toEqual(gasta.className);
  });

  it("ganar lleva el color de la moneda y gastar el del ahorro", async () => {
    await montar("/me/coins?page=1", [GANA, GASTA]);

    expect(teselaDe(await filaCon(dice(GANA))).className).toContain("bg-coin-soft");
    expect(teselaDe(await filaCon(dice(GASTA))).className).toContain("bg-done-soft");
  });
});

describe("el saldo de cada fila es el que viene, no uno acumulado", () => {
  it("aunque no cuadre con la suma de los importes", async () => {
    const primero = movimiento("m1", 20, 500);
    const segundo = movimiento("m2", 60, 777);

    await montar("/me/coins?page=1", [primero, segundo]);

    const arriba = await filaCon(dice(primero));
    const abajo = await filaCon(dice(segundo));

    expect(within(arriba).getByText("500")).toBeInTheDocument();
    expect(within(abajo).getByText("777")).toBeInTheDocument();

    expect(within(arriba).queryByText("20", { selector: "span" })).toBeNull();
    expect(within(abajo).queryByText("80")).toBeNull();
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

    const enlace = within(fila).getByRole("link", {
      name: `${messages.children.historyFull} Mateo`,
    });

    expect(enlace).toHaveAttribute("href", expect.stringContaining("/children/h1/coins"));
  });
});

describe("cada movimiento dice cuándo fue", () => {
  it("la fecha de cada fila es la suya", async () => {
    const primero = { ...movimiento("m1", 20, 120), createdAt: "2026-09-08T10:00:00.000Z" };
    const segundo = { ...movimiento("m2", -60, 60), createdAt: "2026-08-20T10:00:00.000Z" };

    await montar("/me/coins?page=1", [primero, segundo]);

    const filaGano = (await screen.findByText(dice(primero))).closest("li") as HTMLElement;
    const filaGasto = (await screen.findByText(dice(segundo))).closest("li") as HTMLElement;

    expect(within(filaGano).getByText(fechaCorta(primero.createdAt))).toBeInTheDocument();
    expect(within(filaGasto).getByText(fechaCorta(segundo.createdAt))).toBeInTheDocument();
  });

  it("y en corto, no en la forma larga", async () => {
    const uno = { ...movimiento("m1", 20, 120), createdAt: "2026-09-08T10:00:00.000Z" };

    await montar("/me/coins?page=1", [uno]);

    await screen.findByText(dice(uno));

    expect(screen.queryByText(fechaLarga(uno.createdAt))).toBeNull();
  });
});
