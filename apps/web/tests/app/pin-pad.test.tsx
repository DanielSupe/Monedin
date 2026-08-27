import { API_PREFIX, PIN_LENGTH, type SelectableProfile } from "@monedin/contracts";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { messages } from "../../src/lib/messages.js";
import { SOLO_CUENTA, montarApp } from "../support/router.js";

/**
 * El teclado de PIN.
 *
 * Lo que se prueba aquí es que corregir NO cuesta un intento. Sin borrado, quien
 * se equivoca en un dígito intermedio está obligado a completar un PIN que sabe
 * equivocado, y los intentos fallidos bloquean el perfil. Ver la decisión 5 del
 * design de `redesign-profile-grid`.
 */

const PERFILES: SelectableProfile[] = [
  { id: "hijo-1", familyRole: "CHILD", name: "Mateo", avatar: "zorro", locked: false },
];

/** Cuántas veces se ha intentado entrar de verdad, o sea contra la API. */
function intentos(): number {
  const llamadas = vi.mocked(globalThis.fetch).mock.calls;

  return llamadas.filter(([entrada]) =>
    String(entrada).startsWith(`${API_PREFIX}/auth/profiles/enter`),
  ).length;
}

async function teclear(digitos: string): Promise<void> {
  for (const digito of digitos) {
    await userEvent.click(screen.getByRole("button", { name: digito }));
  }
}

beforeEach(() => {
  vi.unstubAllGlobals();
});

describe("corregir el PIN no cuesta un intento", () => {
  it("borrar quita el último dígito y no llama a la API", async () => {
    await montarApp("/profiles/hijo-1/pin", SOLO_CUENTA, PERFILES);
    await screen.findByRole("button", { name: "1" });

    await teclear("12");
    await userEvent.click(screen.getByRole("button", { name: messages.auth.pinDelete }));

    expect(intentos()).toBe(0);

    // Queda un dígito: hacen falta PIN_LENGTH - 1 más para que se intente.
    await teclear("2".repeat(PIN_LENGTH - 2));
    expect(intentos()).toBe(0);

    await teclear("2");
    expect(intentos()).toBe(1);
  });

  it("borrar con el PIN vacío no hace nada", async () => {
    await montarApp("/profiles/hijo-1/pin", SOLO_CUENTA, PERFILES);

    const borrar = await screen.findByRole("button", { name: messages.auth.pinDelete });

    // Deshabilitado sin nada que borrar: un botón que no hace nada al pulsarlo
    // miente sobre lo que ofrece.
    expect(borrar).toBeDisabled();
    expect(intentos()).toBe(0);
  });
});

describe("el teclado dice a dónde va", () => {
  it("administrando, el título habla de editar el perfil", async () => {
    await montarApp("/profiles/hijo-1/pin?manage=true", SOLO_CUENTA, PERFILES);

    expect(
      await screen.findByRole("heading", { name: new RegExp(messages.auth.pinPromptToEdit) }),
    ).toBeInTheDocument();
  });

  it("sin administrar, el título es el de siempre", async () => {
    await montarApp("/profiles/hijo-1/pin", SOLO_CUENTA, PERFILES);

    expect(
      await screen.findByRole("heading", { name: new RegExp(messages.auth.pinPrompt) }),
    ).toBeInTheDocument();
    expect(screen.queryByText(new RegExp(messages.auth.pinPromptToEdit))).toBeNull();
  });
});
