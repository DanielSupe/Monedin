import { API_PREFIX, DEFAULT_AVATAR_KEY, ERROR_CODES, MAX_CHILDREN_PER_FAMILY } from "@monedin/contracts";
import request from "supertest";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../../src/app.js";
import { testPrisma } from "../support/database.js";
import {
  asChild,
  asParent,
  createChildProfile,
  registerParent,
  resetAuthData,
} from "../support/auth.js";

const app = createApp();

beforeEach(async () => {
  await resetAuthData();
});

afterAll(async () => {
  await resetAuthData();
});

function suPerfil(cookies: string[]): request.Test {
  return request(app).get(`${API_PREFIX}/children/me`).set("Cookie", cookies);
}

function cambiarSuPerfil(cookies: string[], body: Record<string, unknown>): request.Test {
  return request(app).patch(`${API_PREFIX}/children/me`).set("Cookie", cookies).send(body);
}

describe("el niño ve su propio perfil con su saldo", () => {
  it("consulta lo suyo", async () => {
    const { cookies, childId } = await asChild(app, { childName: "Mateo", coins: 25, age: 8 });

    const response = await suPerfil(cookies);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ id: childId, name: "Mateo", coins: 25, age: 8 });
  }, 120_000);

  it("su avatar sale resuelto aunque no tenga ninguno", async () => {
    const { cookies } = await asChild(app);

    expect((await suPerfil(cookies)).body.avatar).toBe(DEFAULT_AVATAR_KEY);
  }, 120_000);

  it("no filtra el PIN ni datos internos", async () => {
    const { cookies } = await asChild(app, { childPin: "4321" });

    const cuerpo = JSON.stringify((await suPerfil(cookies)).body);

    expect(cuerpo).not.toContain("pinHash");
    expect(cuerpo).not.toContain("4321");
    expect(cuerpo).not.toContain("parentId");
    expect(cuerpo).not.toContain("deletedAt");
  }, 120_000);

  it("la ruta propia NO cae en la del identificador", async () => {
    // Si `/children/:childId` se registrara antes, «me» entraría por ahí,
    // dispararía `requireParent` y el niño recibiría un 403 en su propia ruta.
    // El fallo sería silencioso porque un 403 es perfectamente plausible.
    const { cookies } = await asChild(app);

    const response = await suPerfil(cookies);

    expect(response.status).toBe(200);
    expect(response.status).not.toBe(403);
  }, 120_000);

  it("un padre no usa la vista propia del niño", async () => {
    const { cookies } = await asParent(app);

    const response = await suPerfil(cookies);

    expect(response.status).toBe(403);
    expect(response.body.code).toBe(ERROR_CODES.FORBIDDEN);
  }, 60_000);

  it("con solo la sesión de cuenta se rechaza por falta de sesión", async () => {
    const { accountCookies } = await asChild(app);

    expect((await suPerfil(accountCookies)).status).toBe(401);
  }, 120_000);
});

describe("el niño no ve a sus hermanos", () => {
  it("solo devuelve su propio perfil, aunque tenga hermanos", async () => {
    const { cookies, childId, parentId } = await asChild(app, { childName: "Mateo" });
    await createChildProfile(parentId, { name: "Emma", pin: "5555", coins: 999 });

    const response = await suPerfil(cookies);

    expect(response.body.id).toBe(childId);
    expect(response.body.name).toBe("Mateo");
    expect(JSON.stringify(response.body)).not.toContain("Emma");
    expect(JSON.stringify(response.body)).not.toContain("999");
  }, 120_000);

  it("cambiar su avatar no toca el de su hermano", async () => {
    const { cookies, parentId } = await asChild(app);
    const hermano = await createChildProfile(parentId, {
      name: "Emma",
      pin: "5555",
      avatar: "koala",
    });

    await cambiarSuPerfil(cookies, { avatar: "panda" }).expect(200);

    const fila = await testPrisma().childProfile.findUniqueOrThrow({ where: { id: hermano.id } });
    expect(fila.avatar).toBe("koala");
  }, 120_000);
});

