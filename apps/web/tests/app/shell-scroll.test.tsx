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

function contenido(): HTMLElement {
  return screen.getByRole("main");
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
    expect(contenido().className).toContain("overflow-y-auto");
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
    expect(contenido().className).not.toContain("overflow-y-auto");
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
