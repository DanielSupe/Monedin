import { screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { messages } from "../../src/lib/messages.js";
import { SIN_SESION, SOLO_CUENTA, comoPadre, montarApp } from "../support/router.js";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("una dirección que no existe", () => {
  it("se dice, y con salida", async () => {
    await montarApp("/loquesea", comoPadre());

    expect(screen.getByText(messages.nav.notFoundTitle)).toBeInTheDocument();

    // Sin salida, quien llega aquí en una tablet no tiene barra de direcciones
    // a mano para corregirlo. Y es un BOTÓN que navega, no un enlace envolviendo
    // un botón: eso anida dos elementos interactivos y un lector de pantalla
    // anuncia un enlace que contiene un botón.
    expect(screen.getByRole("button", { name: messages.nav.notFoundBack })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: messages.nav.notFoundBack })).toBeNull();
  });
});

describe("las guardas deciden antes de pintar", () => {
  it("sin sesión, cualquier destino acaba en el acceso", async () => {
    const app = await montarApp("/tasks", SIN_SESION);

    expect(app.direccion()).toBe("/sign-in");
  });

  it("con cuenta y sin perfil, un destino que exige actor acaba en la rejilla", async () => {
    const app = await montarApp("/tasks", SOLO_CUENTA);

    expect(app.direccion()).toBe("/profiles");
  });

  it("con cuenta y sin perfil, la rejilla sí se puede ver", async () => {
    const app = await montarApp("/profiles", SOLO_CUENTA);

    expect(app.direccion()).toBe("/profiles");
  });

  it("sin sesión, la rejilla manda al acceso", async () => {
    const app = await montarApp("/profiles", SIN_SESION);

    expect(app.direccion()).toBe("/sign-in");
  });

  it("a quien ya tiene perfil no se le enseña el acceso", async () => {
    const app = await montarApp("/sign-in", comoPadre());

    expect(app.direccion()).toBe("/");
  });

  it("a quien tiene cuenta y no perfil, el acceso lo manda a la rejilla y no al inicio", async () => {
    // No basta con «si hay actor, fuera»: este estado pertenece a la rejilla.
    const app = await montarApp("/sign-in", SOLO_CUENTA);

    expect(app.direccion()).toBe("/profiles");
  });
});
