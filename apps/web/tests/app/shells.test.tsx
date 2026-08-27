import { screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { messages } from "../../src/lib/messages.js";
import { SOLO_CUENTA, comoNino, comoPadre, montarApp } from "../support/router.js";

afterEach(() => {
  vi.unstubAllGlobals();
});

/** El contenedor que declara la escala, que es lo que el marco existe para poner. */
function escala(): string | null {
  return document.querySelector("[data-scale]")?.getAttribute("data-scale") ?? null;
}

describe("cada rol recibe su marco", () => {
  it("el niño ve su barra de destinos, con la escala del niño", async () => {
    await montarApp("/", comoNino());

    expect(screen.getByRole("navigation", { name: messages.nav.childNavLabel })).toBeInTheDocument();
    expect(escala()).toBe("child");
  });

  it("el padre ve su cabecera, con la escala del padre", async () => {
    await montarApp("/", comoPadre());

    expect(
      screen.getByRole("navigation", { name: messages.nav.parentNavLabel }),
    ).toBeInTheDocument();
    expect(escala()).toBe("parent");
  });

  it("ninguno ve el marco del otro", async () => {
    await montarApp("/", comoNino());

    expect(screen.queryByRole("navigation", { name: messages.nav.parentNavLabel })).toBeNull();
  });

  it("antes de tener un rol no hay marco: todavía no se sabe de quién sería", async () => {
    await montarApp("/profiles", SOLO_CUENTA);

    expect(escala()).toBeNull();
    expect(screen.queryByRole("navigation", { name: messages.nav.childNavLabel })).toBeNull();
  });
});

describe("el marco sobrevive a la navegación", () => {
  it("la barra del niño sigue siendo el MISMO nodo tras cambiar de destino", async () => {
    const app = await montarApp("/", comoNino());

    const antes = screen.getByRole("navigation", { name: messages.nav.childNavLabel });

    await app.router.navigate({ to: "/me/tasks" });
    await app.router.invalidate();

    const despues = screen.getByRole("navigation", { name: messages.nav.childNavLabel });

    // Idéntico nodo, no uno equivalente: si el marco se remontara, la barra
    // parpadearía en cada toque.
    expect(despues).toBe(antes);
  });
});
