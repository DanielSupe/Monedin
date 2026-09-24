import { PASSWORD_MIN_LENGTH } from "@monedin/contracts";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PIN_LABEL, messages } from "../../src/lib/messages.js";
import { SIN_SESION, montarApp } from "../support/router.js";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("cada llamada a la acción lleva a lo que anuncia", () => {
  it("«Empezar» lleva al REGISTRO", async () => {
    const user = userEvent.setup();
    const app = await montarApp("/welcome", SIN_SESION);

    await user.click(screen.getAllByRole("link", { name: messages.landing.start })[0]!);

    expect(app.direccion()).toBe("/sign-up");
  });

  it("«Entrar» sigue llevando al ACCESO", async () => {
    const user = userEvent.setup();
    const app = await montarApp("/welcome", SIN_SESION);

    await user.click(screen.getAllByRole("link", { name: messages.landing.signIn })[0]!);

    expect(app.direccion()).toBe("/sign-in");
  });

  it("ningún «Empezar» de la puerta apunta ya al acceso", async () => {
    await montarApp("/welcome", SIN_SESION);

    for (const enlace of screen.getAllByRole("link", { name: messages.landing.start })) {
      expect(enlace).toHaveAttribute("href", "/sign-up");
    }
  });
});

describe("cada ruta enseña su formulario y ninguna alterna", () => {
  it("el acceso pide correo y contraseña, y nada más", async () => {
    await montarApp("/sign-in", SIN_SESION);

    expect(screen.getByLabelText(messages.auth.email)).toBeInTheDocument();
    expect(screen.getByLabelText(messages.auth.password)).toBeInTheDocument();
    expect(screen.queryByLabelText(messages.auth.name)).toBeNull();
    expect(screen.queryByLabelText(PIN_LABEL)).toBeNull();
  });

  it("el registro pide además el nombre y el PIN", async () => {
    await montarApp("/sign-up", SIN_SESION);

    expect(screen.getByLabelText(messages.auth.name)).toBeInTheDocument();
    expect(screen.getByLabelText(PIN_LABEL)).toBeInTheDocument();
  });

  it("desde el acceso se llega al registro por un ENLACE, no por un botón", async () => {
    const user = userEvent.setup();
    const app = await montarApp("/sign-in", SIN_SESION);

    await user.click(screen.getByRole("link", { name: messages.auth.toSignUp }));

    expect(app.direccion()).toBe("/sign-up");
  });

  it("y desde el registro se vuelve al acceso igual", async () => {
    const user = userEvent.setup();
    const app = await montarApp("/sign-up", SIN_SESION);

    await user.click(screen.getByRole("link", { name: messages.auth.toSignIn }));

    expect(app.direccion()).toBe("/sign-in");
  });

  it("atrás desde el registro vuelve a la puerta, no saca de la aplicación", async () => {
    const user = userEvent.setup();
    const app = await montarApp("/welcome", SIN_SESION);

    await user.click(screen.getAllByRole("link", { name: messages.landing.start })[0]!);
    expect(app.direccion()).toBe("/sign-up");

    app.router.history.back();
    await vi.waitFor(() => {
      expect(app.direccion()).toBe("/welcome");
    });
  });
});

describe("el formulario dice lo que exige antes de rechazarlo", () => {
  it("el mínimo de la contraseña se ve sin haber enviado nada", async () => {
    await montarApp("/sign-up", SIN_SESION);

    const campo = screen.getByLabelText(messages.auth.password);
    const ayuda = campo.getAttribute("aria-describedby");
    expect(ayuda).not.toBeNull();

    expect(document.getElementById(ayuda ?? "")).toHaveTextContent(String(PASSWORD_MIN_LENGTH));
  });

  it("se explica para qué sirve cada una de las dos credenciales", async () => {
    await montarApp("/sign-up", SIN_SESION);

    expect(screen.getByText(messages.auth.twoKeysTitle)).toBeInTheDocument();
  });
});

describe("el disco del ciclo", () => {
  it("se anuncia como una sola imagen con su descripción", async () => {
    await montarApp("/sign-in", SIN_SESION);

    const disco = screen.getByRole("img", { name: messages.auth.accessDiscLabel });
    expect(within(disco).queryAllByRole("img")).toHaveLength(0);
  });

  it("el giro está bajo `motion-safe`, en el aro y en cada pieza", async () => {
    await montarApp("/sign-in", SIN_SESION);

    const disco = screen.getByRole("img", { name: messages.auth.accessDiscLabel });

    for (const animado of disco.querySelectorAll('[class*="animate-disc"]')) {
      expect(animado.className).toMatch(/motion-safe:animate-disc/);
      expect(animado.className).not.toMatch(/(?<!motion-safe:)animate-disc/);
    }

    expect(disco.querySelectorAll('[class*="animate-disc"]').length).toBeGreaterThan(1);
  });
});
