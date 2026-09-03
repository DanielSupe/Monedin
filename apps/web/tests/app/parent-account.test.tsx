import { DEFAULT_AVATAR_KEY, type SessionState } from "@monedin/contracts";
import { cleanup, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { messages } from "../../src/lib/messages.js";
import { montarApp } from "../support/router.js";

afterEach(() => {
  vi.unstubAllGlobals();
});

/**
 * Un padre concreto, con su nombre y su correo.
 *
 * `comoPadre()` trae siempre el mismo correo, y aquí hacen falta dos distintos:
 * un test con un solo actor pasaría igual con el valor escrito a mano en la
 * pantalla, que es justo el defecto que persigue.
 */
function padre(name: string, email: string): SessionState {
  return {
    hasAccount: true,
    actor: { familyRole: "PARENT", id: `padre-${email}`, name, email, avatar: DEFAULT_AVATAR_KEY },
  };
}

const LUCIA = padre("Lucía", "lucia@ejemplo.dev");
const ANDRES = padre("Andrés", "andres@otra-familia.dev");

describe("la cuenta del padre dice de quién es", () => {
  it("enseña su nombre y el correo con el que entra", async () => {
    await montarApp("/account", LUCIA);

    expect(await screen.findByText("Lucía")).toBeInTheDocument();
    expect(screen.getByText("lucia@ejemplo.dev")).toBeInTheDocument();
  });

  /*
   * Dos familias, y ninguna ve nada de la otra. Con un solo actor, una pantalla
   * que pintara un correo escrito a mano pasaría el test anterior.
   */
  it("y son los de quien está dentro, no unos fijos", async () => {
    await montarApp("/account", LUCIA);
    await screen.findByText("lucia@ejemplo.dev");

    cleanup();
    vi.unstubAllGlobals();

    await montarApp("/account", ANDRES);

    expect(await screen.findByText("andres@otra-familia.dev")).toBeInTheDocument();
    expect(screen.getByText("Andrés")).toBeInTheDocument();
    expect(screen.queryByText("lucia@ejemplo.dev")).toBeNull();
    expect(screen.queryByText("Lucía")).toBeNull();
  });

  /*
   * El orden es parte del requisito: la pantalla responde «¿en qué cuenta
   * estoy?» ANTES de dejar tocar una credencial. Comprobar solo que ambas cosas
   * están en pantalla dejaría pasar la identidad al final del todo, por debajo
   * del cambio de PIN.
   */
  it("y lo dice antes de ofrecer cambiar el PIN", async () => {
    await montarApp("/account", LUCIA);

    const identidad = await screen.findByText("lucia@ejemplo.dev");
    const cambiarPin = screen.getByText(messages.auth.changePinTitle);

    expect(identidad.compareDocumentPosition(cambiarPin)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
  });

  it("y el correo se anuncia como tal a quien escucha la pantalla", async () => {
    await montarApp("/account", LUCIA);

    await screen.findByText("lucia@ejemplo.dev");
    expect(screen.getByText(messages.auth.accountEmailLabel)).toBeInTheDocument();
  });
});
