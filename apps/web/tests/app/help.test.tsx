import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { HELP_AGE_QUESTION, HELP_PIN_QUESTION, messages } from "../../src/lib/messages.js";
import { comoNino, comoPadre, montarApp } from "../support/router.js";

/**
 * Las preguntas frecuentes.
 *
 * Es la primera pantalla del producto que existe para EXPLICARLO, así que lo
 * que se prueba es que se pueda encontrar la duda propia sin leerlo todo: los
 * enunciados a la vista y las respuestas guardadas.
 */

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("se leen las preguntas, no las respuestas", () => {
  it("arranca con todo plegado", async () => {
    await montarApp("/help", comoNino());

    expect(screen.getByRole("button", { name: messages.help.coinsQ })).toBeTruthy();
    expect(screen.queryByText(messages.help.coinsA)).toBeNull();
  });

  it("se abre la que interesa y aparece su respuesta", async () => {
    await montarApp("/help", comoNino());

    await userEvent.click(screen.getByRole("button", { name: messages.help.approveQ }));

    expect(screen.getByText(messages.help.approveA)).toBeTruthy();
    // Y las demás siguen guardadas: abrir una no abre todas.
    expect(screen.queryByText(messages.help.coinsA)).toBeNull();
  });
});

describe("los dos roles leen la misma lista", () => {
  it("un padre y un niño ven las mismas preguntas", async () => {
    await montarApp("/help", comoNino());
    const delNino = screen.getAllByRole("button").map((b) => b.textContent);

    await montarApp("/help", comoPadre());
    const todos = screen.getAllByRole("button").map((b) => b.textContent);

    // Se comprueba que las del niño están TODAS entre las del padre: es la misma
    // lista, y una decisión declarada del change.
    for (const pregunta of delNino) {
      expect(todos).toContain(pregunta);
    }
  });
});

/**
 * Las cifras salen de sus constantes, no escritas a mano.
 *
 * Es el riesgo que este change daba por seguro: el test que prohíbe dígitos
 * dentro de una cadena del catálogo recorre también los arrays, y estas dos
 * preguntas hablan de edades y de dígitos de un PIN. Aquel test impide que se
 * escriban; este comprueba que además LLEGAN a la pantalla compuestas.
 */
describe("las preguntas con cifras se componen desde el contrato", () => {
  it("la edad y el PIN aparecen con su número", async () => {
    await montarApp("/help", comoPadre());

    expect(screen.getByRole("button", { name: HELP_AGE_QUESTION })).toBeTruthy();
    expect(screen.getByRole("button", { name: HELP_PIN_QUESTION })).toBeTruthy();

    // Y llevan una cifra de verdad: si alguien vaciara la composición, los dos
    // enunciados seguirían existiendo y este caso lo cazaría.
    expect(/\d/.test(HELP_AGE_QUESTION)).toBe(true);
    expect(/\d/.test(HELP_PIN_QUESTION)).toBe(true);
  });
});

describe("cuando ninguna respuesta es la tuya", () => {
  it("el pie lleva al chat, y es un ENLACE", async () => {
    await montarApp("/help", comoNino());

    const acceso = screen.getByRole("link", { name: messages.help.askMonedin });

    expect(acceso.getAttribute("href")).toBe("/assistant");
    // Un enlace y no un botón: se puede abrir en otra pestaña, y no anida dos
    // elementos interactivos como haría un `<Link>` envolviendo un `<Button>`.
    expect(acceso.tagName).toBe("A");
    expect(within(acceso).queryByRole("button")).toBeNull();
  });
});
