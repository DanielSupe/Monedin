import { API_PREFIX, type Child } from "@monedin/contracts";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider, createMemoryHistory, createRouter } from "@tanstack/react-router";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { routeTree } from "../../src/routeTree.gen";
import { messages } from "../../src/lib/messages.js";
import { comoPadre } from "../support/router.js";

afterEach(() => {
  vi.unstubAllGlobals();
});

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
  {
    id: "h2",
    name: "Emma",
    avatar: "zorro",
    age: 6,
    coins: 80,
    locked: false,
    createdAt: "2026-09-01T10:00:00.000Z",
  },
];

let enviado: unknown = null;

function json(cuerpo: unknown, status = 200): Response {
  return new Response(JSON.stringify(cuerpo), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function montar(direccion: string, hijos: Child[] = HIJOS) {
  enviado = null;

  vi.stubGlobal(
    "fetch",
    vi.fn((entrada: RequestInfo | URL, init?: RequestInit) => {
      const url = String(entrada);

      if (init?.method === "POST" && typeof init.body === "string") {
        enviado = JSON.parse(init.body);
        return Promise.resolve(json([], 201));
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
    history: createMemoryHistory({ initialEntries: [direccion] }),
  });

  await router.load();

  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );

  return router;
}

async function rellenarMinimo(etiquetaTitulo: string): Promise<void> {
  await userEvent.click(await screen.findByRole("checkbox", { name: /Mateo/ }));
  await userEvent.type(screen.getByLabelText(etiquetaTitulo), "Recoger la mesa");
}

describe("una pantalla de escritura es un formulario", () => {
  it("la tarea se envía con Enter", async () => {
    await montar("/tasks/new");
    await rellenarMinimo(messages.tasks.taskTitle);

    await userEvent.keyboard("{Enter}");

    expect(enviado).not.toBeNull();
  });

  it("el premio se envía con Enter", async () => {
    await montar("/rewards/new");
    await rellenarMinimo(messages.rewards.rewardTitle);

    await userEvent.keyboard("{Enter}");

    expect(enviado).not.toBeNull();
  });
});

describe("la pieza construye la forma que el contrato espera", () => {
  it("con el mismo valor para todos manda childIds y coins", async () => {
    await montar("/tasks/new");
    await rellenarMinimo(messages.tasks.taskTitle);
    await userEvent.click(screen.getByRole("checkbox", { name: /Emma/ }));

    await userEvent.click(screen.getByRole("button", { name: messages.tasks.create }));

    expect(enviado).toMatchObject({ childIds: ["h1", "h2"], coins: 10 });
    expect(enviado).not.toHaveProperty("assignments");
  });

  it("con un valor por hijo manda assignments", async () => {
    await montar("/tasks/new");
    await rellenarMinimo(messages.tasks.taskTitle);

    await userEvent.click(screen.getByRole("radio", { name: messages.tasks.coinsPerChild }));

    const suyo = screen.getByRole("spinbutton", {
      name: new RegExp(`${messages.tasks.coins} · Mateo`),
    });
    await userEvent.type(suyo, "35");

    await userEvent.click(screen.getByRole("button", { name: messages.tasks.create }));

    expect(enviado).toMatchObject({ assignments: [{ childId: "h1", coins: 35 }] });
    expect(enviado).not.toHaveProperty("childIds");
  });

  it("sin ningún hijo elegido explica qué falta y NO llama al servidor", async () => {
    await montar("/tasks/new");
    await userEvent.type(
      await screen.findByLabelText(messages.tasks.taskTitle),
      "Recoger la mesa",
    );

    await userEvent.click(screen.getByRole("button", { name: messages.tasks.create }));

    expect(await screen.findByText(messages.children.pickAtLeastOne)).toBeInTheDocument();

    expect(enviado).toBeNull();
  });
});

describe("un premio se edita sin cambiar de dirección", () => {
  it("el editor se abre dentro del catálogo", async () => {
    const router = await montar("/rewards?page=1&status=ACTIVE");

    await screen.findByRole("heading", { name: messages.rewards.title });

    expect(router.state.location.pathname).toBe("/rewards");
    expect(screen.queryByRole("link", { name: messages.rewards.edit })).toBeNull();
  });
});

describe("cuando todavía no hay hijos", () => {
  it("lo dice y ofrece crear un perfil", async () => {
    await montar("/tasks/new", []);

    expect(await screen.findByText(messages.tasks.noChildren)).toBeInTheDocument();
    const salida = screen.getByRole("link", { name: messages.children.addChild });
    expect(salida).toHaveAttribute("href", expect.stringContaining("/children"));
  });
});

describe("cancelar es una navegación", () => {
  it("el alta de un hijo ofrece salir con un enlace", async () => {
    await montar("/children/new");

    const salir = await screen.findByRole("link", { name: messages.children.cancel });
    expect(salir).toHaveAttribute("href", expect.stringContaining("/children"));
  });
});

describe("los controles traídos siguen funcionando con el teclado", () => {
  it("la casilla de un hijo se marca con la barra espaciadora", async () => {
    await montar("/tasks/new");

    const casilla = await screen.findByRole("checkbox", { name: /Mateo/ });
    expect(casilla).toHaveAttribute("aria-checked", "false");

    casilla.focus();
    await userEvent.keyboard(" ");

    expect(casilla).toHaveAttribute("aria-checked", "true");
  });

  it("el grupo del valor se anuncia, y elegir el otro modo cambia lo que se pide", async () => {
    await montar("/tasks/new");

    await userEvent.click(await screen.findByRole("checkbox", { name: /Mateo/ }));

    const mismo = screen.getByRole("radio", { name: messages.tasks.sameCoins });
    const porHijo = screen.getByRole("radio", { name: messages.tasks.coinsPerChild });

    expect(mismo).toHaveAttribute("aria-checked", "true");
    expect(porHijo).toHaveAttribute("aria-checked", "false");

    await userEvent.click(porHijo);

    expect(porHijo).toHaveAttribute("aria-checked", "true");

    expect(screen.getByLabelText(`${messages.tasks.coins} · Mateo`)).toBeInTheDocument();
  });
});

describe("el nombre del grupo del valor se ve y se oye", () => {
  it("está en la pantalla y además nombra al grupo", async () => {
    await montar("/tasks/new");

    await userEvent.click(await screen.findByRole("checkbox", { name: /Mateo/ }));

    expect(screen.getByRole("radiogroup", { name: messages.tasks.valueLegend })).toBeInTheDocument();
    expect(screen.getByText(messages.tasks.valueLegend)).toBeInTheDocument();
  });

  it("y dice a cuántos va ese valor, declinado", async () => {
    await montar("/tasks/new");

    await userEvent.click(await screen.findByRole("checkbox", { name: /Mateo/ }));

    const valor = screen.getByRole("spinbutton", { name: messages.tasks.coins });
    await userEvent.clear(valor);
    await userEvent.type(valor, "1");

    expect(
      screen.getByText(`${1} ${messages.ui.coinsUnitSingular} ${messages.children.coinsEachChosen}`),
    ).toBeInTheDocument();
  });
});
