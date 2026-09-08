import { afterEach, describe, expect, it, vi } from "vitest";
import { SOLO_CUENTA, comoNino, comoPadre, montarApp } from "../support/router.js";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("el niño tiene destinos propios", () => {
  it.each(["/me/tasks", "/me/rewards", "/me/redemptions", "/me/settings"])(
    "%s es suyo y se queda ahí",
    async (destino) => {
      const app = await montarApp(destino, comoNino());

      expect(app.direccion()).toBe(destino);
    },
  );

  /**
   * El defecto que este change existe para arreglar.
   *
   * Antes, las cuatro pantallas del niño vivían dentro de `/` con booleanos, así
   * que su historial tenía UNA entrada: pulsar atrás salía de Monedín.
   */
  it("volver atrás devuelve a la pantalla anterior, no fuera de la aplicación", async () => {
    const app = await montarApp("/", comoNino());

    await app.router.navigate({ to: "/me/tasks" });
    expect(app.direccion()).toBe("/me/tasks");

    await app.router.navigate({ to: "/me/rewards" });
    expect(app.direccion()).toBe("/me/rewards");

    app.router.history.back();
    await app.router.invalidate();
    expect(app.direccion()).toBe("/me/tasks");

    app.router.history.back();
    await app.router.invalidate();
    expect(app.direccion()).toBe("/");
  });
});

describe("el rol equivocado no se queda parado donde no le toca", () => {
  it.each(["/tasks", "/rewards", "/children", "/redemptions", "/account"])(
    "un niño en %s acaba en su propio inicio",
    async (destino) => {
      const app = await montarApp(destino, comoNino());

      expect(app.direccion()).toBe("/");
    },
  );

  it.each(["/me/tasks", "/me/rewards", "/me/redemptions", "/me/settings"])(
    "un padre en %s acaba en su propio inicio",
    async (destino) => {
      const app = await montarApp(destino, comoPadre());

      expect(app.direccion()).toBe("/");
    },
  );
});

/**
 * `/assistant` es el PRIMER destino compartido por los dos roles.
 *
 * Hasta `add-family-assistant`, las dos listas de arriba eran excluyentes: todo
 * destino pertenecía a uno de los dos y el otro rebotaba a su inicio. Este no
 * pertenece a ninguno, y por eso no cabía en ninguna de las dos.
 *
 * Y el caso NEGATIVO importa tanto como el positivo: si la ruta se hubiera
 * guardado con `requireParent`, el niño acabaría en `/` y esa mitad lo caza.
 */
describe("hay destinos que son de los dos roles", () => {
  it.each([
    ["un niño en /assistant", comoNino, "/assistant"],
    ["un padre en /assistant", comoPadre, "/assistant"],
    ["un niño en /help", comoNino, "/help"],
    ["un padre en /help", comoPadre, "/help"],
  ])("%s llega y se queda ahí", async (_quien, sesion, destino) => {
    const app = await montarApp(destino, sesion());

    expect(app.direccion()).toBe(destino);
  });

  it.each(["/assistant", "/help"])(
    "sin perfil elegido NO se llega a %s: se pide antes ser alguien",
    async (destino) => {
      const app = await montarApp(destino, SOLO_CUENTA);

      expect(app.direccion()).toBe("/profiles");
    },
  );
});
