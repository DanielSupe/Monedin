import { API_PREFIX, ERROR_CODES, type Redemption, type TaskBatch } from "@monedin/contracts";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider, createMemoryHistory, createRouter } from "@tanstack/react-router";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { routeTree } from "../../src/routeTree.gen";
import { messages } from "../../src/lib/messages.js";
import { comoPadre } from "../support/router.js";

afterEach(() => {
  vi.unstubAllGlobals();
});

function tarea(id: string, status: "PENDING" | "COMPLETED" | "APPROVED") {
  return {
    id,
    batchId: "b1",
    title: "Recoger la mesa",
    description: null,
    coins: 20,
    status,
    dueDate: null,
    evidence: null,
    child: { id: `h-${id}`, name: `Hijo ${id}`, avatar: "zorro" },
    createdAt: "2026-09-01T10:00:00.000Z",
    updatedAt: "2026-09-01T10:00:00.000Z",
  };
}

/**
 * Los botones de una acción, buscados por el PRINCIPIO de su nombre.
 *
 * Desde `redesign-parent-screens` el nombre accesible de cada acción lleva
 * detrás sobre qué actúa —«Aprobar: Recoger la mesa, Hijo t1»—, porque cuatro
 * hijos esperando ponen cuatro botones «Aprobar» seguidos y de viva voz suenan
 * idénticos: quien no ve la pantalla no tiene el orden para distinguirlos.
 *
 * Se busca con una expresión anclada al principio y no con el texto exacto, que
 * es justo lo que dejaría de encontrar ese nombre completo.
 */
function acciones(accion: string): HTMLElement[] {
  return screen.getAllByRole("button", { name: new RegExp(`^${accion}\\b`) });
}

/** Un reparto con las tres etapas dentro: lo que se ve al filtrar por una. */
const REPARTO_MEZCLADO = {
  batchId: "b1",
  title: "Recoger la mesa",
  description: null,
  dueDate: null,
  createdAt: "2026-09-01T10:00:00.000Z",
  tasks: [tarea("t1", "COMPLETED"), tarea("t2", "PENDING"), tarea("t3", "APPROVED")],
} as TaskBatch;

const CANJE_PENDIENTE = {
  id: "c1",
  coins: 60,
  status: "PENDING",
  reward: { id: "r1", title: "Helado" },
  child: { id: "h1", name: "Mateo", avatar: "zorro" },
  createdAt: "2026-09-01T10:00:00.000Z",
  updatedAt: "2026-09-01T10:00:00.000Z",
} as Redemption;

const CANJE_RESUELTO = { ...CANJE_PENDIENTE, id: "c2", status: "APPROVED" } as Redemption;

function pagina(items: unknown[], totalPages = 1): unknown {
  return { items, page: 1, pageSize: 20, total: items.length, totalPages };
}

