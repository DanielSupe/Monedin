import { API_PREFIX } from "@monedin/contracts";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider, createMemoryHistory, createRouter } from "@tanstack/react-router";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { messages } from "../../src/lib/messages.js";
import { routeTree } from "../../src/routeTree.gen";
import { comoNino, comoPadre } from "../support/router.js";

afterEach(() => {
  vi.unstubAllGlobals();
});

function json(cuerpo: unknown, status = 200): Response {
  return new Response(status === 204 ? null : JSON.stringify(cuerpo), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function pagina<T>(items: T[]): unknown {
  return { items, page: 1, pageSize: 20, total: items.length, totalPages: 1 };
}

/**
 * Monta el inicio de un rol, diciendo si a ese perfil ya se le explicó.
 *
 * `comoPadre`/`comoNino` traen `tutorialSeen` en CIERTO por defecto — si no,
 * cada test que monta el inicio se encontraría el recorrido encima de lo que
 * iba a comprobar. Aquí se pide el contrario a propósito.
 */
async function montarInicio(quien: "padre" | "nino", yaLoVio: boolean) {
  const espia = vi.fn((entrada: RequestInfo | URL, init?: RequestInit) => {
    const url = String(entrada);

    if (url.startsWith(`${API_PREFIX}/auth/session`))
      return Promise.resolve(
        json(quien === "padre" ? comoPadre("Lucía", yaLoVio) : comoNino("Mateo", yaLoVio)),
      );
    if (url.startsWith(`${API_PREFIX}/auth/tutorial`)) return Promise.resolve(json(null, 204));
    if (url.startsWith(`${API_PREFIX}/auth/profiles`))
      return Promise.resolve(json({ profiles: [] }));

    void init;
    return Promise.resolve(json(pagina([])));
  });

  vi.stubGlobal("fetch", espia);

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

  return espia;
}

/** Lo que se mandó a la ruta del recorrido, si se mandó algo. */
function marcados(espia: ReturnType<typeof vi.fn>): Array<{ seen: boolean }> {
  return espia.mock.calls
    .filter(([entrada]) => String(entrada).startsWith(`${API_PREFIX}/auth/tutorial`))
    .map(([, init]) => JSON.parse(String((init as RequestInit).body)) as { seen: boolean });
}

/**
 * Lo que este change existe para arreglar.
 *
 * Quien entra por primera vez aterriza en una pantalla que no le explica nada:
 * el padre en un panel vacío, el niño en un saldo en cero con cuatro teselas.
 */
describe("el recorrido sale la primera vez, y solo la primera", () => {
  it("el padre lo ve si no lo ha visto", async () => {
    await montarInicio("padre", false);

    expect(
      await screen.findByRole("dialog", { name: messages.tutorial.parentWelcomeTitle }),
    ).toBeInTheDocument();
  });

  /*
   * LOS DOS CASOS, y este es el que importa: comprobar solo que aparece pasaría
   * con un recorrido que sale siempre, que es justo el defecto que arruinaría
   * el producto para quien ya lo usa.
   */
  it("y NO lo ve si ya lo vio", async () => {
    await montarInicio("padre", true);

    await screen.findByText(messages.parents.pendingTitle);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("el niño lo ve si no lo ha visto, y no si ya lo vio", async () => {
    await montarInicio("nino", false);
    expect(
      await screen.findByRole("dialog", { name: messages.tutorial.childWelcomeTitle }),
    ).toBeInTheDocument();

    cleanup();
    vi.unstubAllGlobals();

    await montarInicio("nino", true);
    await screen.findByText(messages.children.homeBalanceLabel);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  /*
   * Los dos guiones son DISTINTOS, y se comprueba comparándolos entre sí. Un
   * test que solo mirara que cada uno tiene un primer paso pasaría con el mismo
   * guion servido a los dos roles.
   */
  it("y cada rol recibe el suyo, que no es el del otro", async () => {
    await montarInicio("padre", false);
    const delPadre = (await screen.findByRole("dialog")).getAttribute("aria-labelledby");
    const tituloDelPadre = document.getElementById(delPadre ?? "")?.textContent;

    cleanup();
    vi.unstubAllGlobals();

    await montarInicio("nino", false);
    const delNino = (await screen.findByRole("dialog")).getAttribute("aria-labelledby");
    const tituloDelNino = document.getElementById(delNino ?? "")?.textContent;

    expect(tituloDelPadre).not.toBe(tituloDelNino);
  });
});

describe("se avanza, y se sale", () => {
  it("seguir lleva al paso siguiente", async () => {
    await montarInicio("padre", false);
    await screen.findByRole("dialog", { name: messages.tutorial.parentWelcomeTitle });

    await userEvent.click(screen.getByRole("button", { name: messages.tutorial.next }));

    expect(
      screen.getByRole("dialog", { name: messages.tutorial.parentPendingTitle }),
    ).toBeInTheDocument();
  });

  /*
   * Saltar MARCA VISTO. Un recorrido que solo contara como visto al llegar al
   * final volvería a salirle cada vez a quien lo saltó — que es justo a quien
   * ya dijo que no.
   */
  it("saltar marca visto", async () => {
    const espia = await montarInicio("padre", false);
    await screen.findByRole("dialog");

    await userEvent.click(screen.getByRole("button", { name: messages.tutorial.skip }));

    expect(marcados(espia)).toEqual([{ seen: true }]);
  });

  it("y llegar al final también", async () => {
    const espia = await montarInicio("nino", false);
    await screen.findByRole("dialog");

    // Cuatro «seguir» para llegar al quinto y último paso.
    for (let i = 0; i < 4; i += 1) {
      await userEvent.click(screen.getByRole("button", { name: messages.tutorial.next }));
    }
    await userEvent.click(screen.getByRole("button", { name: messages.tutorial.finish }));

    expect(marcados(espia)).toEqual([{ seen: true }]);
  });
});

describe("un paso cuya parte no está en pantalla", () => {
  /*
   * El saludo y el cierre no señalan a nada, y una cuenta recién creada no tiene
   * filas que iluminar. El recorrido tiene que seguir funcionando: es
   * exactamente cuando más falta hace.
   */
  it("se muestra igual, en vez de dejar el recorrido en blanco", async () => {
    await montarInicio("padre", false);

    // El primer paso no tiene ancla y aun así se ve entero.
    const panel = await screen.findByRole("dialog", {
      name: messages.tutorial.parentWelcomeTitle,
    });

    expect(panel).toHaveAccessibleDescription(messages.tutorial.parentWelcomeBody);
    expect(screen.getByRole("button", { name: messages.tutorial.next })).toBeInTheDocument();
  });
});
