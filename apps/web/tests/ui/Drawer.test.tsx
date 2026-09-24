import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { Drawer } from "../../src/ui/index.js";

function Montado(): React.ReactElement {
  const [abierto, setAbierto] = useState(false);

  return (
    <Drawer
      open={abierto}
      onOpenChange={setAbierto}
      label="Navegación"
      trigger={<button type="button">Menú</button>}
    >
      <nav>
        <a href="#destino">Inicio</a>
      </nav>
    </Drawer>
  );
}

describe("el cajón lateral", () => {
  it("está cerrado hasta que se pulsa su disparador", async () => {
    render(<Montado />);

    expect(screen.queryByRole("link", { name: "Inicio" })).toBeNull();

    await userEvent.click(screen.getByRole("button", { name: "Menú" }));

    expect(screen.getByRole("link", { name: "Inicio" })).toBeInTheDocument();
  });

  it("se anuncia con su nombre", async () => {
    render(<Montado />);

    await userEvent.click(screen.getByRole("button", { name: "Menú" }));

    expect(screen.getByRole("dialog", { name: "Navegación" })).toBeInTheDocument();
  });

  it("cierra con Escape y DEVUELVE el foco al disparador", async () => {
    render(<Montado />);

    const disparador = screen.getByRole("button", { name: "Menú" });
    await userEvent.click(disparador);

    await userEvent.keyboard("{Escape}");

    expect(screen.queryByRole("link", { name: "Inicio" })).toBeNull();

    expect(document.activeElement).toBe(disparador);
  });

  it("mete el foco dentro mientras está abierto", async () => {
    render(<Montado />);

    const disparador = screen.getByRole("button", { name: "Menú" });
    await userEvent.click(disparador);

    expect(screen.getByRole("dialog").contains(document.activeElement)).toBe(true);
  });
});
