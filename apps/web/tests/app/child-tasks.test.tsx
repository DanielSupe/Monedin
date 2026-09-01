import { API_PREFIX, type OwnTask } from "@monedin/contracts";
import { render, screen, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, describe, expect, it, vi } from "vitest";
import { messages } from "../../src/lib/messages.js";
import { MyTasks } from "../../src/features/tasks/MyTasks.js";

afterEach(() => {
  vi.unstubAllGlobals();
});

/** Una tarea de cada etapa del ciclo. */
const TAREAS: OwnTask[] = [
  {
    id: "t1",
    title: "Sacar la basura",
    description: null,
    coins: 20,
    dueDate: null,
    status: "PENDING",
    evidence: null,
    createdAt: "2026-08-31T10:00:00.000Z",
  },
  {
    id: "t2",
    title: "Leer 15 minutos",
    description: null,
    coins: 40,
    dueDate: null,
    status: "COMPLETED",
    evidence: null,
    createdAt: "2026-08-31T10:00:00.000Z",
  },
  {
    id: "t3",
    title: "Hacer la cama",
    description: null,
    coins: 50,
    dueDate: null,
    status: "APPROVED",
    evidence: null,
    createdAt: "2026-08-31T10:00:00.000Z",
  },
];

function montar(tareas: OwnTask[] = TAREAS): void {
  vi.stubGlobal(
    "fetch",
    vi.fn((entrada: RequestInfo | URL) => {
      const url = String(entrada);
      const cuerpo = url.startsWith(`${API_PREFIX}/tasks/mine`)
        ? { items: tareas, page: 1, pageSize: 20, total: tareas.length, totalPages: 1 }
        : {};

      return Promise.resolve(
        new Response(JSON.stringify(cuerpo), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );
    }),
  );

  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  render(
    <QueryClientProvider client={queryClient}>
      <MyTasks />
    </QueryClientProvider>,
  );
}

/**
 * Las tres etapas del ciclo.
 *
 * El producto protege esas transiciones con condiciones y comprobaciones de
 * fila afectada. Presentarlas como tres párrafos iguales dentro de rectángulos
 * iguales tiraba esa distinción justo donde el niño la necesita.
 */
describe("el estado de una tarea se distingue por su forma", () => {
  it("cada etapa lleva su etiqueta", async () => {
    montar();

    expect(await screen.findByText(messages.tasks.statusPending)).toBeInTheDocument();
    expect(screen.getByText(messages.tasks.statusCompleted)).toBeInTheDocument();
    expect(screen.getByText(messages.tasks.statusApproved)).toBeInTheDocument();
  });

  /*
   * Lo que se ve y lo que se puede hacer van juntos: la transición sale de
   * `PENDING`, así que ofrecer marcar una tarea que ya no lo está es ofrecer
   * algo que acabaría en 409.
   */
  it("SOLO la pendiente ofrece marcarla", async () => {
    montar();

    await screen.findByText(messages.tasks.statusPending);

    const botones = screen.getAllByRole("button", { name: messages.tasks.markDone });
    expect(botones).toHaveLength(1);

    const pendiente = screen.getByText("Sacar la basura").closest("li");
    expect(within(pendiente as HTMLElement).getByRole("button", { name: messages.tasks.markDone }))
      .toBeInTheDocument();
  });

  it("una tarea aprobada dice cuántas monedas dio", async () => {
    montar();

    const aprobada = (await screen.findByText("Hacer la cama")).closest("li") as HTMLElement;

    expect(within(aprobada).getByText(messages.tasks.earned)).toBeInTheDocument();
    expect(within(aprobada).getByLabelText(/50\s+monedas/)).toBeInTheDocument();
  });
});

/**
 * El control de archivo nativo pide unos 360px de ancho mínimo y, en una
 * rejilla, arrastra a su columna: dos pantallas del niño desbordaban por él sin
 * tenerlo en su propio código.
 */
describe("el control de subir imagen", () => {
  it("no enseña el control nativo, pero sigue estando", async () => {
    montar();

    await screen.findByText(messages.tasks.statusPending);

    const nativo = document.querySelector('input[type="file"]');
    expect(nativo).not.toBeNull();

    // Sigue en el árbol y sigue siendo alcanzable: ocultar a la vista no es
    // quitar. Lo que NO puede es ocupar sitio en la disposición, y eso lo da
    // estar fuera del flujo.
    //
    // Se comprueba la CLASE y no el estilo calculado: en jsdom no hay hoja de
    // estilos, así que `getComputedStyle` diría `static` para cualquier
    // utilidad de Tailwind. Que la clase haga lo que dice se comprobó midiendo
    // en el navegador —de 360px de ancho mínimo a 1—, no aquí.
    expect(nativo).not.toBeDisabled();
    expect((nativo as Element).className).toContain("absolute");
  });

  it("lo dispara una etiqueta que sí se ve", async () => {
    montar();

    await screen.findByText(messages.tasks.statusPending);

    const nativo = document.querySelector('input[type="file"]') as HTMLElement;
    const etiqueta = nativo.closest("label");

    expect(etiqueta).not.toBeNull();
    expect(etiqueta).toHaveTextContent(messages.tasks.addEvidence);
  });
});
