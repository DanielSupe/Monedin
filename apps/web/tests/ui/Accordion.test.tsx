import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Accordion } from "../../src/ui/index.js";

const PREGUNTAS = [
  { value: "una", label: "¿Qué son las monedas?", content: <p>Se ganan haciendo tareas.</p> },
  { value: "dos", label: "¿Cuándo se pagan?", content: <p>Al aprobar la tarea.</p> },
  { value: "tres", label: "¿Y el PIN?", content: <p>Lo repone un adulto.</p> },
];

function montar(): void {
  render(<Accordion items={PREGUNTAS} />);
}

describe("plegar y desplegar", () => {
  it("arranca con todo plegado: se leen las preguntas, no las respuestas", () => {
    montar();

    expect(screen.getByRole("button", { name: PREGUNTAS[0]!.label })).toBeTruthy();
    expect(screen.queryByText("Se ganan haciendo tareas.")).toBeNull();
  });

  it("al abrir una aparece su respuesta", async () => {
    const usuario = userEvent.setup();
    montar();

    await usuario.click(screen.getByRole("button", { name: PREGUNTAS[0]!.label }));

    expect(screen.getByText("Se ganan haciendo tareas.")).toBeTruthy();
  });

  it("se cierra volviendo a pulsarla", async () => {
    const usuario = userEvent.setup();
    montar();

    const control = screen.getByRole("button", { name: PREGUNTAS[0]!.label });
    await usuario.click(control);
    await usuario.click(control);

    expect(screen.queryByText("Se ganan haciendo tareas.")).toBeNull();
  });

  it("pueden estar abiertas varias a la vez", async () => {
    const usuario = userEvent.setup();
    montar();

    await usuario.click(screen.getByRole("button", { name: PREGUNTAS[0]!.label }));
    await usuario.click(screen.getByRole("button", { name: PREGUNTAS[1]!.label }));

    expect(screen.getByText("Se ganan haciendo tareas.")).toBeTruthy();
    expect(screen.getByText("Al aprobar la tarea.")).toBeTruthy();
  });
});

describe("lo que oye quien no ve la pantalla", () => {
  it("el control anuncia si está abierto o cerrado", async () => {
    const usuario = userEvent.setup();
    montar();

    const control = screen.getByRole("button", { name: PREGUNTAS[0]!.label });
    expect(control.getAttribute("aria-expanded")).toBe("false");

    await usuario.click(control);

    expect(control.getAttribute("aria-expanded")).toBe("true");
  });

  it("el control apunta a la región que revela", async () => {
    const usuario = userEvent.setup();
    montar();

    const control = screen.getByRole("button", { name: PREGUNTAS[0]!.label });
    await usuario.click(control);

    const regionId = control.getAttribute("aria-controls");
    expect(regionId).toBeTruthy();

    const region = document.getElementById(regionId ?? "");
    expect(region).not.toBeNull();
    expect(region?.textContent).toContain("Se ganan haciendo tareas.");
  });
});

describe("se recorre sin ratón", () => {
  it("se abre con el teclado", async () => {
    const usuario = userEvent.setup();
    montar();

    await usuario.tab();
    await usuario.keyboard("{Enter}");

    expect(screen.getByText("Se ganan haciendo tareas.")).toBeTruthy();
  });

  it("las flechas mueven de una pregunta a la siguiente", async () => {
    const usuario = userEvent.setup();
    montar();

    await usuario.tab();
    expect(document.activeElement?.textContent).toContain(PREGUNTAS[0]!.label);

    await usuario.keyboard("{ArrowDown}");
    expect(document.activeElement?.textContent).toContain(PREGUNTAS[1]!.label);
  });
});
