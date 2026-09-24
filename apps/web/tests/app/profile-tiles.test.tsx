import type { SelectableProfile } from "@monedin/contracts";
import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { messages } from "../../src/lib/messages.js";
import { SOLO_CUENTA, montarApp } from "../support/router.js";

const PERFILES: SelectableProfile[] = [
  { id: "parent", familyRole: "PARENT", name: "Lucía", avatar: "nutria", locked: false },
  { id: "hijo-1", familyRole: "CHILD", name: "Mateo", avatar: "zorro", locked: false },
];

function escalon(elemento: Element, prefijo: string): number {
  const clases = elemento.getAttribute("class") ?? "";

  const utilidad = clases.split(/\s+/).find((clase) => clase.startsWith(`${prefijo}-`));

  expect(utilidad, `no se declara ${prefijo}-* en «${clases}»`).toBeDefined();

  return Number(utilidad?.slice(prefijo.length + 1));
}

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

  it("la marca de «más» mide lo mismo que las caras que acompaña", async () => {
    await montarApp("/profiles", SOLO_CUENTA, PERFILES);

    const perfil = await screen.findByRole("link", { name: "Mateo" });
    const crear = screen.getByRole("link", { name: messages.auth.createProfile });

    expect(escalon(caraDe(crear), "size")).toBe(escalon(caraDe(perfil), "size"));
  });

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
