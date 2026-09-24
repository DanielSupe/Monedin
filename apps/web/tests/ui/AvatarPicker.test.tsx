import { AVATAR_KEYS } from "@monedin/contracts";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AvatarPicker } from "../../src/features/profiles/AvatarPicker.js";
import { messages } from "../../src/lib/messages.js";

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

      expect(dibujo?.childElementCount ?? 0).toBeGreaterThan(0);
    }
  });
});
