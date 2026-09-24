import { type SessionState } from "@monedin/contracts";
import { cleanup, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { messages } from "../../src/lib/messages.js";
import { montarApp } from "../support/router.js";

afterEach(() => {
  vi.unstubAllGlobals();
});

function padre(name: string, email: string): SessionState {
  return {
    hasAccount: true,

    actor: {
      familyRole: "PARENT",
      id: `padre-${email}`,
      name,
      email,
      avatar: "https://almacen.ejemplo.dev/avatars/parents/p1/foto.jpg",
      tutorialSeen: true,
      theme: "SYSTEM" as const,
    },
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

  it("y lo dice antes de ofrecer cambiar el PIN", async () => {
    await montarApp("/account", LUCIA);

    const identidad = await screen.findByText("lucia@ejemplo.dev");
    const cambiarPin = screen.getByText(messages.auth.changePinTitle);

    expect(identidad.compareDocumentPosition(cambiarPin)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
  });

  it("y su avatar se enseña UNA sola vez", async () => {
    await montarApp("/account", LUCIA);
    await screen.findByText("lucia@ejemplo.dev");

    const cuenta = screen.getByRole("heading", { name: messages.nav.parentAccount })
      .closest("section") as HTMLElement;

    expect(within(cuenta).getAllByRole("img")).toHaveLength(1);
  });

  it("y ofrece las dos formas de cambiarlo: el catálogo y una foto", async () => {
    await montarApp("/account", LUCIA);

    expect(await screen.findByRole("button", { name: "koala" })).toBeInTheDocument();
    expect(screen.getByText(messages.uploads.choose)).toBeInTheDocument();
  });

  it("y el correo se anuncia como tal a quien escucha la pantalla", async () => {
    await montarApp("/account", LUCIA);

    await screen.findByText("lucia@ejemplo.dev");
    expect(screen.getByText(messages.auth.accountEmailLabel)).toBeInTheDocument();
  });
});
