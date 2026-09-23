import type { SelectableProfile } from "@monedin/contracts";
import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { messages } from "../../src/lib/messages.js";
import { SOLO_CUENTA, montarApp } from "../support/router.js";

/**
 * La cara de un perfil cabe dentro de su tesela CON AIRE.
 *
 * Esto no se puede medir: jsdom no aplica CSS y no hay cajas que leer. Lo que sí
 * se puede comprobar es la DECLARACIÓN — que el escalón de ancho de la tesela sea
 * mayor que el de la cara que lleva dentro—, que es la misma forma que «los dos
 * ejes de `overflow` están declarados en el mismo sitio»: cuando el resultado no
 * se puede medir, se fija la elección.
 *
 * Distingue de verdad. Con las dos medidas iguales —que es como estaba: tesela de
 * 144 y cara de 144— este test falla; y era el estado en el que la cara llegaba al
 * borde, lo pisaba por dentro y sacaba fuera la corona del adulto.
 *
 * Lo que NO prueba, y queda como tarea manual: que la tarjeta se vea equilibrada y
 * que a 390 px sigan entrando dos columnas.
 */

const PERFILES: SelectableProfile[] = [
  { id: "parent", familyRole: "PARENT", name: "Lucía", avatar: "nutria", locked: false },
  { id: "hijo-1", familyRole: "CHILD", name: "Mateo", avatar: "zorro", locked: false },
];

/**
 * El escalón que declara una utilidad de Tailwind, por su prefijo.
 *
 * Lee del ATRIBUTO y no de una lista escrita aquí: si mañana la tesela cambia de
 * medida, este test sigue comprobando la relación entre las dos y no un número.
 */
function escalon(elemento: Element, prefijo: string): number {
  const clases = elemento.getAttribute("class") ?? "";
  // Por TOKEN y no con una expresión regular sobre la cadena entera: `w-36` y
  // `max-w-36` acaban igual, y una expresión que no ancle el principio los
  // confunde. Partir por espacios es lo que el navegador hace con este atributo.
  const utilidad = clases.split(/\s+/).find((clase) => clase.startsWith(`${prefijo}-`));

  expect(utilidad, `no se declara ${prefijo}-* en «${clases}»`).toBeDefined();

  return Number(utilidad?.slice(prefijo.length + 1));
}

/** La cara de una tesela: el dibujo del catálogo o la foto propia. */
function caraDe(tesela: HTMLElement): Element {
  const cara = tesela.querySelector("[class*='size-']");

  expect(cara, "la tesela no lleva cara").not.toBeNull();

  return cara as Element;
}

describe("la cara cabe dentro de su tesela", () => {
  it("la tesela es más ancha que la cara, y también cuando crece", async () => {
    await montarApp("/profiles", SOLO_CUENTA, PERFILES);

    const tesela = await screen.findByRole("link", { name: "Mateo" });
    const cara = escalon(caraDe(tesela), "size");

    expect(escalon(tesela, "w")).toBeGreaterThan(cara);
    expect(escalon(tesela, "sm:w")).toBeGreaterThan(cara);
  });

  /*
   * El hueco de crear no es un perfil, pero está en la misma fila: con otra
   * medida se lee como un error de maquetación y no como una distinción.
   */
  it("la marca de «más» mide lo mismo que las caras que acompaña", async () => {
    await montarApp("/profiles", SOLO_CUENTA, PERFILES);

    const perfil = await screen.findByRole("link", { name: "Mateo" });
    const crear = screen.getByRole("link", { name: messages.auth.createProfile });

    expect(escalon(caraDe(crear), "size")).toBe(escalon(caraDe(perfil), "size"));
  });

  /*
   * El relleno lateral es del NOMBRE. Puesto en la tarjeta se lo quitaría al
   * círculo, que es justo lo que no sobra en el caso estrecho.
   */
  it("el nombre lleva su propio margen lateral y la tarjeta no", async () => {
    await montarApp("/profiles", SOLO_CUENTA, PERFILES);

    const tesela = await screen.findByRole("link", { name: "Mateo" });
    const nombre = within(tesela).getByText("Mateo");

    expect(nombre.getAttribute("class")?.split(/\s+/)).toContainEqual(
      expect.stringMatching(/^px-\d/),
    );
    expect(tesela.getAttribute("class")).toContain("px-0");
  });
});
