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

async function filaDe(nombre: string): Promise<HTMLElement> {
  return (await screen.findByText(nombre)).closest("li") as HTMLElement;
}

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

describe("un perfil bloqueado se lee como estado", () => {
  it("se distingue de uno sin bloquear por algo más que el texto", async () => {
    await montar([hijo("h1", "Mateo", true), hijo("h2", "Emma", false)]);

    await screen.findByText("Mateo");

    const bloqueado = await filaDe("Mateo");
    const libre = await filaDe("Emma");

    expect(within(bloqueado).getByText(messages.children.locked)).toBeInTheDocument();
    expect(within(libre).queryByText(messages.children.locked)).toBeNull();
  });

  it("desbloquear se ofrece SOLO al que está bloqueado", async () => {
    await montar([hijo("h1", "Mateo", true), hijo("h2", "Emma", false)]);

    await screen.findByText("Mateo");

    expect(screen.getAllByRole("button", { name: new RegExp(`^${messages.children.unlock}\\b`) })).toHaveLength(1);
    expect(
      within(await filaDe("Mateo")).getByRole("button", { name: new RegExp(`^${messages.children.unlock}\\b`) }),
    ).toBeInTheDocument();
  });
});

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

describe("la pantalla distingue dar de baja de bloquear", () => {
  it("lo dice sin abrir ningún diálogo", async () => {
    await montar([hijo("h1", "Mateo", false)]);
    await filaDe("Mateo");

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.getByText(messages.children.deactivateVsLock)).toBeInTheDocument();
  });
});

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
