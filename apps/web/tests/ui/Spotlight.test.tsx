import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Spotlight } from "../../src/ui/index.js";

const RECUADRO = { top: 100, left: 40, width: 240, height: 120 };

function montar(props: Partial<Parameters<typeof Spotlight>[0]> = {}) {
  const onOpenChange = vi.fn();

  render(
    <Spotlight
      open
      onOpenChange={onOpenChange}
      title="Aquí ves lo que te espera"
      description="Lo que tus hijos marcaron y no has aprobado."
      footer={<button type="button">Seguir</button>}
      {...props}
    />,
  );

  return { onOpenChange };
}

describe("el foco del recorrido", () => {
  it("se anuncia con su título y lo que explica", () => {
    montar({ rect: RECUADRO });

    const panel = screen.getByRole("dialog", { name: "Aquí ves lo que te espera" });
    expect(panel).toHaveAccessibleDescription("Lo que tus hijos marcaron y no has aprobado.");
  });

  it("destaca sin anunciar el hueco", () => {
    const { container } = render(
      <Spotlight
        open
        onOpenChange={() => {}}
        title="Título"
        description="Descripción"
        rect={RECUADRO}
        footer={<button type="button">Seguir</button>}
      />,
    );

    void container;
    expect(screen.getAllByRole("dialog")).toHaveLength(1);
  });

  it("cierra con la tecla de escape, que es lo que se hereda de Radix", async () => {
    const { onOpenChange } = montar({ rect: RECUADRO });

    await userEvent.keyboard("{Escape}");

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("el control de avanzar está dentro del panel, que es lo único que actúa", () => {
    montar({ rect: RECUADRO });

    const panel = screen.getByRole("dialog");
    expect(panel.contains(screen.getByRole("button", { name: "Seguir" }))).toBe(true);
  });

  it("sin nada que destacar sigue mostrando su panel", () => {
    montar();

    expect(screen.getByRole("dialog", { name: "Aquí ves lo que te espera" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Seguir" })).toBeInTheDocument();
  });
});

describe("el panel cabe en la banda libre, sin tocar lo destacado", () => {
  function estilo(): CSSStyleDeclaration {
    return screen.getByRole("dialog").style;
  }

  it("con el hueco arriba, el panel empieza POR DEBAJO de él", () => {
    const hueco = { top: 40, left: 40, width: 200, height: 100 };
    montar({ rect: hueco });

    expect(Number.parseInt(estilo().top, 10)).toBeGreaterThanOrEqual(hueco.top + hueco.height);
  });

  it("y con el hueco abajo, el panel acaba POR ENCIMA de él", () => {
    const alto = window.innerHeight;
    const hueco = { top: alto - 140, left: 40, width: 200, height: 100 };
    montar({ rect: hueco });

    const desdeAbajo = Number.parseInt(estilo().bottom, 10);
    expect(alto - desdeAbajo).toBeLessThanOrEqual(hueco.top);
  });

  it("y nunca puede medir más que la banda que le queda", () => {
    const alto = window.innerHeight;
    const hueco = { top: 40, left: 40, width: 200, height: 100 };
    montar({ rect: hueco });

    const bandaLibre = alto - (hueco.top + hueco.height);
    expect(Number.parseInt(estilo().maxHeight, 10)).toBeLessThanOrEqual(bandaLibre);
  });

  it("sin nada que destacar sigue teniendo tope, por si el contenido crece", () => {
    montar();

    expect(estilo().maxHeight).not.toBe("");
  });
});
