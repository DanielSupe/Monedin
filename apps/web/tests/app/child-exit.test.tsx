import { API_PREFIX, type SessionState } from "@monedin/contracts";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider, createMemoryHistory, createRouter } from "@tanstack/react-router";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { messages } from "../../src/lib/messages.js";
import { routeTree } from "../../src/routeTree.gen";
import { comoNino } from "../support/router.js";

afterEach(() => {
  vi.unstubAllGlobals();
});

function json(cuerpo: unknown): Response {
  return new Response(JSON.stringify(cuerpo), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

const PERFIL_PROPIO = {
  id: "hijo-1",
  name: "Mateo",
  avatar: "zorro",
  age: 8,
  coins: 120,
};

/**
 * Monta al niño en una dirección y devuelve el espía de `fetch`.
 *
 * No sirve `montarApp`: «Mi perfil» pide `GET /children/me`, y el respaldo de
 * aquella función responde una lista paginada vacía a todo lo que no sea la
 * sesión. Un perfil que no valida deja la pantalla en su estado de error, y ahí
 * no hay ningún botón que pulsar.
 */
async function montarNino(direccion: string, sesion: SessionState = comoNino()) {
  const espia = vi.fn((entrada: RequestInfo | URL) => {
    const url = String(entrada);

    if (url.startsWith(`${API_PREFIX}/auth/session`)) return Promise.resolve(json(sesion));
    if (url.startsWith(`${API_PREFIX}/auth/profiles`)) return Promise.resolve(json({ profiles: [] }));
    if (url.startsWith(`${API_PREFIX}/children/me`)) return Promise.resolve(json(PERFIL_PROPIO));

    return Promise.resolve(json({ items: [], page: 1, pageSize: 20, total: 0, totalPages: 1 }));
  });

  vi.stubGlobal("fetch", espia);

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

  return espia;
}

/** Las peticiones de salida que ha visto el espía, con su método. */
function salidas(espia: ReturnType<typeof vi.fn>): Array<string> {
  return espia.mock.calls
    .map(([entrada, init]) => [String(entrada), (init as RequestInit | undefined)?.method] as const)
    .filter(([url]) => url.includes("/auth/profiles/leave") || url.includes("/auth/logout"))
    .map(([url, metodo]) => `${metodo ?? "GET"} ${url.replace(API_PREFIX, "")}`);
}

/**
 * Salir del perfil tiene que estar donde se busca.
 *
 * Estaba solo al final del inicio, por debajo de la rejilla de teselas, y «Mi
 * perfil» —la pantalla que responde a «esto es mío», y la que el marco alcanza
 * a cualquier hora— no ofrecía ninguna salida.
 */
describe("el niño encuentra la salida de su perfil", () => {
  it("desde «Mi perfil»", async () => {
    const espia = await montarNino("/me/settings");

    await screen.findByText(messages.children.myProfileTitle);
    await userEvent.click(screen.getByRole("button", { name: messages.auth.changeProfile }));

    expect(salidas(espia)).toEqual(["POST /auth/profiles/leave"]);
  });

  it("desde su inicio", async () => {
    const espia = await montarNino("/");

    await screen.findByText(messages.children.homeBalanceLabel);
    await userEvent.click(screen.getByRole("button", { name: messages.auth.changeProfile }));

    expect(salidas(espia)).toEqual(["POST /auth/profiles/leave"]);
  });

  /*
   * Que las dos existan no basta: si una llamara a otro sitio, las dos estarían
   * en pantalla y el producto tendría dos salidas que no hacen lo mismo. Lo que
   * se compara es la petición que sale, no que haya un botón.
   */
  it("y las dos hacen exactamente lo mismo", async () => {
    const desdePerfil = await montarNino("/me/settings");
    await screen.findByText(messages.children.myProfileTitle);
    await userEvent.click(screen.getByRole("button", { name: messages.auth.changeProfile }));
    const porPerfil = salidas(desdePerfil);

    // La limpieza automática ocurre ENTRE tests, no dentro de uno: sin esto los
    // dos montajes conviven y «Cambiar de perfil» sale dos veces.
    cleanup();
    vi.unstubAllGlobals();

    const desdeInicio = await montarNino("/");
    await screen.findByText(messages.children.homeBalanceLabel);
    await userEvent.click(screen.getByRole("button", { name: messages.auth.changeProfile }));

    expect(salidas(desdeInicio)).toEqual(porPerfil);
  });
});

/**
 * Cerrar sesión obliga a teclear correo y contraseña, que un niño no tiene: un
 * niño que cerrase sesión dejaría a la familia fuera hasta que apareciese el
 * padre. Por eso lo que se arregla es encontrar la salida que ya existe, y no
 * darle una nueva.
 */
describe("el niño no puede cerrar la sesión de la cuenta", () => {
  it.each([
    ["su inicio", "/"],
    ["«Mi perfil»", "/me/settings"],
  ])("no se le ofrece en %s", async (_nombre, direccion) => {
    await montarNino(direccion);

    await screen.findByRole("button", { name: messages.auth.changeProfile });
    expect(screen.queryByRole("button", { name: messages.auth.signOut })).toBeNull();
  });
});
