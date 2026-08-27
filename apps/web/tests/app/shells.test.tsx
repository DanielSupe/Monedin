import { screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { messages } from "../../src/lib/messages.js";
import { SIN_SESION, SOLO_CUENTA, comoNino, comoPadre, montarApp } from "../support/router.js";

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

  /*
   * Esta prueba decía «antes de tener un rol NO hay marco». Dejó de ser cierto
   * en `add-entry-frame`: hay un tercer marco, el de entrada. Lo que sigue
   * siendo cierto —y es lo que hay que sostener— es que no declara escala,
   * porque la escala la elige la audiencia y aquí todavía no se sabe quién está
   * delante.
   */
  it("antes de tener un rol hay marco de entrada, pero sin escala", async () => {
    await montarApp("/profiles", SOLO_CUENTA);

    expect(escala()).toBeNull();
    expect(screen.queryByRole("navigation", { name: messages.nav.childNavLabel })).toBeNull();
    expect(screen.queryByRole("navigation", { name: messages.nav.parentNavLabel })).toBeNull();
  });
});

/**
 * El marco de las pantallas previas a tener un rol.
 *
 * Antes caían en un contenedor de lectura sin marca: se entraba por una página
 * con logo, se pasaba por cuatro pantallas anónimas, y el logo volvía al final.
 */
describe("las pantallas de entrada llevan la marca", () => {
  it.each([["/profiles"], ["/sign-in"], ["/profiles/new"], ["/profiles/reset-pin"]])(
    "%s la muestra",
    async (destino) => {
      await montarApp(destino, destino === "/sign-in" ? SIN_SESION : SOLO_CUENTA);

      expect(screen.getByRole("img", { name: messages.app.title })).toBeInTheDocument();
    },
  );

  /*
   * La puerta pública pide ancho completo y trae su propio encabezado. Si
   * recibiera además el marco de entrada saldrían DOS marcas en la misma
   * pantalla, que es justo lo que `fullBleed` existe para evitar.
   */
  it("la puerta pública no recibe el marco: una sola marca", async () => {
    await montarApp("/welcome", SIN_SESION);

    expect(screen.getAllByRole("img", { name: messages.app.title })).toHaveLength(1);
  });

  it("con actor manda el marco del rol, no el de entrada", async () => {
    await montarApp("/", comoPadre());

    expect(
      screen.getByRole("navigation", { name: messages.nav.parentNavLabel }),
    ).toBeInTheDocument();
    expect(escala()).toBe("parent");
  });
});

describe("la marca sale de la pieza, no de texto suelto", () => {
  it.each([
    ["el niño", comoNino],
    ["el padre", comoPadre],
  ])("el marco %s la rinde desde `Logo`", async (_quien, sesion) => {
    await montarApp("/", sesion());

    // `Logo` es lo único que expone la marca como imagen con nombre. Un `<span>`
    // con el título no tiene rol, así que esto falla en cuanto alguien vuelva a
    // escribirlo a mano.
    expect(screen.getByRole("img", { name: messages.app.title })).toBeInTheDocument();
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
