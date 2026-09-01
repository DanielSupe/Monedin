import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { messages } from "../../src/lib/messages.js";
import { SOLO_CUENTA, comoNino, comoPadre, montarApp } from "../support/router.js";

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

  it("ningún destino se ofrece DOS veces en el marco", async () => {
    await montarApp("/", comoPadre());
    await abrirCajon();

    // Con la barra vieja todavía puesta, cada uno de estos saldría dos veces.
    // Es lo que impide que vuelvan las dos navegaciones.
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
