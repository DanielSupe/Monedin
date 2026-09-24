import { screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { messages } from "../../src/lib/messages.js";
import { SIN_SESION, SOLO_CUENTA, comoNino, comoPadre, montarApp } from "../support/router.js";

afterEach(() => {
  vi.unstubAllGlobals();
});

function escala(): string | null {
  return document.querySelector("[data-scale]")?.getAttribute("data-scale") ?? null;
}

describe("cada rol recibe su marco", () => {
  it("el niño recibe la escala del niño, con su menú", async () => {
    await montarApp("/", comoNino());

    expect(screen.getByRole("button", { name: messages.nav.menu })).toBeInTheDocument();
    expect(escala()).toBe("child");
  });

  it("el padre recibe la escala del padre, con su menú", async () => {
    await montarApp("/", comoPadre());

    expect(screen.getByRole("button", { name: messages.nav.menu })).toBeInTheDocument();
    expect(escala()).toBe("parent");
  });

  it("ninguno ve el marco del otro", async () => {
    await montarApp("/", comoNino());

    expect(escala()).not.toBe("parent");
  });

  it("antes de tener un rol no se cuela el marco de ninguno de los dos", async () => {
    await montarApp("/profiles", SOLO_CUENTA);

    expect(escala()).not.toBe("parent");
    expect(escala()).not.toBe("child");
    expect(screen.queryByRole("button", { name: messages.nav.menu })).toBeNull();
  });

  it("y el de entrada declara la suya", async () => {
    await montarApp("/profiles", SOLO_CUENTA);

    expect(escala()).toBe("entry");
  });
});

describe("las pantallas de entrada llevan la marca", () => {
  it.each([["/profiles"], ["/sign-in"], ["/profiles/new"], ["/profiles/reset-pin"]])(
    "%s la muestra",
    async (destino) => {
      await montarApp(destino, destino === "/sign-in" ? SIN_SESION : SOLO_CUENTA);

      expect(screen.getByRole("img", { name: messages.app.title })).toBeInTheDocument();
    },
  );

  it("la puerta pública no recibe el marco: una sola marca", async () => {
    await montarApp("/welcome", SIN_SESION);

    expect(screen.getAllByRole("img", { name: messages.app.title })).toHaveLength(1);
  });

  it("con actor manda el marco del rol, no el de entrada", async () => {
    await montarApp("/", comoPadre());

    expect(screen.getByRole("button", { name: messages.nav.menu })).toBeInTheDocument();
    expect(escala()).toBe("parent");
  });
});

describe("la marca sale de la pieza, no de texto suelto", () => {
  it.each([
    ["el niño", comoNino],
    ["el padre", comoPadre],
  ])("el marco %s la rinde desde `Logo`", async (_quien, sesion) => {
    await montarApp("/", sesion());

    expect(screen.getByRole("img", { name: messages.app.title })).toBeInTheDocument();
  });
});

describe("el marco sobrevive a la navegación", () => {
  it("el menú del marco sigue siendo el MISMO nodo tras cambiar de destino", async () => {
    const app = await montarApp("/", comoNino());

    const antes = screen.getByRole("button", { name: messages.nav.menu });

    await app.router.navigate({ to: "/me/tasks" });
    await app.router.invalidate();

    const despues = screen.getByRole("button", { name: messages.nav.menu });

    expect(despues).toBe(antes);
  });
});
