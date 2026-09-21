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

/** La fila de ese movimiento, esperándola: la lista llega después del título. */
async function filaCon(texto: string): Promise<HTMLElement> {
  return (await screen.findByText(texto)).closest("li") as HTMLElement;
}

/** Lo que se ganó o se gastó, tal como lo escribe la fila: «Ganó 5». */
function dice(movimiento: CoinTransaction): string {
  const verbo = movimiento.amount > 0 ? messages.coins.earned : messages.coins.spent;
  return `${verbo} ${Math.abs(movimiento.amount)}`;
}

/**
 * La tesela de color de una fila.
 *
 * Va `aria-hidden` a propósito —lo que dice qué pasó es «Ganó» o «Gastó»—, así
 * que no se busca por papel ni por nombre: es el primer hijo del renglón.
 */
function teselaDe(fila: HTMLElement): HTMLElement {
  return fila.firstElementChild as HTMLElement;
}

/**
 * Que una fila sume o reste es lo MÁS importante que dice, y `-60` frente a `60`
 * lo deja colgando de un solo carácter.
 */
describe("acreditar y descontar se distinguen por más que el signo", () => {
  const GANA = movimiento("m1", 20, 20);
  const GASTA = movimiento("m2", -60, 40);

  it("cada uno lleva su palabra, con su cantidad dentro", async () => {
    await montar("/me/coins?page=1", [GANA, GASTA]);

    expect(await screen.findByText(dice(GANA))).toBeInTheDocument();
    expect(screen.getByText(dice(GASTA))).toBeInTheDocument();
  });

  /*
   * Se comparan los dos tonos ENTRE SÍ. Comprobar que las dos palabras están en
   * pantalla no comprueba que se distingan: con el mismo tono en las dos, ese
   * test seguiría en verde. Comprobado inyectando esa violación.
   *
   * Y se mira la TESELA y no el texto, que es donde vive el color desde
   * `redesign-child-screens`: los dos renglones se escriben igual —misma medida,
   * mismo grosor— y lo que los separa es el cuadrado de la izquierda.
   */
  it("y se distinguen entre SÍ, no solo por su texto", async () => {
    await montar("/me/coins?page=1", [GANA, GASTA]);

    const gana = teselaDe(await filaCon(dice(GANA)));
    const gasta = teselaDe(await filaCon(dice(GASTA)));

    expect(gana.className).not.toEqual(gasta.className);
  });

  /*
   * Cuál es cuál, y no solo que sean distintos. Ganar va en el color de la
   * MONEDA porque es dinero entrando; gastar en el del AHORRO porque lo que sale
   * se convirtió en un premio. Intercambiados, el test de arriba seguiría verde.
   */
  it("ganar lleva el color de la moneda y gastar el del ahorro", async () => {
    await montar("/me/coins?page=1", [GANA, GASTA]);

    expect(teselaDe(await filaCon(dice(GANA))).className).toContain("bg-coin-soft");
    expect(teselaDe(await filaCon(dice(GASTA))).className).toContain("bg-done-soft");
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
    const primero = movimiento("m1", 20, 500);
    const segundo = movimiento("m2", 60, 777);

    await montar("/me/coins?page=1", [primero, segundo]);

    // El saldo se dibuja con `Coins`, así que se busca por lo que anuncia.
    const arriba = await filaCon(dice(primero));
    const abajo = await filaCon(dice(segundo));

    expect(within(arriba).getByText("500")).toBeInTheDocument();
    expect(within(abajo).getByText("777")).toBeInTheDocument();

    // Y ninguno de los dos acumulados aparece.
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
    /*
     * Por el nombre COMPLETO y no por la etiqueta visible: desde
     * `redesign-parent-screens` la fila lleva «Historial» a la vista y «Ver el
     * historial de Mateo» anunciado, porque cuatro hijos dan cuatro etiquetas
     * idénticas para quien no ve la pantalla.
     */
    const enlace = within(fila).getByRole("link", {
      name: `${messages.children.historyFull} Mateo`,
    });

    expect(enlace).toHaveAttribute("href", expect.stringContaining("/children/h1/coins"));
  });
});

/**
 * CUÁNDO FUE CADA MOVIMIENTO, que la pantalla no decía.
 *
 * Este historial existe para contestar «este saldo no me cuadra». Sin fecha, una
 * fila dice cuánto y por qué pero no cuándo, así que no se puede cruzar con nada
 * de lo que pasó en casa — y el dato venía en la respuesta desde el principio.
 *
 * Los dos movimientos llevan fechas DISTINTAS a propósito: con la misma en las
 * dos, una pantalla que pintara una sola fecha para todas pasaría igual.
 */
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

  /*
   * Y en la forma CORTA. Es una celda de una lista que se recorre, no una línea
   * de texto — y en la escala del niño la fila ya lleva cuatro cosas. Se
   * comprueba que la larga NO está, porque las dos contienen el día y buscar
   * solo la corta pasaría con la larga puesta.
   */
  it("y en corto, no en la forma larga", async () => {
    const uno = { ...movimiento("m1", 20, 120), createdAt: "2026-09-08T10:00:00.000Z" };

    await montar("/me/coins?page=1", [uno]);

    await screen.findByText(dice(uno));

    expect(screen.queryByText(fechaLarga(uno.createdAt))).toBeNull();
  });
});
