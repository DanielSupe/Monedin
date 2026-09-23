import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { messages } from "../../src/lib/messages.js";
import { SOLO_CUENTA, comoNino, comoPadre, montarApp, pagina } from "../support/router.js";
import { conPantallaAncha } from "../setup.js";

afterEach(() => {
  vi.unstubAllGlobals();
});

/** Abre el cajón y devuelve su navegación. */
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

/**
 * Lo que este change existe para arreglar.
 *
 * Cada rol tenía su propia barra —arriba el padre, abajo el niño— y en los dos
 * casos un destino que NO estaba en ella y colgaba del avatar de la cabecera.
 * Dos maneras de moverse y ninguna completa.
 */
describe("dentro de un perfil hay una sola navegación, y está entera", () => {
  it("el padre tiene sus cinco destinos dentro del cajón", async () => {
    await montarApp("/", comoPadre());
    const cajon = await abrirCajon();

    for (const destino of DEL_PADRE) {
      expect(within(cajon).getByRole("link", { name: destino })).toBeInTheDocument();
    }

    // Y su cuenta, que antes solo se encontraba pulsando el avatar.
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

    // Con la barra vieja todavía puesta, cada uno de estos saldría dos veces.
    // Es lo que impide que vuelvan las dos navegaciones.
    for (const destino of DEL_PADRE) {
      expect(screen.getAllByRole("link", { name: destino })).toHaveLength(1);
    }

  });

  /*
   * La excepción se comprueba en ANCHO y no en estrecho, y la razón es buena:
   * con el cajón abierto, Radix marca el resto del documento como oculto para
   * las tecnologías de asistencia, así que el avatar de la cabecera NO está en
   * el árbol de accesibilidad. Los dos caminos al perfil solo coexisten cuando
   * la columna está fija, que es justo donde la excepción importa.
   */
  it("el perfil SÍ está dos veces, y es la única excepción", async () => {
    conPantallaAncha();
    await montarApp("/", comoPadre());

    // Por su NOMBRE y con cifra exacta, no tapándolo: así la excepción es una y
    // no una puerta abierta. Un tercer camino al perfil hace fallar esto.
    expect(
      screen.getAllByRole("link", { name: new RegExp(messages.nav.parentAccount) }),
    ).toHaveLength(2);

    // Y ningún otro destino la aprovecha.
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

/**
 * LA AYUDA TENÍA NOMBRE PARA QUIEN NO VE LA PANTALLA Y NO PARA QUIEN LA MIRA.
 *
 * Era un interrogante en la cabecera, con su nombre en `aria-label` — y la
 * cabecera de la pieza afirmaba, palabra por palabra, que «lleva nombre y no
 * solo un símbolo». Por eso este test busca por ROL Y NOMBRE dentro del
 * lateral: con el interrogante mudo de antes, `getByRole("link", { name })`
 * también lo encontraba, así que no distinguía nada. Lo que lo distingue es
 * pedir además que su nombre ESTÉ EN LA PANTALLA.
 *
 * Y se comprueba que sigue siendo UNO: el arreglo es moverla, no añadirla, y
 * dejarla en los dos sitios sería un segundo destino duplicado cuando la única
 * excepción declarada es el perfil.
 */
describe("la ayuda se encuentra, y está una sola vez", () => {
  it.each([
    ["el padre", comoPadre],
    ["el niño", comoNino],
  ])("%s la tiene al pie de su lateral, con su nombre escrito", async (_quien, sesion) => {
    conPantallaAncha();
    await montarApp("/", sesion());

    const ayuda = await screen.findByRole("link", { name: messages.help.title });

    expect(ayuda).toHaveAttribute("href", "/help");
    // Su nombre, a la vista y dentro del enlace: es lo que el interrogante mudo
    // no tenía y lo único que este caso no pasaría con el defecto puesto.
    expect(within(ayuda).getByText(messages.help.title)).toBeInTheDocument();
  });

  it("y no está además en la cabecera", async () => {
    conPantallaAncha();
    await montarApp("/", comoPadre());

    expect(screen.getAllByRole("link", { name: messages.help.title })).toHaveLength(1);
  });
});

/**
 * Quién anuncia el destino vigente, y contra qué protege esto.
 *
 * Lo pone el `Link` del router: `aria-current="page"` y `data-status="active"`,
 * según su `activeOptions`. La primera versión de este archivo lo ponía ADEMÁS
 * a mano, calculando la ruta activa por su cuenta — dos fuentes para el mismo
 * hecho, y la de fuera podía separarse de la del router sin que nada fallara.
 *
 * Se descubrió inyectando la violación: al quitar el `aria-current` escrito a
 * mano, el test SEGUÍA EN VERDE, porque quien lo ponía de verdad era el enlace.
 * La violación que este test sí caza es la que importa: sustituir el `Link` por
 * un `<a>` a mano. Comprobado — con anclas sueltas, cae.
 */
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

    // Sin coincidencia exacta, `/` prefija a todo y el inicio saldría siempre
    // marcado.
    expect(within(cajon).getByRole("link", { name: messages.nav.childHome })).not.toHaveAttribute(
      "aria-current",
    );
  });
});

