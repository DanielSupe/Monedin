import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Button, buttonClasses } from "../../src/ui/Button.js";

describe("Button", () => {
  it("no admite una segunda activación mientras la operación está en curso", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(
      <Button pending onClick={onClick}>
        Aprobar
      </Button>,
    );

    const boton = screen.getByRole("button", { name: "Aprobar" });
    expect(boton).toBeDisabled();
    expect(boton).toHaveAttribute("aria-busy", "true");

    await user.click(boton);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("es de tipo button aunque esté dentro de un formulario", () => {
    const onSubmit = vi.fn();

    render(
      <form onSubmit={onSubmit}>
        <Button>Aprobar</Button>
      </form>,
    );

    expect(screen.getByRole("button", { name: "Aprobar" })).toHaveAttribute("type", "button");
  });

  it("deja pasar un tipo explícito para el botón que sí envía", () => {
    render(<Button type="submit">Guardar</Button>);

    expect(screen.getByRole("button", { name: "Guardar" })).toHaveAttribute("type", "submit");
  });

  it("deshabilitado no llama al manejador", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(
      <Button disabled onClick={onClick}>
        Aprobar
      </Button>,
    );

    await user.click(screen.getByRole("button", { name: "Aprobar" }));
    expect(onClick).not.toHaveBeenCalled();
  });

  it("en reposo sí llama al manejador", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(<Button onClick={onClick}>Aprobar</Button>);

    await user.click(screen.getByRole("button", { name: "Aprobar" }));
    expect(onClick).toHaveBeenCalledOnce();
  });
});

/**
 * La talla mayor, desde `redesign-public-entry`.
 *
 * Una llamada a la acción de una página que convence no puede pesar lo mismo
 * que el botón de un formulario que ya se está rellenando.
 */
describe("la acción admite una talla mayor", () => {
  it("las dos tallas se distinguen ENTRE SÍ", () => {
    // Comparar las dos y no comprobar que la mayor «tiene clases»: con las dos
    // iguales, eso seguiría en verde y la talla no existiría.
    expect(buttonClasses("primary", false, "large")).not.toBe(buttonClasses("primary"));
  });

  it("y el enlace pide exactamente la misma", () => {
    // Navegar es trabajo de un enlace, así que las dos acciones de la puerta
    // pública son enlaces: si la talla solo viviera en el botón, no la tendrían.
    render(
      <a href="#empezar" className={buttonClasses("primary", false, "large")}>
        Empezar
      </a>,
    );

    const enlace = screen.getByRole("link", { name: "Empezar" });
    expect(enlace.className).toBe(buttonClasses("primary", false, "large"));
  });

  it("la talla por defecto no cambia por existir la otra", () => {
    expect(buttonClasses("primary")).toBe(buttonClasses("primary", false, "default"));
  });
});
