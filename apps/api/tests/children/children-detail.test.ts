import { API_PREFIX, ERROR_CODES } from "@monedin/contracts";
import request from "supertest";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../../src/app.js";
import { testPrisma } from "../support/database.js";
import {
  PROFILE_COOKIE,
  asChild,
  asParent,
  cookieValue,
  createChildProfile,
  parentOnSecondDevice,
  resetAuthData,
} from "../support/auth.js";

const app = createApp();

const ID_INVENTADO = "zzzzzzzzzzzzzzzzzzzzzzzz";

beforeEach(async () => {
  await resetAuthData();
});

afterAll(async () => {
  await resetAuthData();
});

function detalle(cookies: string[], id: string): request.Test {
  return request(app).get(`${API_PREFIX}/children/${id}`).set("Cookie", cookies);
}

function editar(cookies: string[], id: string, body: Record<string, unknown>): request.Test {
  return request(app).patch(`${API_PREFIX}/children/${id}`).set("Cookie", cookies).send(body);
}

function darDeBaja(cookies: string[], id: string): request.Test {
  return request(app).delete(`${API_PREFIX}/children/${id}`).set("Cookie", cookies);
}

describe("el padre consulta y edita a un hijo suyo", () => {
  it("consulta el detalle de un hijo suyo", async () => {
    const { cookies, parentId } = await asParent(app);
    const hijo = await createChildProfile(parentId, { name: "Mateo", pin: "1234", coins: 15, age: 7 });

    const response = await detalle(cookies, hijo.id);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ id: hijo.id, name: "Mateo", coins: 15, age: 7 });
  }, 60_000);

  it("cambia el nombre, la edad y el avatar", async () => {
    const { cookies, parentId } = await asParent(app);
    const hijo = await createChildProfile(parentId, { name: "Mateo", pin: "1234" });

    const response = await editar(cookies, hijo.id, { name: "Mateo José", age: 9, avatar: "panda" });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ name: "Mateo José", age: 9, avatar: "panda" });
  }, 60_000);

  it("editar un campo no borra los demás", async () => {
    const { cookies, parentId } = await asParent(app);
    const hijo = await createChildProfile(parentId, {
      name: "Mateo",
      pin: "1234",
      age: 8,
      avatar: "zorro",
    });

    const response = await editar(cookies, hijo.id, { name: "Solo el nombre" });

    expect(response.body).toMatchObject({ name: "Solo el nombre", age: 8, avatar: "zorro" });
  }, 60_000);

  it("se puede borrar la edad, que es distinto de no tocarla", async () => {
    const { cookies, parentId } = await asParent(app);
    const hijo = await createChildProfile(parentId, { name: "Mateo", pin: "1234", age: 8 });

    const response = await editar(cookies, hijo.id, { age: null });

    expect(response.status).toBe(200);
    expect(response.body.age).toBeNull();
  }, 60_000);

  it("el saldo no se edita", async () => {
    const { cookies, parentId } = await asParent(app);
    const hijo = await createChildProfile(parentId, { name: "Mateo", pin: "1234", coins: 40 });

    const response = await editar(cookies, hijo.id, { coins: 9999 });

    expect(response.status).toBe(422);
    const fila = await testPrisma().childProfile.findUniqueOrThrow({ where: { id: hijo.id } });
    expect(fila.coins).toBe(40);
  }, 60_000);

  it("una edición sin campos no es una edición", async () => {
    const { cookies, parentId } = await asParent(app);
    const hijo = await createChildProfile(parentId, { name: "Mateo", pin: "1234" });

    await editar(cookies, hijo.id, {}).expect(422);
  }, 60_000);

  it("señala todos los campos inválidos de una vez", async () => {
    const { cookies, parentId } = await asParent(app);
    const hijo = await createChildProfile(parentId, { name: "Mateo", pin: "1234" });

    const response = await editar(cookies, hijo.id, { name: "A", age: 99, avatar: "dragon" });

    expect(response.status).toBe(422);
    const campos = response.body.details.map((d: { field: string }) => d.field);
    expect(campos).toContain("name");
    expect(campos).toContain("age");
    expect(campos).toContain("avatar");
  }, 60_000);
});