/**
 * El fallo más probable de esta pieza.
 *
 * Se cierra al cambiar la DIRECCIÓN y no en el `onClick` de cada enlace, porque
 * el botón atrás también cambia la dirección: un panel abierto tapando la
 * pantalla a la que se acaba de volver es peor que no tenerlo.
 */
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

    // `waitFor` y no una comprobación seca: el cierre es un efecto sobre el
    // cambio de dirección, así que ocurre en el render siguiente.
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

/**
 * Lo que `pin-sidebar-on-desktop` corrige.
 *
 * `add-sidebar-nav` dejó la navegación detrás de un botón en TODOS los tamaños y
 * lo declaró como consecuencia aceptada. Al verlo no lo era: en escritorio
 * sobra ancho, y esconderla cuesta un toque cada vez sin comprar nada.
 */
describe("cuando hay ancho, la navegación está delante", () => {
  it("los destinos se ven sin abrir nada, y no hay botón de menú", async () => {
    conPantallaAncha();
    await montarApp("/", comoPadre());

    const cajon = screen.getByRole("navigation", { name: messages.nav.drawerLabel });

    for (const destino of DEL_PADRE) {
      expect(within(cajon).getByRole("link", { name: destino })).toBeInTheDocument();
    }

    // El botón y la forma estrecha van juntos: con la columna delante no tiene
    // qué abrir.
    expect(screen.queryByRole("button", { name: messages.nav.menu })).toBeNull();
  });

  it("en estrecho sigue detrás de su botón", async () => {
    await montarApp("/", comoPadre());

    expect(screen.queryByRole("navigation", { name: messages.nav.drawerLabel })).toBeNull();
    expect(screen.getByRole("button", { name: messages.nav.menu })).toBeInTheDocument();
  });

  /*
   * La regla que obliga a montar UNA forma y no las dos con una escondida por
   * CSS. Dos listas de destinos son dos para quien recorre el documento con
   * teclado, aunque una no se vea — y `display:none` dejaría la garantía
   * dependiendo de una utilidad que nadie comprueba.
   */
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

    /*
     * El texto se oculta A LA VISTA y no se borra. Estos iconos son decorativos
     * a propósito —lo que nombra al destino es su texto—, así que borrarlo
     * dejaría los cinco destinos sin nombre de golpe para quien usa un lector de
     * pantalla.
     *
     * LÍMITE de este test, dicho para que nadie le pida más de lo que da: en
     * jsdom no hay CSS, así que no puede distinguir `sr-only` de `hidden`. Lo
     * que caza es que el texto se BORRE del documento — comprobado inyectando
     * esa violación exacta, y cae. Que `sr-only` oculte a la vista y `hidden` no
     * sirva hay que verlo en el navegador.
     */
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

    // Solo dibuja una flecha, así que sin nombre no diría nada.
    const expandir = screen.getByRole("button", { name: messages.nav.expandSidebar });
    expect(expandir).toHaveAttribute("aria-expanded", "false");
  });
});

// ---------------------------------------------------------------------------

/**
 * LA INSIGNIA CUENTA FILAS, NO REPARTOS.
 *
 * `GET /tasks?status=COMPLETED` pagina por REPARTO y devuelve el reparto ENTERO,
 * así que las dos cuentas obvias dan números equivocados en direcciones
 * opuestas. El caso está elegido para que las tres den cifras DISTINTAS:
 *
 *   un reparto: Ana (COMPLETED), Luis (COMPLETED), Sara (PENDING)
 *
 *     total (repartos)            → 1
 *     items.flatMap(b => b.tasks) → 3
 *     filas en COMPLETED          → 2  ✓
 *
 * Con UNA sola completada las tres darían 1 y el test pasaría con la cuenta
 * equivocada puesta. Es el error que `redesign-parent-home` costó aprender, y
 * por eso el caso lleva dos.
 */
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

  /** El destino del lateral que lleva ese nombre. */
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

    // Ni el total de repartos ni el total de filas.
    expect(within(tareas).queryByText("1")).toBeNull();
    expect(within(tareas).queryByText("3")).toBeNull();
  });

  /*
   * CON CERO NO SE DIBUJA, por lo mismo que en el panel: leer un cero para
   * concluir lo que la ausencia ya dice es trabajo que el lateral existe para
   * ahorrar, y una insignia permanente deja de significar nada.
   */
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

  /*
   * La cifra sola diría «Tareas 3» a quien no ve la pantalla, que no dice tres
   * de qué. La unidad va aparte y solo para ellos: verla escrita al lado del
   * número la diría dos veces.
   */
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

