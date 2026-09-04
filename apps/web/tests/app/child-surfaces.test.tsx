import { API_PREFIX, type OwnRedemption, type OwnReward, type OwnTask } from "@monedin/contracts";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MyRedemptions } from "../../src/features/redemptions/MyRedemptions.js";
import { MyRewards } from "../../src/features/rewards/MyRewards.js";
import { MyTasks } from "../../src/features/tasks/MyTasks.js";
import { messages } from "../../src/lib/messages.js";
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

function pagina<T>(items: T[], total = items.length): unknown {
  return { items, page: 1, pageSize: 20, total, totalPages: 1 };
}

function premio(id: string, title: string, coins: number, image: string | null = null): OwnReward {
  return {
    id,
    title,
    description: null,
    coins,
    image,
    affordable: coins <= 120,
    createdAt: "2026-09-01T10:00:00.000Z",
  };
}

function tarea(id: string, title: string, status: OwnTask["status"]): OwnTask {
  return {
    id,
    title,
    description: null,
    coins: 20,
    status,
    dueDate: null,
    evidence: null,
    createdAt: "2026-09-01T10:00:00.000Z",
    updatedAt: "2026-09-01T10:00:00.000Z",
  };
}

function canje(
  id: string,
  title: string,
  coins: number,
  status: OwnRedemption["status"],
  createdAt: string,
): OwnRedemption {
  return {
    id,
    coins,
    status,
    reward: { id: `r-${id}`, title },
    createdAt,
    updatedAt: createdAt,
  };
}

function servir(datos: {
  premios?: OwnReward[];
  tareas?: OwnTask[];
  canjes?: OwnRedemption[];
  totalCanjes?: number;
}): void {
  vi.stubGlobal(
    "fetch",
    vi.fn((entrada: RequestInfo | URL) => {
      const url = String(entrada);

      if (url.startsWith(`${API_PREFIX}/auth/session`)) return Promise.resolve(json(comoNino()));
      if (url.startsWith(`${API_PREFIX}/rewards/mine`))
        return Promise.resolve(json(pagina(datos.premios ?? [])));
      if (url.startsWith(`${API_PREFIX}/tasks/mine`))
        return Promise.resolve(json(pagina(datos.tareas ?? [])));
      if (url.startsWith(`${API_PREFIX}/redemptions/mine`))
        return Promise.resolve(
          json(pagina(datos.canjes ?? [], datos.totalCanjes ?? (datos.canjes ?? []).length)),
        );

      return Promise.resolve(json(pagina([])));
    }),
  );
}

function montar(pantalla: React.ReactElement): void {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(<QueryClientProvider client={queryClient}>{pantalla}</QueryClientProvider>);
}

// ---------------------------------------------------------------------------

/**
 * Lo que este change existe para arreglar.
 *
 * Las tres pantallas eran `<ul className="flex list-none flex-col gap-3 p-0">`
 * con un `<li><Card>` dentro. Idénticas hasta en la clase, y no son lo mismo:
 * son los tres tiempos del ciclo que el producto enseña.
 *
 * Se montan LAS TRES en el mismo test a propósito. Mirar solo una pasaría con
 * las tres iguales otra vez, que es exactamente el defecto.
 */
describe("los tres destinos del niño no se dibujan igual", () => {
  it("cada uno monta una estructura distinta de los otros dos", async () => {
    servir({ premios: [premio("r1", "Helado", 60)] });
    montar(<MyRewards />);
    await screen.findByText("Helado");
    // Rejilla: sigue siendo una lista, y NO hay tabla.
    const escaparate = {
      lista: screen.queryAllByRole("list").length > 0,
      tabla: screen.queryAllByRole("table").length > 0,
    };

    cleanup();
    vi.unstubAllGlobals();

    servir({ tareas: [tarea("t1", "Recoger la mesa", "PENDING")] });
    montar(<MyTasks />);
    await screen.findByText("Recoger la mesa");
    const tareas = {
      lista: screen.queryAllByRole("list").length > 0,
      tabla: screen.queryAllByRole("table").length > 0,
      // Lo que solo tiene este destino: una acción que cambia el mundo.
      accion: screen.queryAllByRole("button").length > 0,
    };

    cleanup();
    vi.unstubAllGlobals();

    servir({ canjes: [canje("c1", "Helado", 60, "APPROVED", "2026-09-03T10:00:00.000Z")] });
    montar(<MyRedemptions />);
    await screen.findByText("Helado");
    const historial = {
      lista: screen.queryAllByRole("list").length > 0,
      tabla: screen.queryAllByRole("table").length > 0,
      accion: screen.queryAllByRole("button").length > 0,
    };

    // El historial es lo único que se anuncia como tabla.
    expect(historial.tabla).toBe(true);
    expect(escaparate.tabla).toBe(false);
    expect(tareas.tabla).toBe(false);

    // Y es lo único donde no hay nada que hacer.
    expect(historial.accion).toBe(false);
    expect(tareas.accion).toBe(true);

    // Escaparate y tareas siguen siendo listas: la rejilla es una colocación,
    // no otra estructura para quien recorre la pantalla sin verla.
    expect(escaparate.lista).toBe(true);
    expect(tareas.lista).toBe(true);
  });
});