describe("un hijo ajeno responde como si no existiera", () => {
  it("el detalle de un hijo de otra familia es idéntico al de un id inventado", async () => {
    // Un 403 confirmaría que ese perfil existe. Los dos cuerpos tienen que ser
    // indistinguibles.
    const nuestra = await asParent(app);
    const otra = await asParent(app, { email: "otra@monedin.test" });
    const ajeno = await createChildProfile(otra.parentId, { name: "Ajeno", pin: "1234" });

    const sobreAjeno = await detalle(nuestra.cookies, ajeno.id);
    const sobreInventado = await detalle(nuestra.cookies, ID_INVENTADO);

    expect(sobreAjeno.status).toBe(404);
    expect(sobreAjeno.body.code).toBe(ERROR_CODES.NOT_FOUND);
    expect(sobreAjeno.body).toEqual(sobreInventado.body);
  }, 120_000);

  it("no se puede editar a un hijo ajeno", async () => {
    const nuestra = await asParent(app);
    const otra = await asParent(app, { email: "otra@monedin.test" });
    const ajeno = await createChildProfile(otra.parentId, { name: "Ajeno", pin: "1234" });

    await editar(nuestra.cookies, ajeno.id, { name: "Secuestrado" }).expect(404);

    const fila = await testPrisma().childProfile.findUniqueOrThrow({ where: { id: ajeno.id } });
    expect(fila.name).toBe("Ajeno");
  }, 120_000);

  it("no se puede dar de baja a un hijo ajeno", async () => {
    const nuestra = await asParent(app);
    const otra = await asParent(app, { email: "otra@monedin.test" });
    const ajeno = await createChildProfile(otra.parentId, { name: "Ajeno", pin: "1234" });

    await darDeBaja(nuestra.cookies, ajeno.id).expect(404);

    const fila = await testPrisma().childProfile.findUniqueOrThrow({ where: { id: ajeno.id } });
    expect(fila.deletedAt).toBeNull();
  }, 120_000);
});