// ---------------------------------------------------------------------------

/**
 * CONTRAÍDA, LA COLUMNA MIDE 71 px Y TIENE QUE CABER TODO DENTRO.
 *
 * Lo reportó una captura: la cifra de la insignia se salía por el borde y, de
 * paso, descentraba su icono — y el culpable no era el tamaño sino `ml-auto`, que
 * reparte el sobrante y GANA a `justify-content`. La fila del perfil tenía el
 * mismo problema con dos glifos, el avatar y el del destino, pegados en 47 px.
 *
 * Lo que se quita se quita DEL DOCUMENTO y no con CSS, y por eso estos tests
 * pueden existir: jsdom no aplica hojas de estilo, así que un `hidden` de Tailwind
 * le parecería visible. Es el mismo argumento por el que el marco monta UNA de las
 * dos formas de la navegación en vez de esconder una.
 */
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

  /** El destino de las tareas, con su insignia ya pintada. */
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

  /*
   * Las DOS mitades, y hacen falta las dos: quitar la insignia entera pasaría la
   * primera y fallaría la segunda, que es justo el atajo que había que impedir.
   * El número se va; el aviso y el dato, no.
   */
  it("contraída, la cifra no se dibuja y la cuenta sigue anunciándose", async () => {
    conPantallaAncha();
    await montarApp("/", comoPadre(), [], CON_COSAS_ESPERANDO);

    await destinoDeTareas();
    await userEvent.click(screen.getByRole("button", { name: messages.nav.collapseSidebar }));

    const tareas = await destinoDeTareas();

    expect(within(tareas).queryByText("1")).toBeNull();
    expect(within(tareas).getByText(`1 ${messages.nav.pendingSuffix}`)).toBeInTheDocument();
  });

  /*
   * Se cuentan los DIBUJOS y no se busca uno por su nombre, porque el glifo del
   * destino es decorativo y no tiene: extendida son dos —la cara y él—, contraída
   * queda la cara sola.
   */
  it("contraída, la fila del perfil se queda con su avatar", async () => {
    conPantallaAncha();
    await montarApp("/", comoPadre());

    /*
     * DENTRO DE LA COLUMNA, no por el documento entero: el avatar de la cabecera
     * lleva al mismo sitio y con el mismo nombre. Es la única excepción declarada
     * a «ningún destino dos veces», y aquí hay que mirar el de la columna.
     */
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

/**
 * EL CONTROL DE CONTRAER ENCABEZA LA COLUMNA.
 *
 * Estaba al final del pie, debajo del perfil: el último sitio donde se busca el
 * control que gobierna la columna, y la última parada de quien la recorre con
 * teclado. Se comprueba por el ORDEN DEL DOCUMENTO y no por una clase, que es lo
 * que de verdad decide en qué orden se alcanzan las cosas.
 */
describe("el control de contraer encabeza la navegación", () => {
  it("se alcanza antes que el primer destino", async () => {
    conPantallaAncha();
    await montarApp("/", comoPadre());

    const contraer = screen.getByRole("button", { name: messages.nav.collapseSidebar });
    const cajon = screen.getByRole("navigation", { name: messages.nav.drawerLabel });
    const primero = within(cajon).getByRole("link", { name: messages.nav.parentHome });

    // `DOCUMENT_POSITION_FOLLOWING`: el primer destino viene DESPUÉS del control.
    expect(contraer.compareDocumentPosition(primero) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("en pantalla estrecha no existe", async () => {
    await montarApp("/", comoPadre());
    await abrirCajon();

    expect(screen.queryByRole("button", { name: messages.nav.collapseSidebar })).toBeNull();
    expect(screen.queryByRole("button", { name: messages.nav.expandSidebar })).toBeNull();
  });
});