function json(cuerpo: unknown, status = 200): Response {
  return new Response(JSON.stringify(cuerpo), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * Monta una bandeja con router de verdad.
 *
 * `fallaAlResolver` decide con qué código responden las mutaciones, que es lo
 * que permite comprobar que un 409 no se cuenta igual que un error.
 */
async function montar(
  direccion: string,
  {
    repartos = [] as TaskBatch[],
    canjes = [] as Redemption[],
    totalPages = 1,
    fallaAlResolver,
  }: {
    repartos?: TaskBatch[];
    canjes?: Redemption[];
    totalPages?: number;
    fallaAlResolver?: { status: number; code: string; message: string };
  } = {},
) {
  vi.stubGlobal(
    "fetch",
    vi.fn((entrada: RequestInfo | URL, init?: RequestInit) => {
      const url = String(entrada);

      // Las mutaciones son POST sobre una acción; los listados son GET.
      if (init?.method === "POST" && fallaAlResolver !== undefined) {
        return Promise.resolve(json(fallaAlResolver, fallaAlResolver.status));
      }

      if (url.startsWith(`${API_PREFIX}/auth/session`)) return Promise.resolve(json(comoPadre()));
      if (url.startsWith(`${API_PREFIX}/auth/profiles`))
        return Promise.resolve(json({ profiles: [] }));
      if (url.startsWith(`${API_PREFIX}/tasks`))
        return Promise.resolve(json(pagina(repartos, totalPages)));
      if (url.startsWith(`${API_PREFIX}/redemptions`))
        return Promise.resolve(json(pagina(canjes, totalPages)));

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

/** Devuelve las clases del aviso que contiene ese texto. */
function tonoDelAviso(texto: string): string {
  const parrafo = screen.getByText(texto);
  return (parrafo.closest("[role]") ?? parrafo).className;
}

/**
 * La distinción que la API protege entera y esta pantalla tiraba.
 *
 * Un 409 aquí significa una cosa: alguien se adelantó. El padre aprobó dos
 * veces, o resolvió desde otro dispositivo. Pintarlo del mismo rojo que un
 * fallo le echa la culpa a quien está mirando.
 */
describe("un conflicto no se cuenta como un error", () => {
  const CONFLICTO = {
    status: 409,
    code: ERROR_CODES.CONFLICT,
    message: "ya no está pendiente",
  };
  const FALLO = {
    status: 422,
    code: ERROR_CODES.VALIDATION_ERROR,
    message: "algo no es válido",
  };

  it("el 409 sale en advertencia y el 422 en peligro, y NO se parecen", async () => {
    await montar("/tasks?page=1&status=ALL", {
      repartos: [REPARTO_MEZCLADO],
      fallaAlResolver: CONFLICTO,
    });

    await userEvent.click(
      (await screen.findAllByRole("button", { name: new RegExp(`^${messages.tasks.approve}\\b`) }))[0] as HTMLElement,
    );

    await screen.findByText(messages.tasks.conflict);
    const tonoConflicto = tonoDelAviso(messages.tasks.conflict);

    // Y ahora el otro caso, en un montaje limpio.
    vi.unstubAllGlobals();
    document.body.innerHTML = "";

    await montar("/tasks?page=1&status=ALL", {
      repartos: [REPARTO_MEZCLADO],
      fallaAlResolver: FALLO,
    });

    await userEvent.click(
      (await screen.findAllByRole("button", { name: new RegExp(`^${messages.tasks.approve}\\b`) }))[0] as HTMLElement,
    );

    await screen.findByText(messages.tasks.invalidData);
    const tonoError = tonoDelAviso(messages.tasks.invalidData);

    /*
     * Se comparan los DOS tonos entre sí, no que cada aviso aparezca: con los
     * dos en rojo —que es como estaba antes de este change— un test que solo
     * buscara los textos seguiría en verde. Comprobado inyectando la violación.
     */
    expect(tonoConflicto).not.toEqual(tonoError);
  });
});

describe("cada fila ofrece solo lo que su estado permite", () => {
  it("en las tareas, solo la completada se puede resolver", async () => {
    await montar("/tasks?page=1&status=ALL", { repartos: [REPARTO_MEZCLADO] });

    await screen.findByText("Recoger la mesa");

    // Tres tareas en el reparto y UNA sola pareja de aprobar/rechazar.
    expect(acciones(messages.tasks.approve)).toHaveLength(1);
    expect(acciones(messages.tasks.reject)).toHaveLength(1);
    // Y borrar solo sobre la pendiente.
    expect(acciones(messages.tasks.remove)).toHaveLength(1);
  });

  it("un canje ya resuelto no se puede volver a resolver", async () => {
    await montar("/redemptions?page=1&status=ALL", {
      canjes: [CANJE_PENDIENTE, { ...CANJE_RESUELTO, child: { ...CANJE_RESUELTO.child, name: "Emma" } }],
    });

    // Se espera a la LISTA y no al título: el título se pinta antes de que
    // llegue la respuesta, así que esperarlo dejaría comprobando un esqueleto.
    await screen.findByText("Emma");

    expect(acciones(messages.redemptions.approve)).toHaveLength(1);
    expect(acciones(messages.redemptions.reject)).toHaveLength(1);
  });
});

describe("el filtro es un conjunto de direcciones", () => {
  it("cada opción es un enlace, y la vigente se anuncia como actual", async () => {
    await montar("/tasks?page=1&status=COMPLETED", { repartos: [REPARTO_MEZCLADO] });

    const filtro = await screen.findByRole("navigation", { name: messages.tasks.filterLabel });

    // Enlaces y no botones: el filtro vive en la dirección, así que cada opción
    // ES una dirección y tiene que poder abrirse en otra pestaña.
    const opciones = within(filtro).getAllByRole("link");
    expect(opciones).toHaveLength(4);
    expect(within(filtro).queryAllByRole("button")).toHaveLength(0);

    const vigente = within(filtro).getByRole("link", { name: messages.tasks.filterCompleted });
    expect(vigente).toHaveAttribute("aria-current", "page");
  });

  it("cambiar de filtro vuelve a la primera página", async () => {
    await montar("/tasks?page=4&status=ALL", { repartos: [REPARTO_MEZCLADO], totalPages: 6 });

    const filtro = await screen.findByRole("navigation", { name: messages.tasks.filterLabel });
    const otro = within(filtro).getByRole("link", { name: messages.tasks.filterCompleted });

    // Quedarse en la 4 al cambiar de filtro enseñaría una lista vacía sin
    // explicar por qué: cambia cuántas hay.
    expect(otro).toHaveAttribute("href", expect.stringContaining("page=1"));
  });
});

describe("un reparto filtrado explica por qué enseña lo que no casa", () => {
  it("con filtro, lo dice", async () => {
    await montar("/tasks?page=1&status=COMPLETED", { repartos: [REPARTO_MEZCLADO] });

    // La nota se pinta antes de que llegue la lista, así que se espera a la
    // lista y no a la nota: si no, se comprueba la fila sobre un esqueleto.
    await screen.findByText("Recoger la mesa");

    expect(screen.getByText(messages.tasks.wholeBatchNote)).toBeInTheDocument();

    // Y de hecho enseña las tres, no solo la que casa.
    expect(screen.getByText("Hijo t2")).toBeInTheDocument();
  });

  it("sin filtro, no hay nada que explicar", async () => {
    await montar("/tasks?page=1&status=ALL", { repartos: [REPARTO_MEZCLADO] });

    await screen.findByText("Recoger la mesa");
    expect(screen.queryByText(messages.tasks.wholeBatchNote)).toBeNull();
  });
});

// ---------------------------------------------------------------------------

/**
 * DOS ACCIONES EN LA MISMA FILA TIENEN QUE LEERSE DISTINTO.
 *
 * Comprobar que las dos etiquetas están en pantalla no comprueba que se
 * distingan: con la misma variante en las dos, ese test seguiría en verde. Se
 * comparan ENTRE SÍ.
 *
 * Y rechazar NO puede llevar el tono del peligro. Devuelve la tarea a pendiente
 * y no destruye nada: pintarlo de rojo le diría al padre que hizo algo grave por
 * pedirle a su hijo que la repita. Es el mismo argumento por el que un canje
 * rechazado va en advertencia y no en error.
 */
describe("aprobar manda y rechazar acompaña", () => {
  it("no comparten forma, y rechazar no es una acción peligrosa", async () => {
    await montar("/tasks?page=1&status=ALL", { repartos: [REPARTO_MEZCLADO] });
    await screen.findByText("Recoger la mesa");

    const aprobar = acciones(messages.tasks.approve)[0] as HTMLElement;
    const rechazar = acciones(messages.tasks.reject)[0] as HTMLElement;
    const borrar = acciones(messages.tasks.remove)[0] as HTMLElement;

    expect(aprobar.className).not.toEqual(rechazar.className);

    // Y rechazar no se parece a lo único que sí destruye algo en esta pantalla.
    expect(rechazar.className).not.toEqual(borrar.className);
  });

  /*
   * CUATRO «APROBAR» SEGUIDOS NO SE DISTINGUEN POR EL ORDEN.
   *
   * El caso lleva DOS hijos esperando en el mismo reparto, que es el mínimo para
   * que el defecto se note: con uno solo, un nombre genérico y uno completo
   * serían igual de útiles y el test pasaría con el defecto puesto.
   */
  it("cada acción dice sobre qué tarea y qué hijo actúa", async () => {
    await montar("/tasks?page=1&status=ALL", {
      repartos: [
        {
          batchId: "b9",
          title: "Tender la cama",
          description: null,
          dueDate: null,
          createdAt: "2026-09-01T10:00:00.000Z",
          tasks: [
            {
              ...tarea("t1", "COMPLETED"),
              title: "Tender la cama",
              child: { id: "h1", name: "Mateo", avatar: "zorro" },
            },
            {
              ...tarea("t2", "COMPLETED"),
              title: "Tender la cama",
              child: { id: "h2", name: "Emma", avatar: "lechuza" },
            },
          ],
        } as TaskBatch,
      ],
    });

    await screen.findByText("Tender la cama");

    const nombres = acciones(messages.tasks.approve).map((boton) =>
      boton.getAttribute("aria-label"),
    );

    expect(nombres).toHaveLength(2);
    // Los dos nombran su tarea y su hijo, y no son el mismo.
    expect(new Set(nombres).size).toBe(2);
    for (const nombre of nombres) {
      expect(nombre).toContain("Tender la cama");
    }
    expect(nombres.some((n) => n?.includes("Mateo"))).toBe(true);
    expect(nombres.some((n) => n?.includes("Emma"))).toBe(true);
  });
});

// ---------------------------------------------------------------------------

/**
 * LAS TRES REGLAS DEL CANJE, DONDE SE DECIDE.
 *
 * Están escritas en `CLAUDE.md` desde `add-rewards` y hasta hoy no llegaban a
 * ninguna pantalla: el padre pulsaba «Aprobar» sin saber que eso es lo que
 * cobra, ni con qué precio, ni qué le cuesta decir que no.
 *
 * SE COMPRUEBAN UNA A UNA, y esa es la mitad que importa. Con una sola
 * afirmación —«la nota está»— perder una de las tres reglas no se notaría: es
 * el mismo error que el test de los tres estados que pasaba con el mismo tono
 * en los tres.
 */
describe("la bandeja de canjes explica sus tres reglas", () => {
  const REGLAS = [
    messages.redemptions.ruleDiscountOnApprove,
    messages.redemptions.rulePriceFrozen,
    messages.redemptions.ruleRejectFree,
  ];

  it("con algo pendiente, las tres están en pantalla", async () => {
    await montar("/redemptions?page=1&status=ALL", { canjes: [CANJE_PENDIENTE] });

    await screen.findByText("Helado");

    for (const regla of REGLAS) {
      expect(screen.getByText(regla)).toBeInTheDocument();
    }
  });

  /*
   * Y NO SALEN CUANDO NO HAY NADA QUE DECIDIR. Son las respuestas a lo que un
   * padre se pregunta ANTES de pulsar; sin ninguna solicitud pendiente no hay
   * nada que preguntarse, y un párrafo permanente deja de leerse.
   */
  it("sin nada pendiente, no se dicen", async () => {
    await montar("/redemptions?page=1&status=APPROVED", { canjes: [CANJE_RESUELTO] });

    await screen.findByText("Helado");

    for (const regla of REGLAS) {
      expect(screen.queryByText(regla)).toBeNull();
    }
  });
});
