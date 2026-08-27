import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Button } from "../../src/ui/Button.js";

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
