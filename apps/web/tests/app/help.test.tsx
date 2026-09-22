import { cleanup, screen, within } from "@testing-library/react";
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

    expect(screen.getByRole("button", { name: messages.help.childCoinsQ })).toBeTruthy();
    expect(screen.queryByText(messages.help.childCoinsA)).toBeNull();
  });

  it("se abre la que interesa y aparece su respuesta", async () => {
    await montarApp("/help", comoNino());

    await userEvent.click(screen.getByRole("button", { name: messages.help.childEarnQ }));

    expect(screen.getByText(messages.help.childEarnA)).toBeTruthy();
    // Y las demás siguen guardadas: abrir una no abre todas.
    expect(screen.queryByText(messages.help.childCoinsA)).toBeNull();
  });
});

/**
 * CADA ROL LEE SUS PREGUNTAS, y este bloque decía lo contrario.
 *
 * Comprobaba que las del niño estaban TODAS entre las del padre, «es la misma
 * lista, y una decisión declarada del change». La decisión se revierte con su
 * motivo escrito: «subí el precio de un premio que ya me habían pedido» no es
 * una duda que un niño pueda tener, y las nueve estaban redactadas en tercera
 * persona —un manual para quien administra—.
 *
 * Una lista de preguntas sirve para encontrar la propia; la mitad que no puede
 * ser tuya estorba, y a los siete años estorba el doble.
 *
 * El caso monta LOS DOS y comprueba las dos direcciones: sin la segunda mitad,
 * una lista de niño que fuera un subconjunto de la del padre pasaría igual.
 */
describe("cada rol lee sus propias preguntas", () => {
  it("lo del padre no aparece en la del niño, ni al revés", async () => {
    await montarApp("/help", comoNino());

    expect(screen.getByRole("button", { name: messages.help.childPinQ })).toBeTruthy();
    expect(screen.queryByRole("button", { name: messages.help.frozenQ })).toBeNull();

    cleanup();

    await montarApp("/help", comoPadre());

    expect(screen.getByRole("button", { name: messages.help.frozenQ })).toBeTruthy();
    expect(screen.queryByRole("button", { name: messages.help.childPinQ })).toBeNull();
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
