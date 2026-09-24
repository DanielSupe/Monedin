import { screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PIN_LABEL, messages } from "../../src/lib/messages.js";
import { SOLO_CUENTA, montarApp } from "../support/router.js";

afterEach(() => {
  vi.unstubAllGlobals();
});

async function montar(): Promise<void> {
  await montarApp("/profiles/reset-pin", SOLO_CUENTA);
}

describe("la vía de rescate explica sus dos credenciales", () => {
  it("dice qué papel tiene la contraseña y cuál el PIN nuevo", async () => {
    await montar();

    expect(screen.getByLabelText(messages.auth.password)).toBeInTheDocument();
    expect(screen.getByLabelText(messages.auth.newPin)).toBeInTheDocument();

    expect(screen.getByText(messages.auth.resetPinPasswordHelp)).toBeInTheDocument();
    expect(screen.getByText(messages.auth.resetPinNewPinHelp)).toBeInTheDocument();
  });

  it("los dos textos son DISTINTOS entre sí", async () => {
    await montar();

    expect(messages.auth.resetPinPasswordHelp).not.toEqual(messages.auth.resetPinNewPinHelp);
  });

  it("dice ANTES de nada por qué está aquí", async () => {
    await montar();

    expect(screen.getByText(messages.auth.resetPinLead)).toBeInTheDocument();
  });
});

describe("la longitud del PIN sale de su constante", () => {
  it("la etiqueta compuesta lleva la cifra dentro", () => {
    expect(PIN_LABEL).toMatch(/\d/);
    expect(PIN_LABEL).toContain(messages.auth.pinLead);
    expect(PIN_LABEL).toContain(messages.auth.pinTail);
  });
});