describe("el niño elige su avatar y nada más", () => {
  it("cambia su avatar por otro del catálogo", async () => {
    const { cookies, childId } = await asChild(app);

    const response = await cambiarSuPerfil(cookies, { avatar: "ajolote" });

    expect(response.status).toBe(200);
    expect(response.body.avatar).toBe("ajolote");

    const fila = await testPrisma().childProfile.findUniqueOrThrow({ where: { id: childId } });
    expect(fila.avatar).toBe("ajolote");
  }, 120_000);

  it("el avatar nuevo se refleja en la rejilla", async () => {
    const { cookies, accountCookies } = await asChild(app);
    await cambiarSuPerfil(cookies, { avatar: "tucan" }).expect(200);

    const rejilla = await request(app)
      .get(`${API_PREFIX}/auth/profiles`)
      .set("Cookie", accountCookies);

    const avatares = rejilla.body.profiles.map((p: { avatar: string }) => p.avatar);
    expect(avatares).toContain("tucan");
  }, 120_000);

  it("rechaza un avatar fuera del catálogo", async () => {
    const { cookies } = await asChild(app);

    const response = await cambiarSuPerfil(cookies, { avatar: "dragon" });

    expect(response.status).toBe(422);
  }, 120_000);

  it("no puede cambiar su nombre, su edad ni su saldo", async () => {
    const { cookies, childId } = await asChild(app, { childName: "Mateo", coins: 10, age: 8 });

    for (const body of [{ name: "Otro" }, { age: 10 }, { coins: 500 }]) {
      const response = await cambiarSuPerfil(cookies, body);
      expect(response.status, JSON.stringify(body)).toBe(422);
    }

    const fila = await testPrisma().childProfile.findUniqueOrThrow({ where: { id: childId } });
    expect(fila).toMatchObject({ name: "Mateo", coins: 10, age: 8 });
  }, 120_000);

  it("un padre no cambia el avatar por la vía del niño", async () => {
    const { cookies } = await asParent(app);

    expect((await cambiarSuPerfil(cookies, { avatar: "panda" })).status).toBe(403);
  }, 60_000);
});

describe("el alta bajo concurrencia respeta el tope", () => {
  it("dos altas simultáneas en el último hueco no desbordan el tope más uno", async () => {
    // La carrera se ACEPTA a conciencia: contar e insertar no son atómicos
    // entre sí bajo Read Committed, así que las dos pueden colarse. El tope es
    // un límite de POLÍTICA, no un invariante: pasar de 10 a 11 no descuadra
    // ningún saldo. Cerrarlo exigiría nivel Serializable y mapear P2034, que
    // hoy saldría como 500. Ver la decisión 7 del design de `add-children`.
    const { cookies } = await registerParent(app);
    const parentId = await testPrisma()
      .user.findFirstOrThrow({ select: { id: true } })
      .then((u) => u.id);

    for (let i = 0; i < MAX_CHILDREN_PER_FAMILY - 1; i += 1) {
      await createChildProfile(parentId, { name: `Hijo ${i}`, pin: "1234" });
    }

    const respuestas = await Promise.all([
      request(app)
        .post(`${API_PREFIX}/children`)
        .set("Cookie", cookies)
        .send({ name: "Ana", pin: "1111" }),
      request(app)
        .post(`${API_PREFIX}/children`)
        .set("Cookie", cookies)
        .send({ name: "Bruno", pin: "2222" }),
    ]);

    // Al menos una entra: había hueco de verdad.
    expect(respuestas.some((r) => r.status === 201)).toBe(true);
    // Y ninguna falla por validación: si esto salta, el test está mal escrito y
    // no está probando la carrera.
    expect(respuestas.every((r) => r.status !== 422)).toBe(true);

    const activos = await testPrisma().childProfile.count({
      where: { parentId, deletedAt: null },
    });
    expect(activos).toBeGreaterThanOrEqual(MAX_CHILDREN_PER_FAMILY);
    expect(activos).toBeLessThanOrEqual(MAX_CHILDREN_PER_FAMILY + 1);
  }, 180_000);

  it("un hijo dado de baja mientras estaba dentro deja de poder consultar", async () => {
    // Se marca la baja directamente en la base para dejar la sesión VIVA: por
    // el endpoint se revocaría, y aquí interesa el otro camino, el del perfil
    // que ya no existe para el producto aunque la cookie siga siendo válida.
    const { cookies, childId } = await asChild(app);
    await testPrisma().childProfile.update({
      where: { id: childId },
      data: { deletedAt: new Date() },
    });

    const response = await suPerfil(cookies);

    expect(response.status).toBeGreaterThanOrEqual(400);
  }, 120_000);
});
