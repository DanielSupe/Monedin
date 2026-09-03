import { API_PREFIX, type Child, type OwnReward, type Reward } from "@monedin/contracts";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider, createMemoryHistory, createRouter } from "@tanstack/react-router";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MyRewards } from "../../src/features/rewards/MyRewards.js";
import { messages } from "../../src/lib/messages.js";
import { routeTree } from "../../src/routeTree.gen";
import { comoNino, comoPadre } from "../support/router.js";

afterEach(() => {
  vi.unstubAllGlobals();
});

const FOTO = "https://almacen.ejemplo.dev/rewards/r1/abc.jpg?firma=1";

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
];

function json(cuerpo: unknown, status = 200): Response {
  return new Response(JSON.stringify(cuerpo), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function pagina<T>(items: T[]): unknown {
  return { items, page: 1, pageSize: 20, total: items.length, totalPages: 1 };
}

/** Un premio del catálogo del padre. */
function premio(id: string, title: string, image: string | null): Reward {
  return {
    id,
    title,
    description: null,
    image,
    status: "ACTIVE",
    offers: [],
    createdAt: "2026-09-01T10:00:00.000Z",
    updatedAt: "2026-09-01T10:00:00.000Z",
  };
}

/** Un premio del escaparate del niño. */
function ofrecido(id: string, title: string, image: string | null): OwnReward {
  return {
    id,
    title,
    description: null,
    coins: 60,
    image,
    affordable: true,
    createdAt: "2026-09-01T10:00:00.000Z",
  };
}

/** Lo que se envió en el último POST, ya parseado. Como en `parent-authoring`. */
let enviado: Record<string, unknown> | null = null;

/**
 * Monta la aplicación del padre en una dirección, con el catálogo que se diga.
 *
 * Con router de verdad y no montando el componente suelto: `RewardCatalog` y
 * `RewardForm` usan enlaces y navegación, y sin router revientan al pintar.
 */
async function montarPadre(direccion: string, premios: Reward[] = []) {
  enviado = null;

  vi.stubGlobal(
    "fetch",
    vi.fn((entrada: RequestInfo | URL, init?: RequestInit) => {
      const url = String(entrada);

      if (init?.method === "POST" && typeof init.body === "string") {
        enviado = JSON.parse(init.body) as Record<string, unknown>;
        return Promise.resolve(json(premio("r9", "Helado", null), 201));
      }

      if (url.startsWith(`${API_PREFIX}/auth/session`)) return Promise.resolve(json(comoPadre()));
      if (url.startsWith(`${API_PREFIX}/auth/profiles`))
        return Promise.resolve(json({ profiles: [] }));
      if (url.startsWith(`${API_PREFIX}/children`)) return Promise.resolve(json(pagina(HIJOS)));
      if (url.startsWith(`${API_PREFIX}/rewards`)) return Promise.resolve(json(pagina(premios)));

      return Promise.resolve(json(pagina([])));
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

/** El escaparate del niño se monta suelto: no navega a ningún sitio. */
function montarNino(premios: OwnReward[]): void {
  vi.stubGlobal(
    "fetch",
    vi.fn((entrada: RequestInfo | URL) => {
      const url = String(entrada);
      if (url.startsWith(`${API_PREFIX}/auth/session`)) return Promise.resolve(json(comoNino()));
      if (url.startsWith(`${API_PREFIX}/rewards/mine`)) return Promise.resolve(json(pagina(premios)));
      return Promise.resolve(json(pagina([])));
    }),
  );

  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <MyRewards />
    </QueryClientProvider>,
  );
}

function fila(titulo: string): HTMLElement {
  return screen.getByText(titulo).closest("li") as HTMLElement;
}

/**
 * Un premio sin foto dejaba un HUECO donde las demás filas tienen imagen, en las
 * dos pantallas. Se lee como algo que se rompió al cargar, no como un premio sin
 * foto.
 *
 * Los dos casos van en el MISMO test a propósito: comprobar solo que el premio
 * sin foto trae respaldo pasaría igual con un respaldo pintado SIEMPRE, también
 * debajo de la foto. Hay que mirar los dos y que den cosas distintas.
 */
describe("un premio sin foto se dibuja con un respaldo", () => {
  it("en el escaparate del niño, y el que tiene foto no lo lleva", async () => {
    montarNino([ofrecido("r1", "Helado", null), ofrecido("r2", "Cine", FOTO)]);

    await screen.findByText("Helado");

    expect(within(fila("Helado")).getByTestId("reward-image-fallback")).toBeInTheDocument();
    expect(within(fila("Helado")).queryByRole("img")).toBeNull();

    expect(within(fila("Cine")).getByRole("img")).toHaveAttribute("src", FOTO);
    expect(within(fila("Cine")).queryByTestId("reward-image-fallback")).toBeNull();
  });

  it("en el catálogo del padre, y el que tiene foto no lo lleva", async () => {
    await montarPadre("/rewards?page=1&status=ACTIVE", [
      premio("r1", "Helado", null),
      premio("r2", "Cine", FOTO),
    ]);

    await screen.findByText("Helado");

    expect(within(fila("Helado")).getByTestId("reward-image-fallback")).toBeInTheDocument();
    expect(within(fila("Helado")).queryByRole("img")).toBeNull();

    expect(within(fila("Cine")).getByRole("img")).toHaveAttribute("src", FOTO);
    expect(within(fila("Cine")).queryByTestId("reward-image-fallback")).toBeNull();
  });

  it("y el glifo no le llega a quien escucha la pantalla", async () => {
    montarNino([ofrecido("r1", "Helado", null)]);

    await screen.findByText("Helado");

    // El glifo es decorativo: lo que nombra al premio es su título. Se comprueba
    // el atributo, que es lo que lo saca del árbol de accesibilidad — buscarlo
    // por texto lo encuentra igual, porque las consultas no filtran por él.
    expect(within(fila("Helado")).getByText(messages.rewards.imageFallbackGlyph)).toHaveAttribute(
      "aria-hidden",
      "true",
    );
  });
});

/**
 * La foto en el ALTA, que hasta ahora no se podía.
 *
 * Lo que se comprueba es que la clave viaja en el cuerpo del alta. La subida en
 * sí la hace `ImageUploadField`, que ya tenía sus propios tests y no se toca.
 */
describe("un premio se publica con foto, o sin ella", () => {
  it("la pantalla ofrece poner una foto y dice que es opcional", async () => {
    await montarPadre("/rewards/new");

    expect(await screen.findByText(messages.rewards.optionalImage)).toBeInTheDocument();
  });

  it("sin foto, el alta no lleva ninguna clave", async () => {
    await montarPadre("/rewards/new");

    await userEvent.type(await screen.findByLabelText(messages.rewards.rewardTitle), "Helado");
    await userEvent.click(screen.getByRole("checkbox", { name: /Mateo/ }));
    await userEvent.click(screen.getByRole("button", { name: messages.rewards.create }));

    expect(enviado).not.toBeNull();
    expect(enviado).not.toHaveProperty("imageUploadKey");
  });
});
