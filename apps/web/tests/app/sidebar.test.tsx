import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { messages } from "../../src/lib/messages.js";
import { SOLO_CUENTA, comoNino, comoPadre, montarApp, pagina } from "../support/router.js";
import { conPantallaAncha } from "../setup.js";

afterEach(() => {
  vi.unstubAllGlobals();
});

async function abrirCajon(): Promise<HTMLElement> {
  await userEvent.click(screen.getByRole("button", { name: messages.nav.menu }));

  return screen.getByRole("navigation", { name: messages.nav.drawerLabel });
}

const DEL_PADRE = [
  messages.nav.parentHome,
  messages.nav.parentTasks,
  messages.nav.parentRewards,
  messages.nav.parentRedemptions,
  messages.nav.parentChildren,
];

const DEL_NINO = [
  messages.nav.childHome,
  messages.nav.childTasks,
  messages.nav.childRewards,
  messages.nav.childRedemptions,
];

describe("dentro de un perfil hay una sola navegación, y está entera", () => {
  it("el padre tiene sus cinco destinos dentro del cajón", async () => {
    await montarApp("/", comoPadre());
    const cajon = await abrirCajon();

    for (const destino of DEL_PADRE) {
      expect(within(cajon).getByRole("link", { name: destino })).toBeInTheDocument();
    }

    expect(screen.getByRole("link", { name: new RegExp(messages.nav.parentAccount) })).toBeInTheDocument();
  });

  it("el niño tiene sus cuatro destinos y su perfil dentro del cajón", async () => {
    await montarApp("/", comoNino());
    const cajon = await abrirCajon();

    for (const destino of DEL_NINO) {
      expect(within(cajon).getByRole("link", { name: destino })).toBeInTheDocument();
    }

    expect(
      screen.getByRole("link", { name: new RegExp(messages.children.myProfileTitle) }),
    ).toBeInTheDocument();
  });

  it("ningún destino se ofrece DOS veces, salvo el perfil", async () => {
    await montarApp("/", comoPadre());
    await abrirCajon();

    for (const destino of DEL_PADRE) {
      expect(screen.getAllByRole("link", { name: destino })).toHaveLength(1);
    }
  });

  it("el perfil SÍ está dos veces, y es la única excepción", async () => {
    conPantallaAncha();
    await montarApp("/", comoPadre());

    expect(
      screen.getAllByRole("link", { name: new RegExp(messages.nav.parentAccount) }),
    ).toHaveLength(2);

    for (const destino of DEL_PADRE) {
      expect(screen.getAllByRole("link", { name: destino })).toHaveLength(1);
    }
  });

  it("sin el cajón abierto no hay destinos sueltos por el marco", async () => {
    await montarApp("/", comoNino());

    for (const destino of DEL_NINO.slice(1)) {
      expect(screen.queryByRole("link", { name: destino })).toBeNull();
    }
  });
});

describe("la ayuda se encuentra, y está una sola vez", () => {
  it.each([
    ["el padre", comoPadre],
    ["el niño", comoNino],
  ])("%s la tiene al pie de su lateral, con su nombre escrito", async (_quien, sesion) => {
    conPantallaAncha();
    await montarApp("/", sesion());

    const ayuda = await screen.findByRole("link", { name: messages.help.title });

    expect(ayuda).toHaveAttribute("href", "/help");

    expect(within(ayuda).getByText(messages.help.title)).toBeInTheDocument();
  });

  it("y no está además en la cabecera", async () => {
    conPantallaAncha();
    await montarApp("/", comoPadre());

    expect(screen.getAllByRole("link", { name: messages.help.title })).toHaveLength(1);
  });
});

