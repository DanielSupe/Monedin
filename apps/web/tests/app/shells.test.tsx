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

/*
 * SONDEO CAMBIADO en `add-sidebar-nav`, y conviene saber por qué.
 *
 * Estos tests buscaban el `<nav>` de cada rol —la barra de la cabecera del padre
 * y la inferior del niño—. Esas dos barras ya no existen: hay UNA navegación,
 * dentro de un cajón, que no está en el DOM mientras está cerrado.
 *
 * Lo que estos tests protegen —que cada rol reciba SU marco, con SU escala— no
 * cambia; lo que cambia es dónde se mide. Se mide en la escala y en el botón de
 * menú, que es lo que ahora persiste. Que la navegación esté completa y sea una
 * sola lo comprueba `sidebar.test.tsx`.
 */
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

  /*
   * ESTA PRUEBA VA POR SU TERCERA REDACCIÓN, y las tres veces por lo mismo: se
   * escribía con la forma de la respuesta de entonces en vez de con lo que se
   * quiere garantizar.
   *
   * Decía «antes de tener un rol NO hay marco» —falso desde `add-entry-frame`,
   * que añadió el tercero—. Después decía «no declara escala» —falso desde
   * `tune-scale-to-mockups`, que le dio la suya al medir que sus maquetas
   * escriben un paso por encima de las del padre—.
   *
   * Lo que se quiere garantizar no ha cambiado nunca: por el camino de entrada
   * no se cuela NI el marco del padre NI el del niño. Así que eso es lo que
   * afirma, y por eso nombra las dos escalas en vez de esperar un valor
   * concreto: una escala nueva no la vuelve a romper.
   */
  it("antes de tener un rol no se cuela el marco de ninguno de los dos", async () => {
    await montarApp("/profiles", SOLO_CUENTA);

    expect(escala()).not.toBe("parent");
    expect(escala()).not.toBe("child");
    expect(screen.queryByRole("button", { name: messages.nav.menu })).toBeNull();
  });

  /*
   * Y la escala que sí declara, comprobada aparte: si no, la prueba de arriba
   * pasaría igual con el atributo borrado, que es exactamente el defecto que
   * este change vino a arreglar.
   */
  it("y el de entrada declara la suya", async () => {
    await montarApp("/profiles", SOLO_CUENTA);

    expect(escala()).toBe("entry");
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

    // `Logo` es lo único que expone la marca como imagen con nombre. Un `<span>`
    // con el título no tiene rol, así que esto falla en cuanto alguien vuelva a
    // escribirlo a mano.
    expect(screen.getByRole("img", { name: messages.app.title })).toBeInTheDocument();
  });
});

describe("el marco sobrevive a la navegación", () => {
  /*
   * Antes se medía sobre la barra inferior del niño. Esa barra se fue en
   * `add-sidebar-nav` y su navegación vive dentro de un cajón, que a propósito
   * SÍ se desmonta —se cierra al llegar—. Así que el sondeo pasa al botón de
   * menú, que es lo que ahora persiste en la cabecera.
   *
   * La intención es la misma y no se ha ablandado: lo que no puede pasar es que
   * el marco se reconstruya en cada toque.
   */
  it("el menú del marco sigue siendo el MISMO nodo tras cambiar de destino", async () => {
    const app = await montarApp("/", comoNino());

    const antes = screen.getByRole("button", { name: messages.nav.menu });

    await app.router.navigate({ to: "/me/tasks" });
    await app.router.invalidate();

    const despues = screen.getByRole("button", { name: messages.nav.menu });

    // Idéntico nodo, no uno equivalente.
    expect(despues).toBe(antes);
  });
});
