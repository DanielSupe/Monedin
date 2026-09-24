import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { messages } from "../../src/lib/messages.js";
import { comoNino, comoPadre, montarApp } from "../support/router.js";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("cada rol ve su propio inicio", () => {
  it("un niño ve el suyo", async () => {
    await montarApp("/", comoNino());

    expect(await screen.findByText(messages.children.homeBalanceLabel)).toBeInTheDocument();
    expect(screen.queryByText(messages.children.title)).toBeNull();
  });

  it("un padre ve el suyo, y no el del niño", async () => {
    await montarApp("/", comoPadre());

    expect(await screen.findByText(messages.parents.pendingTitle)).toBeInTheDocument();
    expect(screen.queryByText(messages.children.homeBalanceLabel)).toBeNull();
  });
});

describe("el saldo del niño", () => {
  it("se anuncia con su unidad y no como un número suelto", async () => {
    await montarApp("/", comoNino());

    expect(await screen.findByLabelText(/120\s+monedas/)).toBeInTheDocument();
  });

  it("va dentro de la escala del niño", async () => {
    await montarApp("/", comoNino());

    await screen.findByText(messages.children.homeBalanceLabel);
    expect(document.querySelector('[data-scale="child"]')).not.toBeNull();
  });
});

describe("los destinos del niño", () => {
  const DESTINOS = [
    [messages.tasks.myTasksTitle, "/me/tasks"],
    [messages.rewards.myRewardsTitle, "/me/rewards"],
    [messages.redemptions.myRedemptionsTitle, "/me/redemptions"],
    [messages.children.myProfileTitle, "/me/settings"],
  ] as const;

  it.each(DESTINOS)("«%s» lleva a %s", async (nombre, destino) => {
    const user = userEvent.setup();
    const app = await montarApp("/", comoNino());

    const pantalla = within(await screen.findByRole("main"));
    await user.click(pantalla.getByRole("link", { name: nombre }));

    expect(app.direccion()).toBe(destino);
  });

  it("cada acceso es una sola cosa interactiva", async () => {
    await montarApp("/", comoNino());

    const pantalla = within(await screen.findByRole("main"));

    for (const [nombre] of DESTINOS) {
      const tarjeta = pantalla.getByRole("link", { name: nombre });

      expect(within(tarjeta).queryByRole("link")).toBeNull();
      expect(within(tarjeta).queryByRole("button")).toBeNull();
    }
  });
});
