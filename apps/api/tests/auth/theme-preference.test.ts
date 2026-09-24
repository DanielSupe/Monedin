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

async function temaDe(cookies: string[]): Promise<string> {
  const response = await request(app).get(`${API_PREFIX}/auth/session`).set("Cookie", cookies);

  return response.body.actor.theme as string;
}

function cambiar(cookies: string[], theme: string) {
  return request(app).patch(`${API_PREFIX}/auth/theme`).set("Cookie", cookies).send({ theme });
}

describe("cada perfil tiene su tema", () => {
  it("un perfil recién creado sigue al sistema", async () => {
    const { cookies, hijos } = await familiaOperando(app, ["Mateo"]);

    expect(await temaDe(cookies)).toBe("SYSTEM");
    expect(await temaDe(hijos[0]!.cookies)).toBe("SYSTEM");
  }, 120_000);

  it("el padre elige el suyo y su sesión lo refleja", async () => {
    const { cookies } = await familiaOperando(app, ["Mateo"]);

    await cambiar(cookies, "DARK").expect(204);

    expect(await temaDe(cookies)).toBe("DARK");
  }, 120_000);

  it("un niño elige el suyo y su sesión lo refleja", async () => {
    const { hijos } = await familiaOperando(app, ["Mateo"]);

    await cambiar(hijos[0]!.cookies, "LIGHT").expect(204);

    expect(await temaDe(hijos[0]!.cookies)).toBe("LIGHT");
  }, 120_000);

  it("y volver a seguir al sistema también se guarda", async () => {
    const { hijos } = await familiaOperando(app, ["Mateo"]);

    await cambiar(hijos[0]!.cookies, "DARK").expect(204);
    await cambiar(hijos[0]!.cookies, "SYSTEM").expect(204);

    expect(await temaDe(hijos[0]!.cookies)).toBe("SYSTEM");
  }, 120_000);
});

describe("el tema de uno no arrastra a los demás", () => {
  it("un niño elige el suyo y el de su hermano NO cambia", async () => {
    const { hijos } = await familiaOperando(app, ["Mateo", "Emma"]);

    await cambiar(hijos[0]!.cookies, "DARK").expect(204);

    expect(await temaDe(hijos[0]!.cookies)).toBe("DARK");
    expect(await temaDe(hijos[1]!.cookies)).toBe("SYSTEM");
  }, 120_000);

  it("y el del padre tampoco cambia porque un hijo elija el suyo", async () => {
    const { cookies, hijos } = await familiaOperando(app, ["Mateo"]);

    await cambiar(hijos[0]!.cookies, "DARK").expect(204);

    expect(await temaDe(cookies)).toBe("SYSTEM");
  }, 120_000);

  it("ni al revés", async () => {
    const { cookies, hijos } = await familiaOperando(app, ["Mateo"]);

    await cambiar(cookies, "LIGHT").expect(204);

    expect(await temaDe(hijos[0]!.cookies)).toBe("SYSTEM");
  }, 120_000);
});

describe("la ruta exige actor y valida lo que recibe", () => {
  it("con la cuenta acreditada y sin perfil activo, no vale", async () => {
    const { cookies } = await familiaOperando(app, ["Mateo"]);

    await request(app).post(`${API_PREFIX}/auth/profiles/leave`).set("Cookie", cookies);

    await cambiar(cookies, "DARK").expect(401);
  }, 120_000);

  it("un valor que no es ninguno de los tres es 422, no el de por defecto", async () => {
    const { hijos } = await familiaOperando(app, ["Mateo"]);

    await cambiar(hijos[0]!.cookies, "MORADO").expect(422);

    expect(await temaDe(hijos[0]!.cookies)).toBe("SYSTEM");
  }, 120_000);

  it("un campo que el esquema no conoce también es 422", async () => {
    const { hijos } = await familiaOperando(app, ["Mateo"]);

    await request(app)
      .patch(`${API_PREFIX}/auth/theme`)
      .set("Cookie", hijos[0]!.cookies)
      .send({ theme: "DARK", paraTodos: true })
      .expect(422);

    expect(await temaDe(hijos[0]!.cookies)).toBe("SYSTEM");
  }, 120_000);
});
