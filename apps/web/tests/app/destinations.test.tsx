import { afterEach, describe, expect, it, vi } from "vitest";
import { comoNino, comoPadre, montarApp } from "../support/router.js";

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
