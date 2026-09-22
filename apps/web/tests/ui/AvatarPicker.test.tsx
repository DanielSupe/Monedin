import { AVATAR_KEYS } from "@monedin/contracts";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AvatarPicker } from "../../src/features/profiles/AvatarPicker.js";
import { messages } from "../../src/lib/messages.js";

/**
 * LA REJILLA DE ANIMALES SALÍA EN BLANCO, y el test que la protegía pasaba.
 *
 * Aquel comprobaba que cada opción tenía su `drawing` DEFINIDO. Lo estaba: eran
 * los `<path>` sueltos del animal, sin el `<svg>` que los hace visibles —quien
 * lo envuelve es `avatarDrawing`—, así que el navegador no pintaba nada y el
 * alta de un perfil enseñaba doce cajas vacías. Se vio abriendo la pantalla.
 *
 * Por eso este caso **cuenta lo dibujado** y no lo declarado: monta la rejilla y
 * exige que cada botón tenga un `<svg>` con contenido dentro. Con el defecto
 * puesto, los doce botones seguían existiendo y seguían teniendo su nombre — que
 * es exactamente lo que el test anterior miraba.
 */
describe("la rejilla de animales dibuja los animales", () => {
  function montar() {
    render(
      <AvatarPicker
        value={null}
        onChange={vi.fn()}
        label={messages.children.chooseAvatar}
      />,
    );
  }

  it("hay un botón por clave del contrato", () => {
    montar();

    expect(screen.getAllByRole("button")).toHaveLength(AVATAR_KEYS.length);
  });

  it("y cada uno dibuja algo, no una caja vacía", () => {
    montar();

    for (const boton of screen.getAllByRole("button")) {
      const dibujo = boton.querySelector("svg");

      expect(dibujo, `un botón de la rejilla no dibuja nada`).not.toBeNull();
      // Con contenido: un `<svg>` vacío también es una caja vacía.
      expect(dibujo?.childElementCount ?? 0).toBeGreaterThan(0);
    }
  });
});
