import { DEFAULT_AVATAR_KEY } from "@monedin/contracts";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Avatar } from "../../src/ui/Avatar.js";
import { avatarGlyph } from "../../src/ui/avatars.js";

/**
 * El avatar se mudó a `ui/` en `add-design-system`, pero su lógica de dos formas
 * NO cambió. Estos tests son justamente el seguro de eso: si alguien reescribe
 * la distinción entre una clave del catálogo y una foto propia, aquí se nota.
 */
describe("Avatar", () => {
  it("una clave del catálogo se pinta como glifo, no como imagen", () => {
    render(<Avatar value="zorro" alt="Ana" />);

    expect(screen.getByRole("img", { name: "Ana" })).toHaveTextContent(avatarGlyph("zorro"));
    expect(screen.queryByRole("img", { name: "Ana" })).not.toBeInstanceOf(HTMLImageElement);
  });

  it("una URL firmada se pinta como imagen", () => {
    render(<Avatar value="https://s3.example/foto.jpg?firma" alt="Ana" />);

    const imagen = screen.getByRole("img", { name: "Ana" });
    expect(imagen).toBeInstanceOf(HTMLImageElement);
    expect(imagen).toHaveAttribute("src", "https://s3.example/foto.jpg?firma");
  });

  it("sin valor cae en el avatar por defecto", () => {
    render(<Avatar value={null} alt="Sin nombre" />);

    expect(screen.getByRole("img", { name: "Sin nombre" })).toHaveTextContent(
      avatarGlyph(DEFAULT_AVATAR_KEY),
    );
  });

  it("sin texto alternativo queda oculto a los lectores, porque es decorativo", () => {
    const { container } = render(<Avatar value="panda" />);

    expect(screen.queryByRole("img")).toBeNull();
    expect(container.querySelector("[aria-hidden='true']")).not.toBeNull();
  });
});

/**
 * La forma es una OPCIÓN de la pieza, no una clase que se pasa desde fuera.
 *
 * `cx` no fusiona utilidades de Tailwind, así que dos radios en la misma cadena
 * los resuelve el orden del CSS generado y no el del código. Eso no se ve
 * leyendo y no tiene por qué ser estable entre compilaciones.
 */
describe("la forma del avatar", () => {
  it("sin pedir forma sigue siendo redondo, y las pantallas de hoy no cambian", () => {
    render(<Avatar value="zorro" alt="Ana" />);

    expect(screen.getByRole("img", { name: "Ana" })).toHaveClass("rounded-full");
  });

  it("con `rounded` deja de serlo", () => {
    render(<Avatar value="zorro" shape="rounded" alt="Ana" />);

    const avatar = screen.getByRole("img", { name: "Ana" });
    expect(avatar).not.toHaveClass("rounded-full");
    expect(avatar).toHaveClass("rounded-card");
  });

  it("la forma también manda cuando el avatar es una foto", () => {
    render(<Avatar value="https://s3.example/foto.jpg?firma" shape="rounded" alt="Ana" />);

    expect(screen.getByRole("img", { name: "Ana" })).not.toHaveClass("rounded-full");
  });
});
