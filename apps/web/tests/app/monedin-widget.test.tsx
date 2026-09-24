import { act, cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { WIDGET_ROTATION_MS, areaOf } from "../../src/app/widget-lines.js";
import { messages } from "../../src/lib/messages.js";
import { conMovimientoReducido } from "../setup.js";
import { comoNino, comoPadre, montarApp } from "../support/router.js";

afterEach(() => {
  vi.unstubAllGlobals();
});

function widget(): HTMLElement | null {
  return document.querySelector('[data-widget="monedin"] a');
}

describe("se ofrece desde cualquier pantalla", () => {
  it.each([
    ["un niño", comoNino, "/"],
    ["un padre", comoPadre, "/"],
    ["un niño en sus premios", comoNino, "/me/rewards"],
  ])("%s lo ve, y lleva al chat", async (_quien, sesion, destino) => {
    await montarApp(destino, sesion());

    expect(widget()?.getAttribute("href")).toBe("/assistant");
  });

  it('NO expone role="dialog"', async () => {
    await montarApp("/", comoNino());

    expect(widget()).not.toBeNull();
    expect(screen.queryAllByRole("dialog")).toHaveLength(0);
  });

  it("su nombre no es la frase que dice", async () => {
    await montarApp("/", comoNino());

    expect(widget()?.getAttribute("aria-label")).toBe(messages.widget.openChat);
    expect(widget()?.getAttribute("aria-label")).not.toBe(messages.widget.childHomeBalance);
  });
});

describe("no se duplica ni compite", () => {
  it("no aparece en la ayuda, que ya ofrece el chat", async () => {
    await montarApp("/help", comoNino());

    expect(screen.getByRole("heading", { name: messages.help.title })).toBeTruthy();
    expect(widget()).toBeNull();

    expect(screen.getByRole("link", { name: messages.help.askMonedin })).toBeTruthy();
  });

  it("no se monta mientras se está explicando el producto", async () => {
    await montarApp("/", comoNino("Mateo", false));

    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(widget()).toBeNull();
  });

  it("y sí se monta en cuanto el recorrido está visto", async () => {
    await montarApp("/", comoNino("Mateo", true));

    expect(widget()).not.toBeNull();
  });
});

describe("lo que dice depende de dónde está y de quién mira", () => {
  it("el mismo área dice cosas distintas a un padre que a un niño", async () => {
    await montarApp("/me/rewards", comoNino());
    const delNino = widget()?.textContent;

    cleanup();

    await montarApp("/rewards", comoPadre());
    const delPadre = widget()?.textContent;

    expect(delNino).toBeTruthy();
    expect(delPadre).toBeTruthy();
    expect(delNino).not.toBe(delPadre);
  });

  it("las áreas se reparten por PREFIJO, así que las dos formas caen igual", () => {
    expect(areaOf("/me/tasks")).toBe(areaOf("/tasks"));
    expect(areaOf("/rewards/new")).toBe("rewards");
    expect(areaOf("/children/abc/coins")).toBe("children");

    expect(areaOf("/algo-que-no-existe")).toBe("home");
  });
});

describe("la frase se turna, y el reloj no acumula holgura", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  async function avanzar(intervalos: number): Promise<void> {
    await act(async () => {
      vi.advanceTimersByTime(WIDGET_ROTATION_MS * intervalos);
      await Promise.resolve();
    });
  }

  it("con tres frases, tres intervalos vuelven a la primera y el cuarto pasa a la segunda", async () => {
    await montarApp("/", comoNino());

    const primera = widget()?.textContent;
    expect(primera).toBeTruthy();

    await avanzar(1);
    const segunda = widget()?.textContent;
    expect(segunda).not.toBe(primera);

    await avanzar(2);
    expect(widget()?.textContent).toBe(primera);

    await avanzar(1);
    expect(widget()?.textContent).toBe(segunda);
  });

  it("con movimiento reducido no se turna, ni después de diez intervalos", async () => {
    conMovimientoReducido();
    await montarApp("/", comoNino());

    const alLlegar = widget()?.textContent;
    expect(alLlegar).toBeTruthy();

    await avanzar(10);

    expect(widget()?.textContent).toBe(alLlegar);
  });
});

describe("al cambiar de área cambia lo que dice", () => {
  it("cada área trae sus propias frases, sin remontar la aplicación", async () => {
    const app = await montarApp("/", comoNino());

    expect(widget()?.textContent).toBe(messages.widget.childHomeBalance);

    await app.router.navigate({ to: "/me/tasks" });
    expect(widget()?.textContent).toBe(messages.widget.childTasksDo);

    await app.router.navigate({ to: "/me/rewards" });
    expect(widget()?.textContent).toBe(messages.widget.childRewardsChoose);

    await app.router.navigate({ to: "/" });
    expect(widget()?.textContent).toBe(messages.widget.childHomeBalance);
  });
});

describe("el acceso a la ayuda no se mezcla con los destinos de trabajo", () => {
  it.each([
    ["un niño", comoNino],
    ["un padre", comoPadre],
  ])("para %s, la ayuda NO está entre los destinos del cajón", async (_quien, sesion) => {
    await montarApp("/", sesion());

    await userEvent.click(screen.getByRole("button", { name: messages.nav.menu }));
    const cajon = screen.getByRole("navigation", { name: messages.nav.drawerLabel });

    expect(cajon.querySelector('a[href="/help"]')).toBeNull();
  });

  it.each([
    ["un niño", comoNino],
    ["un padre", comoPadre],
  ])("y para %s está en el pie, donde el perfil", async (_quien, sesion) => {
    await montarApp("/", sesion());

    await userEvent.click(screen.getByRole("button", { name: messages.nav.menu }));
    const lateral = screen
      .getByRole("navigation", { name: messages.nav.drawerLabel })
      .closest("[data-collapsed]");

    expect(lateral?.querySelector('a[href="/help"]')).not.toBeNull();
  });
});
