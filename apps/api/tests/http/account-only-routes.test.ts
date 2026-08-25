import { API_PREFIX } from "@monedin/contracts";
import request from "supertest";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../../src/app.js";
import { declaredRoutesOf } from "../../src/shared/http/module-router.js";
import { asChild, asParent, resetAuthData } from "../support/auth.js";

// Importar la app arrastra todos los archivos de rutas, que es lo que llena el
// registro. Sin esto el registro estaría vacío y el test pasaría en falso.
const app = createApp();

beforeEach(async () => {
  await resetAuthData();
});

afterAll(async () => {
  await resetAuthData();
});

/**
 * La lista cerrada de rutas que se conforman con la CUENTA acreditada.
 *
 * Cada una es un hueco por el que se opera sin haber elegido perfil, así que
 * ninguna se añade sin pensarlo. Si este test falla porque apareció una sexta,
 * la pregunta no es «cómo arreglo el test» sino «por qué esa ruta no puede
 * exigir actor».
 */
const ESPERADAS = [
  "GET /auth/profiles",
  "POST /auth/profiles/enter",
  "POST /auth/profiles/leave",
  "POST /auth/pin/reset",
  "POST /children",
] as const;

/** Las públicas, que ni siquiera exigen cuenta. También cerradas. */
const PUBLICAS_ESPERADAS = [
  "GET /health",
  "POST /auth/register",
  "POST /auth/login",
  "GET /auth/session",
  "POST /auth/logout",
] as const;

function firmar(route: { method: string; path: string }): string {
  return `${route.method} ${route.path}`;
}

describe("la lista de rutas de solo cuenta es cerrada y verificable", () => {
  it("son exactamente las declaradas, ni una más", () => {
    const declaradas = declaredRoutesOf("account").map(firmar);

    expect(declaradas.sort()).toEqual([...ESPERADAS].sort());
  });

  it("las públicas también son exactamente las declaradas", () => {
    const declaradas = declaredRoutesOf("public").map(firmar);

    expect(declaradas.sort()).toEqual([...PUBLICAS_ESPERADAS].sort());
  });

  it("ninguna ruta de solo cuenta toca monedas, tareas, premios ni canjes", () => {
    // Lo que hace tolerable que estas rutas no exijan perfil es que ninguna
    // opera sobre el dinero de nadie.
    const prohibido = /\/(tasks|rewards|redemptions|coins|transactions)/;

    for (const route of declaredRoutesOf("account")) {
      expect(route.path, firmar(route)).not.toMatch(prohibido);
    }
  });
});

describe("qué se puede hacer con solo la cuenta acreditada", () => {
  it("las rutas de solo cuenta se atienden sin perfil elegido", async () => {
    const { accountCookies } = await asParent(app);

    await request(app).get(`${API_PREFIX}/auth/profiles`).set("Cookie", accountCookies).expect(200);
    await request(app)
      .post(`${API_PREFIX}/children`)
      .set("Cookie", accountCookies)
      .send({ name: "Mateo", pin: "1234" })
      .expect(201);
  }, 120_000);

  it("una ruta que exige actor se rechaza con solo la cuenta", async () => {
    const { accountCookies } = await asParent(app);

    await request(app).get(`${API_PREFIX}/children`).set("Cookie", accountCookies).expect(401);
  }, 60_000);

  it("un perfil de niño activo no abre las rutas de solo cuenta que son de gestión", async () => {
    // Solo cuenta NO significa sin autorización: crear un perfil se conforma
    // con la cookie, pero su servicio sigue decidiendo quién puede.
    const { cookies } = await asChild(app);

    await request(app)
      .post(`${API_PREFIX}/children`)
      .set("Cookie", cookies)
      .send({ name: "Colado", pin: "9999" })
      .expect(403);
  }, 120_000);
});