describe("la baja de un hijo es lógica y definitiva", () => {
  it("lo saca de los listados pero conserva la fila", async () => {
    const { cookies, parentId } = await asParent(app);
    const hijo = await createChildProfile(parentId, { name: "Mateo", pin: "1234" });

    await darDeBaja(cookies, hijo.id).expect(204);

    const fila = await testPrisma().childProfile.findUniqueOrThrow({ where: { id: hijo.id } });
    expect(fila.deletedAt).not.toBeNull();

    const rejilla = await request(app).get(`${API_PREFIX}/auth/profiles`).set("Cookie", cookies);
    expect(rejilla.body.profiles.map((p: { name: string }) => p.name)).not.toContain("Mateo");
  }, 120_000);

  it("conserva el historial de monedas", async () => {
    const { cookies, parentId } = await asParent(app);
    const hijo = await createChildProfile(parentId, { name: "Mateo", pin: "1234", coins: 10 });
    await testPrisma().coinTransaction.create({
      data: { childId: hijo.id, amount: 10, balanceAfter: 10, reason: "MANUAL_ADJUSTMENT" },
    });

    await darDeBaja(cookies, hijo.id).expect(204);

    // La baja es lógica justamente para que esto siga aquí.
    expect(await testPrisma().coinTransaction.count({ where: { childId: hijo.id } })).toBe(1);
  }, 120_000);

  it("echa al niño del dispositivo donde estuviera dentro", async () => {
    // Hacen falta DOS dispositivos de verdad: dentro de una misma sesión de
    // cuenta nunca hay dos perfiles activos, así que entrar como padre habría
    // cerrado el del niño y el test pasaría por el motivo equivocado.
    const { childId, cookies: enElDispositivoDelNino } = await asChild(app);
    const otroDispositivo = await parentOnSecondDevice(app);

    // El niño sigue dentro en su dispositivo antes de la baja.
    await request(app)
      .get(`${API_PREFIX}/children/me`)
      .set("Cookie", enElDispositivoDelNino)
      .expect(200);

    await darDeBaja(otroDispositivo, childId).expect(204);

    const suyo = await request(app)
      .get(`${API_PREFIX}/children/me`)
      .set("Cookie", enElDispositivoDelNino);
    expect(suyo.status).toBe(401);
  }, 120_000);

  it("dar de baja dos veces a la vez deja un 204 y un 404, sin pisar la fecha", async () => {
    const { cookies, parentId } = await asParent(app);
    const hijo = await createChildProfile(parentId, { name: "Mateo", pin: "1234" });

    const [una, otra] = await Promise.all([
      darDeBaja(cookies, hijo.id),
      darDeBaja(cookies, hijo.id),
    ]);

    const estados = [una.status, otra.status].sort();
    expect(estados).toEqual([204, 404]);

    const fila = await testPrisma().childProfile.findUniqueOrThrow({ where: { id: hijo.id } });
    expect(fila.deletedAt).not.toBeNull();
  }, 120_000);

  it("un hijo ya dado de baja responde como inexistente en todo", async () => {
    const { cookies, parentId } = await asParent(app);
    const hijo = await createChildProfile(parentId, { name: "Mateo", pin: "1234" });
    await darDeBaja(cookies, hijo.id).expect(204);

    await detalle(cookies, hijo.id).expect(404);
    await editar(cookies, hijo.id, { name: "Resucitado" }).expect(404);
    await darDeBaja(cookies, hijo.id).expect(404);
  }, 120_000);

  it("un niño no puede dar de baja a nadie", async () => {
    const { cookies, childId } = await asChild(app);

    const response = await darDeBaja(cookies, childId);

    expect(response.status).toBe(403);
  }, 120_000);
});

describe("las rutas de gestión exigen el perfil del adulto", () => {
  it("un niño sobre el detalle de su hermano recibe 403, igual que con un id inventado", async () => {
    const { cookies, parentId } = await asChild(app);
    const hermano = await createChildProfile(parentId, { name: "Hermano", pin: "5555" });

    const sobreHermano = await detalle(cookies, hermano.id);
    const sobreInventado = await detalle(cookies, ID_INVENTADO);

    expect(sobreHermano.status).toBe(403);
    // Indistinguibles: el filtro de rol corta antes de mirar el recurso.
    expect(sobreHermano.body).toEqual(sobreInventado.body);
  }, 120_000);

  it("con solo la sesión de cuenta se rechaza igual que sin sesión", async () => {
    const { accountCookies, parentId } = await asParent(app);
    const hijo = await createChildProfile(parentId, { name: "Mateo", pin: "1234" });

    await detalle(accountCookies, hijo.id).expect(401);
    await editar(accountCookies, hijo.id, { name: "Otro" }).expect(401);
    await darDeBaja(accountCookies, hijo.id).expect(401);
  }, 120_000);

  it("volver a entrar a un perfil dado de baja ya no es posible", async () => {
    const { cookies, accountCookies, parentId } = await asParent(app);
    const hijo = await createChildProfile(parentId, { name: "Mateo", pin: "1234" });
    await darDeBaja(cookies, hijo.id).expect(204);

    const response = await request(app)
      .post(`${API_PREFIX}/auth/profiles/enter`)
      .set("Cookie", accountCookies)
      .send({ profileId: hijo.id, pin: "1234" });

    expect(response.status).toBeGreaterThanOrEqual(400);
    // Y no emite cookie de perfil: nadie queda dentro de un perfil dado de baja.
    expect(cookieValue(response, PROFILE_COOKIE)).toBeUndefined();
  }, 120_000);
});
