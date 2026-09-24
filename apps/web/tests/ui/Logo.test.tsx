import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { messages } from "../../src/lib/messages.js";
import { Logo } from "../../src/ui/Logo.js";

describe("Logo", () => {
  it("se anuncia con el nombre del producto, no como una imagen sin descripción", () => {
    render(<Logo />);

    expect(screen.getByRole("img", { name: messages.app.title })).toBeInTheDocument();
  });

  it("el nombre se anuncia UNA vez, aunque se vea el texto", () => {
    render(<Logo />);

    expect(screen.getAllByRole("img", { name: messages.app.title })).toHaveLength(1);
  });

  it("solo el símbolo sigue anunciando el nombre", () => {
    render(<Logo markOnly />);

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

    expect(pequeno.querySelectorAll("svg")).toHaveLength(1);
    expect(grande.querySelectorAll("svg")).toHaveLength(1);
  });
});
