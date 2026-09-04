import { screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { conPantallaAncha } from "../setup.js";
import { comoNino, comoPadre, montarApp } from "../support/router.js";

afterEach(() => {
  vi.unstubAllGlobals();
});

/**
 * El marco de la pantalla: el contenedor con la escala declarada.
 *
 * Se busca por `data-scale`, que es lo que el marco pone y ninguna otra cosa
 * del árbol. Ver la regla de la doble escala.
 */
function marco(): HTMLElement {
  return document.querySelector("[data-scale]") as HTMLElement;
}

/**
 * El envoltorio que desplaza, que es el PADRE del `<main>`.
 *
 * No es el `<main>`: aquello lleva `mx-auto max-w-wide`, así que su barra salía
 * en el borde del ancho máximo y no en el de la ventana. El envoltorio ocupa el
 * ancho entero y el `<main>` conserva su tope dentro.
 */
function envoltorio(): HTMLElement {
  return screen.getByRole("main").parentElement as HTMLElement;
}

/**
 * Lo que este change existe para arreglar.
 *
 * El marco era `min-h-dvh` —altura MÍNIMA— y quien desplazaba era el documento,
 * así que el `<aside>` sin altura propia se estiraba hasta la altura de la fila:
 * la de la página entera. Su pie acababa al final del DOCUMENTO y no de la
 * pantalla, y desaparecía al leer cualquier listado largo.
 *
 * Lo que se comprueba es la ELECCIÓN, no el pintado: jsdom no aplica CSS y no
 * desplaza nada. Que el perfil no se mueva de verdad al desplazar está escrito
 * como tarea de abrir la aplicación.
 */
describe("con la columna delante, lo que se desplaza es el contenido", () => {
  it.each([
    ["el padre", comoPadre()],
    ["el niño", comoNino()],
  ])("%s: el marco se ata a la ventana y el contenido desplaza", async (_quien, sesion) => {
    conPantallaAncha();
    await montarApp("/", sesion);

    expect(marco().className).toContain("h-dvh");
    expect(marco().className).toContain("overflow-hidden");
    expect(envoltorio().className).toContain("overflow-y-auto");

    // Y el tope del contenido NO se pierde por mover la barra de sitio: son dos
    // cosas distintas y las dos tienen que seguir siendo ciertas.
    expect(screen.getByRole("main").className).toContain("max-w-wide");
  });
});

/**
 * La otra mitad, y es la que evita la regresión que rompería el móvil.
 *
 * `100dvh` con desplazamiento interior pelea con la barra del navegador de un
 * móvil, que aparece y desaparece al desplazar. En estrecho el documento tiene
 * que seguir desplazándose.
 */
describe("en estrecho no cambia nada", () => {
  it.each([
    ["el padre", comoPadre()],
    ["el niño", comoNino()],
  ])("%s: el marco no se ata y el contenido no desplaza", async (_quien, sesion) => {
    await montarApp("/", sesion);

    expect(marco().className).toContain("min-h-dvh");
    expect(marco().className).not.toContain("overflow-hidden");
    expect(envoltorio().className).not.toContain("overflow-y-auto");
  });
});

/**
 * Los dos ejes del desbordamiento viven en el MISMO sitio.
 *
 * Es lo que costó dos intentos y una captura de pantalla. El `<main>` llevaba
 * `overflow-x-auto` y se movió solo el `overflow-y` al envoltorio: no cambió
 * nada, porque cuando un eje es `auto` y el otro `visible`, CSS obliga a que
 * `visible` compute a `auto`. El `<main>` seguía siendo contenedor de scroll
 * vertical y pintaba la barra en SU borde — el del ancho máximo, no el de la
 * ventana.
 *
 * jsdom no calcula estilos, así que esto no se puede comprobar mirando el
 * resultado: se comprueba que los dos ejes están declarados en el mismo
 * elemento, que es la condición que hay que mantener.
 */
describe("los dos ejes del desbordamiento van juntos", () => {
  it.each([
    ["el padre", comoPadre()],
    ["el niño", comoNino()],
  ])("%s: el <main> no declara ningún desbordamiento", async (_quien, sesion) => {
    conPantallaAncha();
    await montarApp("/", sesion);

    // Basta un `overflow-x` aquí para que el `<main>` vuelva a quedarse la barra
    // vertical, aunque nadie haya escrito `overflow-y`.
    expect(screen.getByRole("main").className).not.toMatch(/overflow-/);
    expect(envoltorio().className).toMatch(/overflow-x-auto/);
  });
});

/*
 * NO hace falta un tercer test que compare los dos casos en el mismo cuerpo.
 *
 * Se escribió y se quitó: `conPantallaAncha()` fija una bandera que solo se
 * limpia entre tests, así que los dos montajes salían anchos. Pero al mirarlo,
 * tampoco añadía nada — los dos `describe` de arriba ya se contradicen a
 * propósito, y esa es la comparación.
 *
 * La regresión que importa es atar la altura SIEMPRE, que rompería el móvil. Con
 * `h-dvh overflow-hidden` fijo, el caso estrecho falla en las tres líneas: no
 * encuentra `min-h-dvh`, sí encuentra `overflow-hidden` y sí encuentra
 * `overflow-y-auto`. Cada uno afirma lo que el otro niega, que es la forma de
 * comparar cuando los dos casos no caben en un mismo montaje.
 */
