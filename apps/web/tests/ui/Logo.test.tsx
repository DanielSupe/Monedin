import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { messages } from "../../src/lib/messages.js";
import { Logo } from "../../src/ui/Logo.js";

/**
 * La marca vive en una sola pieza.
 *
 * Antes «Monedín» era un `<span>` con texto suelto repetido en tres sitios.
 * Cuando llegue la identidad definitiva, cambiarla tiene que ser sustituir esta
 * pieza y nada más.
 */
describe("Logo", () => {
  it("se anuncia con el nombre del producto, no como una imagen sin descripción", () => {
    render(<Logo />);

    expect(screen.getByRole("img", { name: messages.app.title })).toBeInTheDocument();
  });

  it("el nombre se anuncia UNA vez, aunque se vea el texto", () => {
    render(<Logo />);

    // El SVG va oculto y el texto también: si los dos se anunciaran, un lector
    // diría «Monedín» dos veces seguidas.
    expect(screen.getAllByRole("img", { name: messages.app.title })).toHaveLength(1);
  });

  it("solo el símbolo sigue anunciando el nombre", () => {
    render(<Logo markOnly />);

    // Sin el texto visible, el nombre accesible es lo único que queda: quitarlo
    // dejaría la marca muda donde no cabe la palabra.
    expect(screen.getByRole("img", { name: messages.app.title })).toBeInTheDocument();
    expect(screen.queryByText(messages.app.title)).toBeNull();
  });

  it("con nombre visible, el texto está ahí", () => {
    render(<Logo />);

    expect(screen.getByText(messages.app.title)).toBeInTheDocument();
  });

  it("las tres medidas rinden el mismo marcado", () => {
    const { container: pequeno } = render(<Logo size="small" />);
    const { container: grande } = render(<Logo size="large" />);

    // Misma estructura, distinto tamaño: si algún día difieren, alguien
    // duplicó la pieza en vez de escalarla.
    expect(pequeno.querySelectorAll("svg")).toHaveLength(1);
    expect(grande.querySelectorAll("svg")).toHaveLength(1);
  });
});