// ---------------------------------------------------------------------------

describe("el historial de canjes", () => {
  /*
   * En el orden en que el SERVIDOR los devuelve: `GET /redemptions/mine` ya
   * ordena por `createdAt desc` con desempate por identificador. Lo que la
   * pantalla tiene que garantizar, entonces, no es ordenar sino NO REORDENAR.
   *
   * Los datos están elegidos para que eso se note: por precio serían 60, 200,
   * 350 y por título Helado, Ir al cine, Patines — los dos distintos del orden
   * correcto. Un `sort` accidental al pasar a tabla, que es el riesgo real de
   * este cambio, da una lista diferente.
   */
  const CANJES = [
    canje("c2", "Ir al cine", 200, "PENDING", "2026-09-03T10:00:00.000Z"),
    canje("c3", "Helado", 60, "APPROVED", "2026-09-02T10:00:00.000Z"),
    canje("c1", "Patines", 350, "REJECTED", "2026-09-01T10:00:00.000Z"),
  ];

  it("da una fila por canje, con premio, cantidad, estado y cuándo", async () => {
    servir({ canjes: CANJES });
    montar(<MyRedemptions />);

    await screen.findByText("Helado");

    for (const columna of [
      messages.redemptions.columnReward,
      messages.redemptions.columnCoins,
      messages.redemptions.columnStatus,
      messages.redemptions.columnWhen,
    ]) {
      expect(screen.getByRole("columnheader", { name: columna })).toBeInTheDocument();
    }

    // Las de datos: la de encabezados también es una `row`.
    expect(screen.getAllByRole("row")).toHaveLength(CANJES.length + 1);
  });

  it("se anuncia como tabla y con nombre", async () => {
    servir({ canjes: CANJES });
    montar(<MyRedemptions />);

    await screen.findByText("Helado");
    expect(
      screen.getByRole("table", { name: messages.redemptions.historyCaption }),
    ).toBeInTheDocument();
  });

  /*
   * Los tres tonos se comparan ENTRE SÍ, no se comprueba que las tres etiquetas
   * están: con el mismo tono en los tres, ese test seguiría en verde.
   *
   * Y rechazado NO puede ser el de peligro: que un padre diga que no a un premio
   * no es un error del niño.
   */
  it("distingue los tres estados entre sí, y el rechazado no es un error", async () => {
    servir({ canjes: CANJES });
    montar(<MyRedemptions />);

    await screen.findByText("Helado");

    /*
     * Se lee la CELDA del estado por su posición y se compara la clase de la
     * insignia que hay dentro. Por su clase y no por su texto, igual que en
     * `child-shop`: comprobar que las tres etiquetas están seguiría en verde
     * con el mismo tono en las tres, que es justo la violación que se persigue.
     */
    const claseDelEstado = (titulo: string): string => {
      const fila = screen.getByText(titulo).closest("tr") as HTMLElement;
      const celda = within(fila).getAllByRole("cell")[2] as HTMLElement;
      return (celda.firstElementChild as HTMLElement).className;
    };

    const tonos = ["Helado", "Ir al cine", "Patines"].map(claseDelEstado);
    expect(new Set(tonos).size).toBe(3);

    // Y el rechazado no comparte tono con ninguno de los otros dos, ni es el
    // que el sistema usa para un error: eso lo fija `child-shop` sobre `Badge`.
    expect(claseDelEstado("Patines")).not.toBe(claseDelEstado("Helado"));
  });

  it("no reordena lo que el servidor ya ordenó del más reciente al más antiguo", async () => {
    servir({ canjes: CANJES });
    montar(<MyRedemptions />);

    await screen.findByText("Helado");

    const filas = screen.getAllByRole("row").slice(1);
    const premios = filas.map((fila) => within(fila).getAllByRole("cell")[0]?.textContent);

    expect(premios).toEqual(["Ir al cine", "Helado", "Patines"]);
  });

  it("sin canjes no dibuja una tabla con encabezados y nada debajo", async () => {
    servir({ canjes: [] });
    montar(<MyRedemptions />);

    expect(await screen.findByText(messages.redemptions.myRedemptionsEmpty)).toBeInTheDocument();
    expect(screen.queryByRole("table")).toBeNull();
  });

  it("ninguna fila ofrece hacer nada", async () => {
    servir({ canjes: CANJES });
    montar(<MyRedemptions />);

    await screen.findByText("Helado");
    expect(screen.queryAllByRole("button")).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------

describe("el escaparate", () => {
  /*
   * Esto fija la ELECCIÓN, no el pintado.
   *
   * jsdom no aplica CSS, así que ningún test puede comprobar que de verdad se
   * ven dos columnas ni que caben a 390px — eso está en las tareas como «abrir
   * la aplicación», y así sigue. Lo que sí evita este test es que alguien
   * devuelva el escaparate a una columna sin enterarse de que era una decisión.
   *
   * Se comprueba que la colocación es en rejilla y de MÁS DE UNA columna, no la
   * utilidad exacta: `grid-cols-2` podría pasar a otra cosa el día que haya una
   * medida mejor, y eso no sería una regresión.
   */
  it("los premios se colocan en rejilla de más de una columna", async () => {
    servir({ premios: [premio("r1", "Helado", 60), premio("r2", "Cine", 200)] });
    montar(<MyRewards />);

    await screen.findByText("Helado");

    const lista = screen.getByRole("list");
    expect(lista.className).toMatch(/(^|\s)grid(\s|$)/);
    expect(lista.className).toMatch(/grid-cols-[2-9]/);
  });

  it("cada premio sigue siendo un elemento de lista con sus partes", async () => {
    servir({ premios: [premio("r1", "Helado", 60), premio("r2", "Cine", 200, "https://x.dev/a.jpg")] });
    montar(<MyRewards />);

    await screen.findByText("Helado");

    expect(screen.getAllByRole("listitem")).toHaveLength(2);

    // El que no tiene foto trae su respaldo, así que la rejilla no sale con
    // huecos — que es lo que `polish-profile-and-reward-image` dejó listo.
    const sinFoto = screen.getByText("Helado").closest("li") as HTMLElement;
    expect(within(sinFoto).getByTestId("reward-image-fallback")).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------

/**
 * Las tres cuentan algo, y no cuentan lo mismo.
 */
describe("cada pantalla dice cuántas cosas hay", () => {
  it("el escaparate cuenta los premios ofrecidos", async () => {
    servir({ premios: [premio("r1", "Helado", 60), premio("r2", "Cine", 200)] });
    montar(<MyRewards />);

    await screen.findByText("Helado");
    expect(screen.getByText(`2 ${messages.rewards.countMany}`)).toBeInTheDocument();
  });

  it("el historial cuenta los canjes, del total del listado", async () => {
    servir({
      canjes: [canje("c1", "Helado", 60, "APPROVED", "2026-09-03T10:00:00.000Z")],
      // El total del servidor, que es lo que se enseña: paginar por fila hace
      // que su `total` SÍ sea la cifra.
      totalCanjes: 7,
    });
    montar(<MyRedemptions />);

    await screen.findByText("Helado");
    expect(screen.getByText(`7 ${messages.redemptions.countMany}`)).toBeInTheDocument();
  });

  /*
   * El caso está elegido para que las tres cuentas posibles den números
   * DISTINTOS: cinco tareas en total, DOS pendientes y tres que no lo están.
   *
   * Con una sola pendiente, «total» daría 5 y «pendientes» 1, pero cualquier
   * otra cuenta equivocada podría dar 1 también. Con dos, los números son 5, 2
   * y 3, y ninguna respuesta equivocada coincide con la correcta.
   */
  it("las tareas cuentan las PENDIENTES, no el total", async () => {
    servir({
      tareas: [
        tarea("t1", "Recoger la mesa", "PENDING"),
        tarea("t2", "Hacer la cama", "PENDING"),
        tarea("t3", "Sacar la basura", "COMPLETED"),
        tarea("t4", "Regar", "APPROVED"),
        tarea("t5", "Barrer", "APPROVED"),
      ],
    });
    montar(<MyTasks />);

    await screen.findByText("Recoger la mesa");

    expect(screen.getByText(`2 ${messages.tasks.pendingCountMany}`)).toBeInTheDocument();
    expect(screen.queryByText(`5 ${messages.tasks.pendingCountMany}`)).toBeNull();
    expect(screen.queryByText(`3 ${messages.tasks.pendingCountMany}`)).toBeNull();
  });

  it("sin ninguna pendiente lo dice, en vez de anunciar un cero", async () => {
    servir({ tareas: [tarea("t1", "Regar", "APPROVED")] });
    montar(<MyTasks />);

    await screen.findByText("Regar");

    expect(screen.getByText(messages.tasks.nothingPending)).toBeInTheDocument();
    expect(screen.queryByText(`0 ${messages.tasks.pendingCountMany}`)).toBeNull();
  });
});
