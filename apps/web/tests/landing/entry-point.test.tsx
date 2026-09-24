import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { messages } from "../../src/lib/messages.js";
import { SIN_SESION, SOLO_CUENTA, comoNino, comoPadre, montarApp } from "../support/router.js";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("sin sesión, todo lleva a la puerta pública", () => {
  it.each(["/", "/tasks", "/me/tasks", "/profiles", "/children", "/account"])(
    "%s acaba en /welcome",
    async (destino) => {
      const app = await montarApp(destino, SIN_SESION);

      expect(app.direccion()).toBe("/welcome");
    },
  );
});

describe("quien ya entró no vuelve a la puerta", () => {
  it("un padre en su inicio se queda ahí", async () => {
    const app = await montarApp("/", comoPadre());

    expect(app.direccion()).toBe("/");
  });

  it("un niño en su inicio se queda ahí", async () => {
    const app = await montarApp("/", comoNino());

    expect(app.direccion()).toBe("/");
  });

  it("con cuenta y sin perfil se va a la rejilla, no a la puerta", async () => {
    const app = await montarApp("/tasks", SOLO_CUENTA);

    expect(app.direccion()).toBe("/profiles");
  });
});

describe("el camino de vuelta a la pantalla de acceso", () => {
  it("desde la puerta pública se llega a entrar", async () => {
    const user = userEvent.setup();
    const app = await montarApp("/welcome", SIN_SESION);

    await user.click(screen.getAllByRole("link", { name: messages.landing.signIn })[0]!);

    expect(app.direccion()).toBe("/sign-in");
  });

  it("y la pantalla de acceso no rebota de vuelta a la puerta", async () => {
    const app = await montarApp("/sign-in", SIN_SESION);

    expect(app.direccion()).toBe("/sign-in");
  });
});
