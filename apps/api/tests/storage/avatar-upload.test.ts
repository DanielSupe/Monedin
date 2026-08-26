import { API_PREFIX, DEFAULT_AVATAR_KEY, ERROR_CODES } from "@monedin/contracts";
import request from "supertest";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../../src/app.js";
import { resetAuthData } from "../support/auth.js";
import { sembrarObjeto, subirConUrlFirmada } from "../support/storage.js";
import { familiaOperando } from "../support/tasks.js";

/**
 * El avatar propio, de punta a punta y contra MinIO de verdad.
 *
 * Las dos garantías que sostienen este flujo, y que son lo que estos tests
 * vigilan: que una clave de OTRO no se puede confirmar como propia aunque el
 * objeto exista, y que una que nunca se subió no queda guardada como si fuera
 * una foto.
 */

const app = createApp();

beforeEach(async () => {
  await resetAuthData();
});

afterAll(async () => {
  await resetAuthData();
});

function pedirUrlPropia(cookies: string[], contentType = "image/jpeg"): request.Test {
  return request(app)
    .post(`${API_PREFIX}/children/me/avatar/upload-url`)
    .set("Cookie", cookies)
    .send({ contentType });
}

function pedirUrlDeHijo(cookies: string[], childId: string): request.Test {
  return request(app)
    .post(`${API_PREFIX}/children/${childId}/avatar/upload-url`)
    .set("Cookie", cookies)
    .send({ contentType: "image/jpeg" });
}

function confirmarPropio(cookies: string[], body: Record<string, unknown>): request.Test {
  return request(app).patch(`${API_PREFIX}/children/me`).set("Cookie", cookies).send(body);
}

