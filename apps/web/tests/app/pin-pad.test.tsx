import { API_PREFIX, PIN_LENGTH, type SelectableProfile } from "@monedin/contracts";
import { act, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { messages } from "../../src/lib/messages.js";
import { SOLO_CUENTA, montarApp } from "../support/router.js";

const PERFILES: SelectableProfile[] = [
  { id: "hijo-1", familyRole: "CHILD", name: "Mateo", avatar: "zorro", locked: false },
];

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

async function escribir(teclas: string): Promise<void> {
  await userEvent.keyboard(teclas);
}

function pinesEnviados(): string[] {
  return vi
    .mocked(globalThis.fetch)
    .mock.calls.filter(([entrada]) =>
      String(entrada).startsWith(`${API_PREFIX}/auth/profiles/enter`),
    )
    .map(([, init]) => JSON.parse(String((init as RequestInit).body)).pin as string);
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

    await teclear("2".repeat(PIN_LENGTH - 2));
    expect(intentos()).toBe(0);

    await teclear("2");
    expect(intentos()).toBe(1);
  });

  it("borrar con el PIN vacío no hace nada", async () => {
    await montarApp("/profiles/hijo-1/pin", SOLO_CUENTA, PERFILES);

    const borrar = await screen.findByRole("button", { name: messages.auth.pinDelete });

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

describe("el PIN también se escribe con el teclado", () => {
  it("se teclea entero y se intenta una vez, con lo que se escribió", async () => {
    await montarApp("/profiles/hijo-1/pin", SOLO_CUENTA, PERFILES);
    await screen.findByRole("button", { name: "1" });

    const esperado = "1234".slice(0, PIN_LENGTH);
    await escribir(esperado);

    expect(intentos()).toBe(1);
    expect(pinesEnviados()).toEqual([esperado]);
  });

  it("sin ceder el turno entre teclas, no se pierde ningún dígito", async () => {
    await montarApp("/profiles/hijo-1/pin", SOLO_CUENTA, PERFILES);
    await screen.findByRole("button", { name: "1" });

    const esperado = "1234".slice(0, PIN_LENGTH);

    await act(async () => {
      for (const tecla of esperado) {
        document.dispatchEvent(new KeyboardEvent("keydown", { key: tecla, bubbles: true }));
      }
    });

    expect(pinesEnviados()).toEqual([esperado]);
  });

  it("el retroceso corrige y no gasta un intento", async () => {
    await montarApp("/profiles/hijo-1/pin", SOLO_CUENTA, PERFILES);
    await screen.findByRole("button", { name: "1" });

    await escribir("19");
    await escribir("{Backspace}");
    expect(intentos()).toBe(0);

    await escribir("2".repeat(PIN_LENGTH - 1));

    expect(intentos()).toBe(1);
    expect(pinesEnviados()).toEqual([`1${"2".repeat(PIN_LENGTH - 1)}`]);
  });

  it("empezar en la pantalla y terminar tecleando vale igual", async () => {
    await montarApp("/profiles/hijo-1/pin", SOLO_CUENTA, PERFILES);
    await screen.findByRole("button", { name: "1" });

    await teclear("12");
    await escribir("3".repeat(PIN_LENGTH - 2));

    expect(pinesEnviados()).toEqual([`12${"3".repeat(PIN_LENGTH - 2)}`]);
  });

  it("tras un PIN equivocado el teclado queda limpio para reintentar", async () => {
    await montarApp("/profiles/hijo-1/pin", SOLO_CUENTA, PERFILES);
    await screen.findByRole("button", { name: "1" });

    const rechaza = vi.fn((entrada: RequestInfo | URL) => {
      const cabeceras = { "Content-Type": "application/json" };

      if (String(entrada).startsWith(`${API_PREFIX}/auth/profiles/enter`)) {
        return Promise.resolve(
          new Response(JSON.stringify({ code: "UNAUTHORIZED", message: "PIN incorrecto." }), {
            status: 401,
            headers: cabeceras,
          }),
        );
      }
      return Promise.resolve(
        new Response(JSON.stringify({ profiles: PERFILES }), { status: 200, headers: cabeceras }),
      );
    });
    vi.stubGlobal("fetch", rechaza);

    await escribir("1".repeat(PIN_LENGTH));
    await screen.findByText(messages.auth.pinWrong);

    await escribir("2".repeat(PIN_LENGTH));

    expect(intentos()).toBe(2);
    expect(pinesEnviados()).toEqual(["1".repeat(PIN_LENGTH), "2".repeat(PIN_LENGTH)]);
  });

  it("una tecla que no es un dígito no toca el PIN", async () => {
    await montarApp("/profiles/hijo-1/pin", SOLO_CUENTA, PERFILES);
    await screen.findByRole("button", { name: "1" });

    await escribir("a1b2c");
    expect(intentos()).toBe(0);

    await escribir("3".repeat(PIN_LENGTH - 2));

    expect(pinesEnviados()).toEqual([`12${"3".repeat(PIN_LENGTH - 2)}`]);
  });
});

describe("mientras se comprueba el PIN, el teclado no responde", () => {
  it("el retroceso durante la petición no deja mandar un segundo intento", async () => {
    await montarApp("/profiles/hijo-1/pin", SOLO_CUENTA, PERFILES);
    await screen.findByRole("button", { name: "1" });

    const enElAire = vi.fn((entrada: RequestInfo | URL) => {
      if (String(entrada).startsWith(`${API_PREFIX}/auth/profiles/enter`)) {
        return new Promise<Response>(() => {});
      }
      return Promise.resolve(
        new Response(JSON.stringify({ profiles: PERFILES }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );
    });
    vi.stubGlobal("fetch", enElAire);

    await escribir("1".repeat(PIN_LENGTH));
    await escribir("{Backspace}");
    await escribir("9");

    expect(intentos()).toBe(1);
  });
});
