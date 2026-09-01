import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { messages } from "../../src/lib/messages.js";
import { SOLO_CUENTA, comoNino, comoPadre, montarApp } from "../support/router.js";
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
