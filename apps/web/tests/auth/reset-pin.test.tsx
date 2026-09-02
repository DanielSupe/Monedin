import { screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PIN_LABEL, messages } from "../../src/lib/messages.js";
import { SOLO_CUENTA, montarApp } from "../support/router.js";

afterEach(() => {
  vi.unstubAllGlobals();
});

/**
 * La vía de rescate de un padre bloqueado fuera de su propio perfil.
 *
 * Se monta por su DIRECCIÓN y con la sesión de solo cuenta, que es justo lo que
 * la define: no exige perfil activo, a propósito —decisión 3 del design de
 * `add-profile-selection`—. Es el único camino de vuelta que le queda.
 */
async function montar(): Promise<void> {
  await montarApp("/profiles/reset-pin", SOLO_CUENTA);
}

/**
 * Pide DOS credenciales, y hasta `close-style-debt` no explicaba ninguna.
 *
 * Es el mismo caso que `redesign-access` arregló en el registro y la misma
 * regla: sin decir para qué sirve cada una, parece que te están pidiendo lo
 * mismo dos veces. Y quien llega aquí está bloqueado fuera de su perfil, o sea
 * nervioso.
 */
describe("la vía de rescate explica sus dos credenciales", () => {
  it("dice qué papel tiene la contraseña y cuál el PIN nuevo", async () => {
    await montar();

    // Los dos campos existen…
    expect(screen.getByLabelText(messages.auth.password)).toBeInTheDocument();
    expect(screen.getByLabelText(messages.auth.newPin)).toBeInTheDocument();

    // …y cada uno dice PARA QUÉ sirve. Sin esto son dos casillas iguales.
    expect(screen.getByText(messages.auth.resetPinPasswordHelp)).toBeInTheDocument();
    expect(screen.getByText(messages.auth.resetPinNewPinHelp)).toBeInTheDocument();
  });

  it("los dos textos son DISTINTOS entre sí", async () => {
    await montar();

    /*
     * Con la misma frase en los dos, el test de arriba seguiría en verde y la
     * pantalla seguiría sin explicar nada. Comprobado inyectando esa violación.
     */
    expect(messages.auth.resetPinPasswordHelp).not.toEqual(messages.auth.resetPinNewPinHelp);
  });

  it("dice ANTES de nada por qué está aquí", async () => {
    await montar();

    expect(screen.getByText(messages.auth.resetPinLead)).toBeInTheDocument();
  });
});

/**
 * El PIN son cuatro dígitos, y ese cuatro sale de su constante.
 *
 * La etiqueta se compone una sola vez en el catálogo, así que si algún día el
 * PIN pasa a cinco, la etiqueta y el campo cambian juntos.
 */
describe("la longitud del PIN sale de su constante", () => {
  it("la etiqueta compuesta lleva la cifra dentro", () => {
    expect(PIN_LABEL).toMatch(/\d/);
    expect(PIN_LABEL).toContain(messages.auth.pinLead);
    expect(PIN_LABEL).toContain(messages.auth.pinTail);
  });
});