describe("el destino vigente se anuncia", () => {
  it("el que corresponde a la dirección es la página actual, y los demás no", async () => {
    await montarApp("/me/tasks", comoNino());
    const cajon = await abrirCajon();

    expect(within(cajon).getByRole("link", { name: messages.nav.childTasks })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(
      within(cajon).getByRole("link", { name: messages.nav.childRewards }),
    ).not.toHaveAttribute("aria-current");
  });

  it("el inicio solo es el vigente cuando se está en él", async () => {
    await montarApp("/me/rewards", comoNino());
    const cajon = await abrirCajon();

    expect(within(cajon).getByRole("link", { name: messages.nav.childHome })).not.toHaveAttribute(
      "aria-current",
    );
  });
});

describe("el cajón se cierra al llegar", () => {
  it("al elegir un destino", async () => {
    await montarApp("/", comoNino());
    const cajon = await abrirCajon();

    await userEvent.click(within(cajon).getByRole("link", { name: messages.nav.childTasks }));

    expect(screen.queryByRole("navigation", { name: messages.nav.drawerLabel })).toBeNull();
  });

  it("y al volver atrás", async () => {
    const app = await montarApp("/", comoNino());

    await app.router.navigate({ to: "/me/tasks" });
    await app.router.invalidate();

    await abrirCajon();

    app.router.history.back();
    await app.router.invalidate();

    await waitFor(() =>
      expect(screen.queryByRole("navigation", { name: messages.nav.drawerLabel })).toBeNull(),
    );
  });
});

describe("antes de tener un perfil no hay navegación", () => {
  it("la rejilla no ofrece ni el botón de menú", async () => {
    await montarApp("/profiles", SOLO_CUENTA);

    expect(screen.queryByRole("button", { name: messages.nav.menu })).toBeNull();
  });
});

describe("cuando hay ancho, la navegación está delante", () => {
  it("los destinos se ven sin abrir nada, y no hay botón de menú", async () => {
    conPantallaAncha();
    await montarApp("/", comoPadre());

    const cajon = screen.getByRole("navigation", { name: messages.nav.drawerLabel });

    for (const destino of DEL_PADRE) {
      expect(within(cajon).getByRole("link", { name: destino })).toBeInTheDocument();
    }

    expect(screen.queryByRole("button", { name: messages.nav.menu })).toBeNull();
  });

  it("en estrecho sigue detrás de su botón", async () => {
    await montarApp("/", comoPadre());

    expect(screen.queryByRole("navigation", { name: messages.nav.drawerLabel })).toBeNull();
    expect(screen.getByRole("button", { name: messages.nav.menu })).toBeInTheDocument();
  });

  it.each([
    ["ancho", true],
    ["estrecho", false],
  ])("en %s existe exactamente UNA lista de destinos", async (_modo, ancho) => {
    if (ancho) conPantallaAncha();
    await montarApp("/", comoPadre());

    if (!ancho) {
      await abrirCajon();
    }

    expect(screen.getAllByRole("navigation", { name: messages.nav.drawerLabel })).toHaveLength(1);
  });
});

describe("contraído, los destinos conservan su nombre", () => {
  it("siguen alcanzables por su nombre tras contraer", async () => {
    conPantallaAncha();
    await montarApp("/", comoPadre());

    await userEvent.click(screen.getByRole("button", { name: messages.nav.collapseSidebar }));

    const cajon = screen.getByRole("navigation", { name: messages.nav.drawerLabel });

    for (const destino of DEL_PADRE) {
      expect(within(cajon).getByRole("link", { name: destino })).toBeInTheDocument();
    }
  });

  it("el botón dice lo que va a hacer, y cambia al pulsarlo", async () => {
    conPantallaAncha();
    await montarApp("/", comoPadre());

    const contraer = screen.getByRole("button", { name: messages.nav.collapseSidebar });
    expect(contraer).toHaveAttribute("aria-expanded", "true");

    await userEvent.click(contraer);

    const expandir = screen.getByRole("button", { name: messages.nav.expandSidebar });
    expect(expandir).toHaveAttribute("aria-expanded", "false");
  });
});

describe("el lateral dice cuánto espera en cada bandeja", () => {
  function tarea(id: string, status: "PENDING" | "COMPLETED") {
    return {
      id,
      title: "Recoger la mesa",
      description: null,
      coins: 20,
      dueDate: null,
      status,
      evidence: null,
      createdAt: "2026-09-01T10:00:00.000Z",
      updatedAt: "2026-09-01T10:00:00.000Z",
      child: { id: `hijo-${id}`, name: "Ana", avatar: "zorro" },
      batchId: "b1",
    };
  }

  const REPARTO_MEZCLADO = {
    batchId: "b1",
    title: "Recoger la mesa",
    description: null,
    dueDate: null,
    createdAt: "2026-09-01T10:00:00.000Z",
    tasks: [tarea("t1", "COMPLETED"), tarea("t2", "COMPLETED"), tarea("t3", "PENDING")],
  };

  function destino(cajon: HTMLElement, nombre: string): HTMLElement {
    return within(cajon).getByRole("link", { name: new RegExp(nombre) });
  }

  it("las tareas por aprobar se cuentan por FILA y no por reparto", async () => {
    await montarApp("/", comoPadre(), [], {
      "/tasks": pagina([REPARTO_MEZCLADO]),
      "/redemptions": pagina([]),
    });

    const cajon = await abrirCajon();
    const tareas = destino(cajon, messages.nav.parentTasks);

    await waitFor(() => {
      expect(within(tareas).getByText("2")).toBeInTheDocument();
    });

    expect(within(tareas).queryByText("1")).toBeNull();
    expect(within(tareas).queryByText("3")).toBeNull();
  });

  it("y sin nada esperando no dibuja ninguna insignia", async () => {
    await montarApp("/", comoPadre(), [], {
      "/tasks": pagina([]),
      "/redemptions": pagina([]),
    });

    const cajon = await abrirCajon();

    await waitFor(() => {
      expect(within(cajon).queryByText("0")).toBeNull();
    });
  });

  it("la cifra se anuncia con su unidad", async () => {
    await montarApp("/", comoPadre(), [], {
      "/tasks": pagina([REPARTO_MEZCLADO]),
      "/redemptions": pagina([]),
    });

    const cajon = await abrirCajon();

    await waitFor(() => {
      expect(
        within(destino(cajon, messages.nav.parentTasks)).getByText(
          `2 ${messages.nav.pendingSuffix}`,
        ),
      ).toBeInTheDocument();
    });
  });
});

describe("contraída, la navegación cabe en su columna", () => {
  const CON_COSAS_ESPERANDO = {
    "/tasks": pagina([
      {
        batchId: "b1",
        title: "Recoger la mesa",
        description: null,
        dueDate: null,
        createdAt: "2026-09-01T10:00:00.000Z",
        tasks: [
          {
            id: "t1",
            title: "Recoger la mesa",
            description: null,
            coins: 20,
            dueDate: null,
            status: "COMPLETED" as const,
            evidence: null,
            createdAt: "2026-09-01T10:00:00.000Z",
            updatedAt: "2026-09-01T10:00:00.000Z",
            child: { id: "hijo-1", name: "Ana", avatar: "zorro" },
            batchId: "b1",
          },
        ],
      },
    ]),
    "/redemptions": pagina([]),
  };

  async function destinoDeTareas(): Promise<HTMLElement> {
    const cajon = screen.getByRole("navigation", { name: messages.nav.drawerLabel });
    const tareas = within(cajon).getByRole("link", {
      name: new RegExp(messages.nav.parentTasks),
    });

    await waitFor(() => {
      expect(within(tareas).getByText(`1 ${messages.nav.pendingSuffix}`)).toBeInTheDocument();
    });

    return tareas;
  }

  it("extendida, la cifra se ve junto a su destino", async () => {
    conPantallaAncha();
    await montarApp("/", comoPadre(), [], CON_COSAS_ESPERANDO);

    expect(within(await destinoDeTareas()).getByText("1")).toBeInTheDocument();
  });

  it("contraída, la cifra no se dibuja y la cuenta sigue anunciándose", async () => {
    conPantallaAncha();
    await montarApp("/", comoPadre(), [], CON_COSAS_ESPERANDO);

    await destinoDeTareas();
    await userEvent.click(screen.getByRole("button", { name: messages.nav.collapseSidebar }));

    const tareas = await destinoDeTareas();

    expect(within(tareas).queryByText("1")).toBeNull();
    expect(within(tareas).getByText(`1 ${messages.nav.pendingSuffix}`)).toBeInTheDocument();
  });

  it("contraída, la fila del perfil se queda con su avatar", async () => {
    conPantallaAncha();
    await montarApp("/", comoPadre());

    const columna = () => within(screen.getByRole("complementary"));

    expect(
      columna()
        .getByRole("link", { name: new RegExp(messages.nav.parentAccount) })
        .querySelectorAll("svg"),
    ).toHaveLength(2);

    await userEvent.click(screen.getByRole("button", { name: messages.nav.collapseSidebar }));

    expect(
      columna()
        .getByRole("link", { name: new RegExp(messages.nav.parentAccount) })
        .querySelectorAll("svg"),
    ).toHaveLength(1);
  });
});

describe("el control de contraer encabeza la navegación", () => {
  it("se alcanza antes que el primer destino", async () => {
    conPantallaAncha();
    await montarApp("/", comoPadre());

    const contraer = screen.getByRole("button", { name: messages.nav.collapseSidebar });
    const cajon = screen.getByRole("navigation", { name: messages.nav.drawerLabel });
    const primero = within(cajon).getByRole("link", { name: messages.nav.parentHome });

    expect(contraer.compareDocumentPosition(primero) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("en pantalla estrecha no existe", async () => {
    await montarApp("/", comoPadre());
    await abrirCajon();

    expect(screen.queryByRole("button", { name: messages.nav.collapseSidebar })).toBeNull();
    expect(screen.queryByRole("button", { name: messages.nav.expandSidebar })).toBeNull();
  });
});
