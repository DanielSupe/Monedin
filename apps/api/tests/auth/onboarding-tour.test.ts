import { API_PREFIX } from "@monedin/contracts";
import request from "supertest";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../../src/app.js";
import { resetAuthData } from "../support/auth.js";
import { familiaOperando } from "../support/tasks.js";

const app = createApp();

beforeEach(async () => {
  await resetAuthData();
});

afterAll(async () => {
  await resetAuthData();
});

/** Si el estado de la sesión dice que a ese perfil ya se le explicó. */
async function yaLoVio(cookies: string[]): Promise<boolean> {
  const response = await request(app).get(`${API_PREFIX}/auth/session`).set("Cookie", cookies);

  return response.body.actor.tutorialSeen as boolean;
}

function marcar(cookies: string[], seen: boolean) {
  return request(app).patch(`${API_PREFIX}/auth/tutorial`).set("Cookie", cookies).send({ seen });
}

/**
 * A quién se le explicó sale del ACTOR y nunca de la petición.
 *
 * Es lo que hace imposible por construcción que un niño marque el de su
 * hermano: no hay parámetro que pudiera apuntar a otro perfil.
 */
describe("marcar el recorrido como visto", () => {
  it("un perfil recién creado todavía no lo ha visto", async () => {
    const { cookies, hijos } = await familiaOperando(app, ["Mateo"]);

    expect(await yaLoVio(cookies)).toBe(false);
    expect(await yaLoVio(hijos[0]!.cookies)).toBe(false);
  }, 120_000);

  it("el padre lo marca y su sesión lo refleja", async () => {
    const { cookies } = await familiaOperando(app, ["Mateo"]);

    await marcar(cookies, true).expect(204);

    expect(await yaLoVio(cookies)).toBe(true);
  }, 120_000);

  it("un niño lo marca y su sesión lo refleja", async () => {
    const { hijos } = await familiaOperando(app, ["Mateo"]);

    await marcar(hijos[0]!.cookies, true).expect(204);

    expect(await yaLoVio(hijos[0]!.cookies)).toBe(true);
  }, 120_000);

  /*
   * No mueve dinero ni cambia de estado, así que dos toques dejan lo mismo. Se
   * dice con un test para que nadie le añada la ceremonia de una transición
   * condicional, que aquí no hace falta.
   */
  it("marcarlo dos veces deja lo mismo, sin conflicto", async () => {
    const { cookies } = await familiaOperando(app, ["Mateo"]);

    await marcar(cookies, true).expect(204);
    await marcar(cookies, true).expect(204);

    expect(await yaLoVio(cookies)).toBe(true);
  }, 120_000);

  /*
   * LOS DOS LADOS.
   *
   * Comprobar solo que el suyo queda marcado pasaría con una implementación que
   * los marcara todos, que es exactamente el defecto que este test persigue.
   */
  it("un niño marca el suyo, y el de su hermano NO cambia", async () => {
    const { hijos } = await familiaOperando(app, ["Mateo", "Emma"]);
    const [mateo, emma] = hijos;

    await marcar(mateo!.cookies, true).expect(204);

    expect(await yaLoVio(mateo!.cookies)).toBe(true);
    expect(await yaLoVio(emma!.cookies)).toBe(false);
  }, 180_000);

  it("y el del padre tampoco cambia porque un hijo marque el suyo", async () => {
    const { cookies, hijos } = await familiaOperando(app, ["Mateo"]);

    await marcar(hijos[0]!.cookies, true).expect(204);

    expect(await yaLoVio(cookies)).toBe(false);
  }, 120_000);
});

describe("volver a verlo", () => {
  it("desmarcarlo lo devuelve a no visto", async () => {
    const { cookies } = await familiaOperando(app, ["Mateo"]);

    await marcar(cookies, true).expect(204);
    await marcar(cookies, false).expect(204);

    expect(await yaLoVio(cookies)).toBe(false);
  }, 120_000);

  it("y solo al perfil que lo pide", async () => {
    const { hijos } = await familiaOperando(app, ["Mateo", "Emma"]);
    const [mateo, emma] = hijos;

    await marcar(mateo!.cookies, true).expect(204);
    await marcar(emma!.cookies, true).expect(204);
    await marcar(mateo!.cookies, false).expect(204);

    expect(await yaLoVio(mateo!.cookies)).toBe(false);
    expect(await yaLoVio(emma!.cookies)).toBe(true);
  }, 180_000);
});

describe("la ruta exige actor, como cualquier otra", () => {
  it("con la cuenta acreditada y sin perfil activo, no vale", async () => {
    const { accountCookies } = await familiaOperando(app, ["Mateo"]);

    const response = await request(app)
      .patch(`${API_PREFIX}/auth/tutorial`)
      .set("Cookie", accountCookies)
      .send({ seen: true });

    expect(response.status).toBe(401);
  }, 120_000);

  it("un cuerpo con un campo de más es entrada inválida", async () => {
    const { cookies } = await familiaOperando(app, ["Mateo"]);

    const response = await request(app)
      .patch(`${API_PREFIX}/auth/tutorial`)
      .set("Cookie", cookies)
      .send({ seen: true, childProfileId: "otro" });

    expect(response.status).toBe(422);
  }, 120_000);
});
