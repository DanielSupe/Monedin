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

/** Lo mismo, pero por el teclado físico. */
async function escribir(teclas: string): Promise<void> {
  await userEvent.keyboard(teclas);
}

/** Los PIN que se han llegado a mandar, en orden. */
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

/**
 * El teclado físico, que hasta ahora no servía para nada.
 *
 * Eran diez botones y ni un manejador de teclado: en un portátil había que
 * teclear cada dígito con el ratón, y el escritorio es un destino real desde
 * que el lateral se fija a partir de `lg`.
 *
 * Lo que se comprueba no es «que funcione» sino que es EL MISMO camino que los
 * botones. Ver la decisión 5 del design de `polish-profile-and-reward-image`.
 */
describe("el PIN también se escribe con el teclado", () => {
  it("se teclea entero y se intenta una vez, con lo que se escribió", async () => {
    await montarApp("/profiles/hijo-1/pin", SOLO_CUENTA, PERFILES);
    await screen.findByRole("button", { name: "1" });

    const esperado = "1234".slice(0, PIN_LENGTH);
    await escribir(esperado);

    expect(intentos()).toBe(1);
    expect(pinesEnviados()).toEqual([esperado]);
  });

  it("el retroceso corrige y no gasta un intento", async () => {
    await montarApp("/profiles/hijo-1/pin", SOLO_CUENTA, PERFILES);
    await screen.findByRole("button", { name: "1" });

    await escribir("19");
    await escribir("{Backspace}");
    expect(intentos()).toBe(0);

    // Queda el «1»: con PIN_LENGTH - 1 dígitos más se completa, y el que se
    // borró no puede aparecer en lo que se manda.
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

  /*
   * El caso que de verdad distingue «la misma función» de «una vía paralela».
   *
   * Se descubrió inyectando la violación: un teclado con su propio camino, que
   * repetía el guardado del dígito y el envío, pasaba los otros ocho tests. Lo
   * que NO repetía era el `onError` que limpia el PIN, así que tras un fallo se
   * quedaba con cuatro dígitos puestos y no se podía reintentar tecleando.
   *
   * Por eso el número tiene que ser DOS: uno por el PIN fallado y otro por el
   * siguiente. Con la vía paralela el segundo nunca sale y da uno.
   */
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

    // Si una letra hubiera contado, lo enviado no sería esto.
    expect(pinesEnviados()).toEqual([`12${"3".repeat(PIN_LENGTH - 2)}`]);
  });
});

/**
 * Mientras se comprueba, el teclado queda inerte igual que los botones con su
 * `disabled`.
 *
 * Aquí y no arriba: «seguir tecleando con el PIN completo» solo significa algo
 * MIENTRAS la petición está en el aire. Una vez respondida, si falló, el PIN se
 * limpia a propósito y volver a teclear es el camino correcto, no un segundo
 * envío. Un test que tecleara de más tras la respuesta mediría eso y no esto.
 *
 * Sin esa guarda el retroceso sí llegaría a bajar el PIN durante la petición, y
 * el siguiente dígito lo completaría otra vez: dos intentos donde solo hubo uno,
 * y los intentos bloquean el perfil.
 */
describe("mientras se comprueba el PIN, el teclado no responde", () => {
  it("el retroceso durante la petición no deja mandar un segundo intento", async () => {
    await montarApp("/profiles/hijo-1/pin", SOLO_CUENTA, PERFILES);
    await screen.findByRole("button", { name: "1" });

    // Se re-apunta `fetch` para que la entrada se quede en el aire: es la única
    // forma de tener la pantalla en «comprobando» mientras se teclea.
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
