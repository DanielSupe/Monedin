import { cleanup, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { HELP_AGE_QUESTION, HELP_PIN_QUESTION, messages } from "../../src/lib/messages.js";
import { comoNino, comoPadre, montarApp } from "../support/router.js";

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

    expect(screen.queryByText(messages.help.childCoinsA)).toBeNull();
  });
});

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

describe("las preguntas con cifras se componen desde el contrato", () => {
  it("la edad y el PIN aparecen con su número", async () => {
    await montarApp("/help", comoPadre());

    expect(screen.getByRole("button", { name: HELP_AGE_QUESTION })).toBeTruthy();
    expect(screen.getByRole("button", { name: HELP_PIN_QUESTION })).toBeTruthy();

    expect(/\d/.test(HELP_AGE_QUESTION)).toBe(true);
    expect(/\d/.test(HELP_PIN_QUESTION)).toBe(true);
  });
});

describe("cuando ninguna respuesta es la tuya", () => {
  it("el pie lleva al chat, y es un ENLACE", async () => {
    await montarApp("/help", comoNino());

    const acceso = screen.getByRole("link", { name: messages.help.askMonedin });

    expect(acceso.getAttribute("href")).toBe("/assistant");

    expect(acceso.tagName).toBe("A");
    expect(within(acceso).queryByRole("button")).toBeNull();
  });
});
