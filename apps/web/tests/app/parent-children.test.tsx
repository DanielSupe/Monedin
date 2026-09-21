import { API_PREFIX, type Child } from "@monedin/contracts";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider, createMemoryHistory, createRouter } from "@tanstack/react-router";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { routeTree } from "../../src/routeTree.gen";
import { PIN_LABEL, messages } from "../../src/lib/messages.js";
import { comoPadre } from "../support/router.js";

afterEach(() => {
  vi.unstubAllGlobals();
});

function hijo(id: string, name: string, locked: boolean): Child {
  return {
    id,
    name,
    avatar: "zorro",
    age: 8,
    coins: 120,
    locked,
    createdAt: "2026-09-01T10:00:00.000Z",
  };
}

/** Cada petición que NO es un listado: es lo que dice si algo se ejecutó. */
let mutaciones: string[] = [];

function json(cuerpo: unknown, status = 200): Response {
  return new Response(JSON.stringify(cuerpo), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function montar(hijos: Child[]) {
  mutaciones = [];

  vi.stubGlobal(
    "fetch",
    vi.fn((entrada: RequestInfo | URL, init?: RequestInit) => {
      const url = String(entrada);
      const metodo = init?.method ?? "GET";

      if (metodo !== "GET") {
        mutaciones.push(`${metodo} ${url}`);
        return Promise.resolve(json({}, 204));
      }

      if (url.startsWith(`${API_PREFIX}/auth/session`)) return Promise.resolve(json(comoPadre()));
      if (url.startsWith(`${API_PREFIX}/auth/profiles`))
        return Promise.resolve(json({ profiles: [] }));
      if (url.startsWith(`${API_PREFIX}/children`))
        return Promise.resolve(
          json({ items: hijos, page: 1, pageSize: 20, total: hijos.length, totalPages: 1 }),
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
}

/**
 * La fila de ese hijo, ESPERÁNDOLA.
 *
 * Asíncrona a propósito: el título y los filtros se pintan antes de que llegue
 * la respuesta, así que buscar la fila en cuanto monta deja comprobando sobre un
 * esqueleto. Ya costó dos tests en `redesign-parent-inbox`.
 */
async function filaDe(nombre: string): Promise<HTMLElement> {
  return (await screen.findByText(nombre)).closest("li") as HTMLElement;
}

/**
 * La acción menos reversible del producto se confirmaba con MENOS ceremonia que
 * la más reversible.
 *
 * Retirar un premio se revierte publicándolo otra vez y ya se preguntaba con un
 * diálogo; dar de baja un perfil NO se deshace y se preguntaba con un párrafo y
 * dos botones sueltos dentro de la fila — a un toque de la fila del hijo de al
 * lado, en una tablet que se usa con el dedo.
 */
describe("dar de baja se confirma en un diálogo", () => {
  it("preguntar no da de baja a nadie", async () => {
    await montar([hijo("h1", "Mateo", false)]);

    await userEvent.click(
      within(await filaDe("Mateo")).getByRole("button", { name: new RegExp(`^${messages.children.deactivate}\\b`) }),
    );

    const dialogo = await screen.findByRole("dialog");
    expect(within(dialogo).getByText(messages.children.deactivateConfirm)).toBeInTheDocument();
    expect(mutaciones).toEqual([]);
  });

  it("cerrar con Escape deja el perfil como estaba", async () => {
    await montar([hijo("h1", "Mateo", false)]);

    await userEvent.click(
      within(await filaDe("Mateo")).getByRole("button", { name: new RegExp(`^${messages.children.deactivate}\\b`) }),
    );
    await screen.findByRole("dialog");

    await userEvent.keyboard("{Escape}");

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(mutaciones).toEqual([]);
  });

  it("confirmar sí la ejecuta", async () => {
    await montar([hijo("h1", "Mateo", false)]);

    await userEvent.click(
      within(await filaDe("Mateo")).getByRole("button", { name: new RegExp(`^${messages.children.deactivate}\\b`) }),
    );
    const dialogo = await screen.findByRole("dialog");

    await userEvent.click(
      within(dialogo).getByRole("button", { name: messages.children.deactivateSubmit }),
    );

    expect(mutaciones).toHaveLength(1);
    expect(mutaciones[0]).toContain("/children/h1");
  });
});

/**
 * Bloqueado es un ESTADO, no un error.
 *
 * Significa que ese niño falló el PIN varias veces: no es una avería ni una
 * culpa de nadie, y el rojo se lo diría.
 */
describe("un perfil bloqueado se lee como estado", () => {
  it("se distingue de uno sin bloquear por algo más que el texto", async () => {
    await montar([hijo("h1", "Mateo", true), hijo("h2", "Emma", false)]);

    await screen.findByText("Mateo");

    // La etiqueta existe SOLO en el bloqueado: si ambos la llevaran con el mismo
    // tono, esta comprobación no diría nada.
    const bloqueado = await filaDe("Mateo");
    const libre = await filaDe("Emma");

    expect(within(bloqueado).getByText(messages.children.locked)).toBeInTheDocument();
    expect(within(libre).queryByText(messages.children.locked)).toBeNull();
  });

  it("desbloquear se ofrece SOLO al que está bloqueado", async () => {
    await montar([hijo("h1", "Mateo", true), hijo("h2", "Emma", false)]);

    await screen.findByText("Mateo");

    // Ofrecer desbloquear un perfil que no lo está es prometer algo que no hace
    // nada, la misma regla que gobierna las dos bandejas.
    expect(screen.getAllByRole("button", { name: new RegExp(`^${messages.children.unlock}\\b`) })).toHaveLength(1);
    expect(
      within(await filaDe("Mateo")).getByRole("button", { name: new RegExp(`^${messages.children.unlock}\\b`) }),
    ).toBeInTheDocument();
  });
});

/**
 * Último sitio donde quedaba un campo suelto con un botón al lado.
 */
describe("reponer el PIN es un formulario", () => {
  it("se envía con Enter", async () => {
    await montar([hijo("h1", "Mateo", false)]);

    const fila = await filaDe("Mateo");
    await userEvent.click(
      within(fila).getByRole("button", { name: new RegExp(`^${messages.children.resetPinFull}\\b`) }),
    );

    await userEvent.type(await within(fila).findByLabelText(PIN_LABEL), "1234");
    await userEvent.keyboard("{Enter}");

    expect(mutaciones).toHaveLength(1);
    expect(mutaciones[0]).toContain("pin");
  });
});

describe("cada perfil enseña lo que hace falta para decidir", () => {
  it("el saldo sale con la pieza de monedas", async () => {
    await montar([hijo("h1", "Mateo", false)]);

    await screen.findByText("Mateo");

    expect(within(await filaDe("Mateo")).getByLabelText(/120\s+monedas/)).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------

/**
 * EL DIÁLOGO DE BAJA TIENE QUE HACER DOS COSAS, Y LA SEGUNDA ES LA QUE IMPORTA.
 *
 * Avisar de que no se deshace es lo obvio, y no ataja el error real: quien llega
 * aquí suele ser un padre cuyo hijo se quedó fuera por fallar el PIN, con «Dar de
 * baja» a un dedo de «Bloqueado» en la misma fila. Un diálogo que solo avise
 * pasaría este test con la mitad del trabajo hecho, así que se comprueban las
 * dos: que dice que es definitivo Y que ofrece la otra salida.
 *
 * Y la ofrece SOLO cuando existe: sobre un perfil que no está bloqueado, hablar
 * de desbloquear es ruido que aleja de la decisión que se está tomando.
 */
describe("dar de baja avisa, y ofrece la salida cuando la hay", () => {
  it("sobre un perfil bloqueado, dice que es definitivo y ofrece desbloquear", async () => {
    await montar([hijo("h1", "Mateo", true)]);

    await userEvent.click(
      within(await filaDe("Mateo")).getByRole("button", {
        name: new RegExp(`^${messages.children.deactivate}\\b`),
      }),
    );

    const dialogo = await screen.findByRole("dialog");

    expect(within(dialogo).getByText(messages.children.deactivateConfirm)).toBeInTheDocument();
    expect(within(dialogo).getByText(messages.children.deactivateLockedHint)).toBeInTheDocument();
    expect(
      within(dialogo).getByRole("button", {
        name: new RegExp(`^${messages.children.unlock}\\b`),
      }),
    ).toBeInTheDocument();
  });

  it("y sobre uno que no lo está, no habla de desbloquear", async () => {
    await montar([hijo("h1", "Mateo", false)]);

    await userEvent.click(
      within(await filaDe("Mateo")).getByRole("button", {
        name: new RegExp(`^${messages.children.deactivate}\\b`),
      }),
    );

    const dialogo = await screen.findByRole("dialog");

    expect(within(dialogo).getByText(messages.children.deactivateConfirm)).toBeInTheDocument();
    expect(within(dialogo).queryByText(messages.children.deactivateLockedHint)).toBeNull();
  });
});

/**
 * DOS PALABRAS PARECIDAS Y UNA SOLA IRREVERSIBLE, dicho ANTES de pulsar.
 *
 * La fila ofrece «Dar de baja» y, cuando toca, «Desbloquear». La diferencia que
 * importa no es de matiz: una se deshace pulsándola otra vez y la otra se lleva
 * el saldo y el historial de un niño para siempre.
 *
 * Y el test exige que esté SIN ABRIR NADA, que es la mitad que distingue: el
 * diálogo de confirmación ya lo explica, pero allí llega quien ya pulsó. Un caso
 * que solo comprobara «la pantalla lo dice en algún momento» pasaría con la
 * explicación escondida dentro del diálogo, o sea con el defecto puesto.
 */
describe("la pantalla distingue dar de baja de bloquear", () => {
  it("lo dice sin abrir ningún diálogo", async () => {
    await montar([hijo("h1", "Mateo", false)]);
    await filaDe("Mateo");

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.getByText(messages.children.deactivateVsLock)).toBeInTheDocument();
  });
});

/**
 * LA EDAD SE ESCRIBE CON SU UNIDAD, y el caso es de UN año a propósito.
 *
 * Se escribía «Edad: 8» aquí y «8 años» en el perfil del propio niño: el mismo
 * dato de dos maneras. Al unificarlo, el riesgo que queda es el clásico de
 * componer una cifra con un texto — «1 años» —, y con una edad de 8 este test
 * pasaría igual sin declinar. Con 1 solo pasa si de verdad se declina.
 */
describe("la edad de un hijo lleva su unidad", () => {
  it("con un año, en singular", async () => {
    await montar([{ ...hijo("h1", "Mateo", false), age: 1 }]);

    const fila = await filaDe("Mateo");

    expect(within(fila).getByText(`1 ${messages.children.yearsOne}`)).toBeInTheDocument();
  });

  it("y con más de uno, en plural", async () => {
    await montar([{ ...hijo("h1", "Mateo", false), age: 8 }]);

    const fila = await filaDe("Mateo");

    expect(within(fila).getByText(`8 ${messages.children.yearsMany}`)).toBeInTheDocument();
  });
});