describe("el niño sube su propia foto", () => {
  it("recorre el flujo entero: pedir, subir, confirmar y verla", async () => {
    const { hijos } = await familiaOperando(app, ["Ana"]);
    const ana = hijos[0]!;

    const url = await pedirUrlPropia(ana.cookies).expect(200);
    expect(url.body.key).toContain(`avatars/children/${ana.id}/`);

    const subida = await subirConUrlFirmada(url.body.uploadUrl);
    expect(subida.ok).toBe(true);

    const confirmado = await confirmarPropio(ana.cookies, { avatarUploadKey: url.body.key });

    expect(confirmado.status).toBe(200);
    // Sale como URL lista para pintar, nunca como la clave cruda del almacén.
    expect(confirmado.body.avatar).toMatch(/^https?:\/\//);
    expect(confirmado.body.avatar).not.toBe(url.body.key);
  }, 180_000);

  it("elegir del catálogo sigue funcionando exactamente igual", async () => {
    const { hijos } = await familiaOperando(app, ["Ana"]);

    const response = await confirmarPropio(hijos[0]!.cookies, { avatar: "zorro" });

    expect(response.status).toBe(200);
    expect(response.body.avatar).toBe("zorro");
  }, 120_000);

  it("una clave que nunca se subió da 422 y no cambia el avatar", async () => {
    const { hijos } = await familiaOperando(app, ["Ana"]);
    const ana = hijos[0]!;

    const response = await confirmarPropio(ana.cookies, {
      avatarUploadKey: `avatars/children/${ana.id}/fantasma.jpg`,
    });

    expect(response.status).toBe(422);
    expect(response.body.code).toBe(ERROR_CODES.VALIDATION_ERROR);

    const perfil = await request(app).get(`${API_PREFIX}/children/me`).set("Cookie", ana.cookies);
    expect(perfil.body.avatar).toBe(DEFAULT_AVATAR_KEY);
  }, 180_000);

  it("la clave de un HERMANO da 422 aunque el objeto exista de verdad", async () => {
    // Es la comprobación de prefijo: sin ella, quien viera la clave de otro en
    // una respuesta podría confirmarla como suya.
    const { hijos } = await familiaOperando(app, ["Ana", "Bruno"]);
    const [ana, bruno] = hijos;

    const deBruno = `avatars/children/${bruno!.id}/${crypto.randomUUID()}.jpg`;
    await sembrarObjeto(deBruno);

    const response = await confirmarPropio(ana!.cookies, { avatarUploadKey: deBruno });

    expect(response.status).toBe(422);
  }, 180_000);

  it("mandar catálogo y foto a la vez es entrada inválida", async () => {
    const { hijos } = await familiaOperando(app, ["Ana"]);
    const ana = hijos[0]!;

    const response = await confirmarPropio(ana.cookies, {
      avatar: "zorro",
      avatarUploadKey: `avatars/children/${ana.id}/a.jpg`,
    });

    expect(response.status).toBe(422);
  }, 120_000);

  it("un tipo de imagen que no se admite no llega a entregar URL", async () => {
    const { hijos } = await familiaOperando(app, ["Ana"]);

    const response = await pedirUrlPropia(hijos[0]!.cookies, "image/gif");

    expect(response.status).toBe(422);
  }, 120_000);
});

describe("el padre sube la foto de un hijo suyo", () => {
  it("la confirma y aparece en el listado ya resuelta", async () => {
    const { cookies, hijos } = await familiaOperando(app, ["Ana"]);
    const ana = hijos[0]!;

    const url = await pedirUrlDeHijo(cookies, ana.id).expect(200);
    await subirConUrlFirmada(url.body.uploadUrl);

    await request(app)
      .patch(`${API_PREFIX}/children/${ana.id}`)
      .set("Cookie", cookies)
      .send({ avatarUploadKey: url.body.key })
      .expect(200);

    const listado = await request(app).get(`${API_PREFIX}/children`).set("Cookie", cookies);

    expect(listado.body.items[0].avatar).toMatch(/^https?:\/\//);
  }, 180_000);

  it("un hijo ajeno responde como inexistente y no entrega URL", async () => {
    const { cookies } = await familiaOperando(app, ["Ana"]);
    const { hijos: otros } = await familiaOperando(app, ["Carla"], {
      email: "otra@monedin.test",
    });

    const response = await pedirUrlDeHijo(cookies, otros[0]!.id);

    expect(response.status).toBe(404);
  }, 300_000);

  it("confirmar sobre un hijo la clave de OTRO hijo suyo da 422", async () => {
    const { cookies, hijos } = await familiaOperando(app, ["Ana", "Bruno"]);
    const [ana, bruno] = hijos;

    const deBruno = `avatars/children/${bruno!.id}/${crypto.randomUUID()}.jpg`;
    await sembrarObjeto(deBruno);

    const response = await request(app)
      .patch(`${API_PREFIX}/children/${ana!.id}`)
      .set("Cookie", cookies)
      .send({ avatarUploadKey: deBruno });

    expect(response.status).toBe(422);
  }, 180_000);

  it("un niño no pide la URL de otro perfil", async () => {
    const { hijos } = await familiaOperando(app, ["Ana", "Bruno"]);

    const response = await pedirUrlDeHijo(hijos[0]!.cookies, hijos[1]!.id);

    expect(response.status).toBe(403);
  }, 180_000);
});

describe("el avatar del padre", () => {
  it("se sube, se confirma, y viaja en su actor y en la rejilla", async () => {
    const { cookies, accountCookies } = await familiaOperando(app, ["Ana"]);

    const url = await request(app)
      .post(`${API_PREFIX}/auth/avatar/upload-url`)
      .set("Cookie", cookies)
      .send({ contentType: "image/jpeg" })
      .expect(200);

    await subirConUrlFirmada(url.body.uploadUrl);

    await request(app)
      .patch(`${API_PREFIX}/auth/avatar`)
      .set("Cookie", cookies)
      .send({ avatarUploadKey: url.body.key })
      .expect(200);

    // Dentro de su sesión: es lo que antes de este change no podía ver.
    const sesion = await request(app).get(`${API_PREFIX}/auth/session`).set("Cookie", cookies);
    expect(sesion.body.actor.avatar).toMatch(/^https?:\/\//);

    // Y en la rejilla previa.
    const rejilla = await request(app)
      .get(`${API_PREFIX}/auth/profiles`)
      .set("Cookie", accountCookies);
    const padre = rejilla.body.profiles.find(
      (perfil: { familyRole: string }) => perfil.familyRole === "PARENT",
    );
    expect(padre.avatar).toMatch(/^https?:\/\//);
  }, 300_000);

  it("un niño no puede cambiar el avatar del padre", async () => {
    const { hijos } = await familiaOperando(app, ["Ana"]);

    const response = await request(app)
      .post(`${API_PREFIX}/auth/avatar/upload-url`)
      .set("Cookie", hijos[0]!.cookies)
      .send({ contentType: "image/jpeg" });

    expect(response.status).toBe(403);
  }, 120_000);

  it("el actor del padre lleva avatar aunque nunca haya subido ninguno", async () => {
    const { cookies } = await familiaOperando(app, ["Ana"]);

    const sesion = await request(app).get(`${API_PREFIX}/auth/session`).set("Cookie", cookies);

    expect(sesion.body.actor.avatar).toBe(DEFAULT_AVATAR_KEY);
  }, 120_000);
});
