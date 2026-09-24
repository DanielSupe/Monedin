import { DEFAULT_AVATAR_KEY } from "@monedin/contracts";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Avatar } from "../../src/ui/Avatar.js";

describe("Avatar", () => {
  it("una clave del catálogo se dibuja, y no se pide como imagen", () => {
    render(<Avatar value="zorro" alt="Ana" />);

    const avatar = screen.getByRole("img", { name: "Ana" });
    expect(avatar).not.toBeInstanceOf(HTMLImageElement);
    expect(avatar.querySelector("svg")).not.toBeNull();
  });

  it("una URL firmada se pinta como imagen", () => {
    render(<Avatar value="https://s3.example/foto.jpg?firma" alt="Ana" />);

    const imagen = screen.getByRole("img", { name: "Ana" });
    expect(imagen).toBeInstanceOf(HTMLImageElement);
    expect(imagen).toHaveAttribute("src", "https://s3.example/foto.jpg?firma");
  });

  it("sin valor cae en el avatar por defecto", () => {
    const sinValor = render(<Avatar value={null} alt="Sin nombre" />);
    const porDefecto = render(<Avatar value={DEFAULT_AVATAR_KEY} alt="Por defecto" />);

    expect(sinValor.container.querySelector("svg")?.innerHTML).toBe(
      porDefecto.container.querySelector("svg")?.innerHTML,
    );
  });

  it("una clave desconocida también, en vez de dejar un hueco", () => {
    const desconocida = render(<Avatar value="no-existe" alt="Rara" />);
    const porDefecto = render(<Avatar value={DEFAULT_AVATAR_KEY} alt="Por defecto" />);

    expect(desconocida.container.querySelector("svg")?.innerHTML).toBe(
      porDefecto.container.querySelector("svg")?.innerHTML,
    );
  });

  it("sin texto alternativo queda oculto a los lectores, porque es decorativo", () => {
    const { container } = render(<Avatar value="panda" />);

    expect(screen.queryByRole("img")).toBeNull();
    expect(container.querySelector("[aria-hidden='true']")).not.toBeNull();
  });
});

describe("la forma del avatar", () => {
  it("sin pedir forma sigue siendo redondo, y las pantallas de hoy no cambian", () => {
    render(<Avatar value="zorro" alt="Ana" />);

    expect(screen.getByRole("img", { name: "Ana" })).toHaveClass("rounded-pill");
  });

  it("con `rounded` deja de serlo", () => {
    render(<Avatar value="zorro" shape="rounded" alt="Ana" />);

    const avatar = screen.getByRole("img", { name: "Ana" });
    expect(avatar).not.toHaveClass("rounded-pill");
    expect(avatar).toHaveClass("rounded-card");
  });

  it("la forma también manda cuando el avatar es una foto", () => {
    render(<Avatar value="https://s3.example/foto.jpg?firma" shape="rounded" alt="Ana" />);

    expect(screen.getByRole("img", { name: "Ana" })).not.toHaveClass("rounded-pill");
  });
});
