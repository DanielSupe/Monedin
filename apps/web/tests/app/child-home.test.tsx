import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { messages } from "../../src/lib/messages.js";
import { comoNino, comoPadre, montarApp } from "../support/router.js";

afterEach(() => {
  vi.unstubAllGlobals();
});

/**
 * El inicio, que sirve a los dos roles desde la misma dirección.
 *
 * Elegir por rol es legítimo —el destino es el mismo y quien lo abre no—, pero
 * lo elegido vive fuera del archivo de ruta desde `redesign-child-home`. Estos
 * tests fijan lo que se ve, no dónde está el código; lo segundo lo sostiene el
 * test de estilo, que caza la pantalla nueva en cuanto sale de la deuda.
 */
describe("cada rol ve su propio inicio", () => {
  it("un niño ve el suyo", async () => {
    await montarApp("/", comoNino());

    expect(await screen.findByText(messages.children.homeBalanceLabel)).toBeInTheDocument();
    expect(screen.queryByText(messages.children.title)).toBeNull();
  });

  it("un padre ve el suyo, y no el del niño", async () => {
    await montarApp("/", comoPadre());

    /*
     * La marca del inicio del padre es su PANEL, no un enlace al listado de
     * perfiles. Hasta `redesign-parent-home` esta línea buscaba
     * `messages.children.title` porque el inicio del padre era exactamente la
     * lista de destinos de su propia barra; ahora esa lista ya no está y lo que
     * lo identifica es lo que le espera.
     */
    expect(await screen.findByText(messages.parents.pendingTitle)).toBeInTheDocument();
    expect(screen.queryByText(messages.children.homeBalanceLabel)).toBeNull();
  });
});

/**
 * El saldo es lo que el producto entero existe para enseñar.
 *
 * Antes salía en negrita dentro de una frase, al mismo tamaño que los enlaces
 * de al lado, y la escala del niño lleva `--text-hero` en 4rem precisamente
 * para esto.
 */
describe("el saldo del niño", () => {
  it("se anuncia con su unidad y no como un número suelto", async () => {
    await montarApp("/", comoNino());

    // `comoNino()` da 120 monedas. Lo que se comprueba es que lo dibuja `Coins`
    // —que anuncia «120 monedas»— y no un `<strong>` dentro de un párrafo.
    expect(await screen.findByLabelText(/120\s+monedas/)).toBeInTheDocument();
  });

  it("va dentro de la escala del niño", async () => {
    await montarApp("/", comoNino());

    await screen.findByText(messages.children.homeBalanceLabel);
    expect(document.querySelector('[data-scale="child"]')).not.toBeNull();
  });
});

describe("los destinos del niño", () => {
  const DESTINOS = [
    [messages.tasks.myTasksTitle, "/me/tasks"],
    [messages.rewards.myRewardsTitle, "/me/rewards"],
    [messages.redemptions.myRedemptionsTitle, "/me/redemptions"],
    [messages.children.myProfileTitle, "/me/settings"],
  ] as const;

  /*
   * Acotado a `main`: el avatar de la cabecera del marco también lleva a «Mi
   * perfil» y con el mismo nombre, así que sin acotar hay dos enlaces iguales.
   * No es un defecto —son el mismo destino— pero lo que se prueba aquí es la
   * pantalla, no el marco.
   */
  it.each(DESTINOS)("«%s» lleva a %s", async (nombre, destino) => {
    const user = userEvent.setup();
    const app = await montarApp("/", comoNino());

    const pantalla = within(await screen.findByRole("main"));
    await user.click(pantalla.getByRole("link", { name: nombre }));

    expect(app.direccion()).toBe(destino);
  });

  /*
   * Un enlace subrayado de una línea es un objetivo de la altura de una letra,
   * y quien usa esta pantalla tiene entre seis y once años. Cada acceso es UNA
   * sola cosa interactiva, como las teselas de la rejilla de perfiles.
   */
  it("cada acceso es una sola cosa interactiva", async () => {
    await montarApp("/", comoNino());

    const pantalla = within(await screen.findByRole("main"));

    for (const [nombre] of DESTINOS) {
      const tarjeta = pantalla.getByRole("link", { name: nombre });

      expect(within(tarjeta).queryByRole("link")).toBeNull();
      expect(within(tarjeta).queryByRole("button")).toBeNull();
    }
  });
});
