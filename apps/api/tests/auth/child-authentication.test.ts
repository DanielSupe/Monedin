import {
  API_PREFIX,
  CHILD_MAX_FAILED_ATTEMPTS,
  ERROR_CODES,
  PARENT_PROFILE_ID,
} from "@monedin/contracts";
import request from "supertest";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../../src/app.js";
import { testPrisma } from "../support/database.js";
import {
  CREDENCIALES,
  PROFILE_COOKIE,
  asParent,
  clearsCookie,
  cookieValue,
  createChildProfile,
  enterProfile,
  liveCookies,
  login,
  parentIdByEmail,
  registerParent,
  resetAuthData,
} from "../support/auth.js";

const app = createApp();

interface Familia {
  parentId: string;
  /** Cuenta acreditada + perfil del padre activo. Con esto se opera. */
  cookies: string[];
  /** Solo la cuenta: el estado de la rejilla. */
  accountCookies: string[];
  mayor: { id: string; name: string; pin: string };
  menor: { id: string; name: string; pin: string };
}

/** Un padre con dos hijos, con PIN distinto cada uno. */
async function crearFamilia(email: string = CREDENCIALES.correo): Promise<Familia> {
  // `asParent` deja la cuenta acreditada Y el perfil del padre activo, que es
  // lo que hace falta para operar desde `add-profile-selection`.
  const { cookies, accountCookies, parentId } = await asParent(app, { email });

  return {
    parentId,
    cookies,
    accountCookies,
    mayor: await createChildProfile(parentId, { name: "Mateo", pin: "1234", coins: 120 }),
    menor: await createChildProfile(parentId, { name: "Emma", pin: "5678", coins: 80 }),
  };
}

/** Cookies de cuenta + perfil de niño, tal como las llevaría el navegador. */
function conNino(familia: Familia, childCookie: string): string[] {
  return [...familia.accountCookies, `${PROFILE_COOKIE}=${childCookie}`];
}

function entrar(cookies: string[], profileId: string, pin: string): request.Test {
  return request(app)
    .post(`${API_PREFIX}/auth/profiles/enter`)
    .set("Cookie", cookies)
    .send({ profileId, pin });
}

beforeEach(async () => {
  await resetAuthData();
});

// Estos tests CONFIRMAN datos: no pueden usar transacciones deshechas porque
// llaman a la app, que abre las suyas. Así que limpian al terminar, para no
// dejar la base con restos que confundan a los tests de otros archivos.
afterAll(async () => {
  await resetAuthData();
});

describe("listado de perfiles", () => {
  it("ofrece los hijos activos del padre de la sesión", async () => {
    const familia = await crearFamilia();

    const response = await request(app)
      .get(`${API_PREFIX}/auth/profiles`)
      .set("Cookie", familia.cookies);

    expect(response.status).toBe(200);
    // La rejilla lleva al padre por delante: es un perfil mas.
    expect(response.body.profiles.map((c: { name: string }) => c.name)).toEqual([
      CREDENCIALES.nombre,
      "Mateo",
      "Emma",
    ]);
  }, 60_000);

  it("solo expone nombre y avatar, nada más", async () => {
    const familia = await crearFamilia();

    const response = await request(app)
      .get(`${API_PREFIX}/auth/profiles`)
      .set("Cookie", familia.cookies);

    for (const child of response.body.profiles) {
      expect(Object.keys(child).sort()).toEqual([
        "avatar",
        "familyRole",
        "id",
        "locked",
        "name",
      ]);
    }
    // Ni el saldo ni el PIN asoman antes de entrar.
    expect(JSON.stringify(response.body)).not.toContain("coins");
    expect(JSON.stringify(response.body)).not.toContain("pinHash");
  }, 60_000);

  it("sin sesión de padre no hay listado", async () => {
    await crearFamilia();

    const response = await request(app).get(`${API_PREFIX}/auth/profiles`);

    expect(response.status).toBe(401);
  }, 60_000);

  it("un hijo dado de baja no aparece", async () => {
    const familia = await crearFamilia();
    await testPrisma().childProfile.update({
      where: { id: familia.menor.id },
      data: { deletedAt: new Date() },
    });

    const response = await request(app)
      .get(`${API_PREFIX}/auth/profiles`)
      .set("Cookie", familia.cookies);

    expect(response.body.profiles.map((c: { name: string }) => c.name)).toEqual([
      CREDENCIALES.nombre,
      "Mateo",
    ]);
  }, 60_000);

  it("y tampoco se puede entrar a él indicando su identificador", async () => {
    const familia = await crearFamilia();
    await testPrisma().childProfile.update({
      where: { id: familia.menor.id },
      data: { deletedAt: new Date() },
    });

    const response = await entrar(familia.cookies, familia.menor.id, familia.menor.pin);

    expect(response.status).toBe(401);
  }, 60_000);
});

describe("entrada con PIN", () => {
  it("con el PIN correcto la sesión pasa a ser la del niño", async () => {
    const familia = await crearFamilia();

    const response = await entrar(familia.cookies, familia.mayor.id, familia.mayor.pin);

    expect(response.status).toBe(200);
    expect(response.body.actor).toMatchObject({
      familyRole: "CHILD",
      name: "Mateo",
      coins: 120,
    });
    expect(cookieValue(response, PROFILE_COOKIE)).toBeTruthy();
  }, 60_000);

  it("con el PIN equivocado se rechaza y la sesión del padre queda intacta", async () => {
    const familia = await crearFamilia();

    const response = await entrar(familia.cookies, familia.mayor.id, "9999");

    expect(response.status).toBe(401);
    expect(cookieValue(response, PROFILE_COOKIE)).toBeUndefined();

    // El padre sigue dentro.
    const estado = await request(app)
      .get(`${API_PREFIX}/auth/session`)
      .set("Cookie", familia.cookies);
    expect(estado.body.actor.familyRole).toBe("PARENT");
  }, 60_000);

  it("el PIN no aparece en el almacén ni en las respuestas", async () => {
    const familia = await crearFamilia();
    const response = await entrar(familia.cookies, familia.mayor.id, familia.mayor.pin);

    expect(JSON.stringify(response.body)).not.toContain(familia.mayor.pin);

    const perfil = await testPrisma().childProfile.findUniqueOrThrow({
      where: { id: familia.mayor.id },
      select: { pinHash: true },
    });
    expect(perfil.pinHash).not.toContain(familia.mayor.pin);
    expect(perfil.pinHash.startsWith("scrypt$")).toBe(true);
  }, 60_000);

  it("dos hermanos con el mismo PIN guardan hashes distintos", async () => {
    const { cookies } = await registerParent(app);
    const parentId = await parentIdByEmail(CREDENCIALES.correo);
    await createChildProfile(parentId, { name: "Uno", pin: "1111" });
    await createChildProfile(parentId, { name: "Dos", pin: "1111" });
    expect(cookies.length).toBeGreaterThan(0);

    const perfiles = await testPrisma().childProfile.findMany({ select: { pinHash: true } });

    expect(perfiles).toHaveLength(2);
    expect(perfiles[0]?.pinHash).not.toBe(perfiles[1]?.pinHash);
  }, 60_000);

  it("un PIN que no son cuatro dígitos se rechaza antes de comprobar nada", async () => {
    const familia = await crearFamilia();

    const response = await entrar(familia.cookies, familia.mayor.id, "12");

    expect(response.status).toBe(422);
    expect(response.body.details.map((d: { field: string }) => d.field)).toContain("pin");
  }, 60_000);
});

describe("aislamiento entre familias", () => {
  it("no se puede entrar a un perfil de otra familia", async () => {
    const nuestra = await crearFamilia();
    const otra = await crearFamilia("otra@monedin.test");

    const response = await entrar(nuestra.cookies, otra.mayor.id, otra.mayor.pin);

    expect(response.status).toBe(401);
  }, 120_000);

  it("y la respuesta no permite deducir si ese perfil existe", async () => {
    const nuestra = await crearFamilia();
    const otra = await crearFamilia("otra@monedin.test");

    const ajeno = await entrar(nuestra.cookies, otra.mayor.id, "1234");
    const inexistente = await entrar(nuestra.cookies, "no-existe-este-id", "1234");

    expect(ajeno.status).toBe(inexistente.status);
    expect(ajeno.body).toEqual(inexistente.body);
  }, 120_000);
});

describe("bloqueo del perfil", () => {
  async function fallarPin(familia: Familia, childId: string, veces: number): Promise<void> {
    for (let i = 0; i < veces; i += 1) {
      await entrar(familia.cookies, childId, "9999");
    }
  }

  it("al alcanzar el límite rechaza aunque el PIN sea correcto", async () => {
    const familia = await crearFamilia();
    await fallarPin(familia, familia.mayor.id, CHILD_MAX_FAILED_ATTEMPTS);

    const response = await entrar(familia.cookies, familia.mayor.id, familia.mayor.pin);

    expect(response.status).toBe(429);
    expect(response.body.code).toBe(ERROR_CODES.TOO_MANY_ATTEMPTS);
  }, 120_000);

  it("es por perfil: el hermano sigue pudiendo entrar", async () => {
    const familia = await crearFamilia();
    await fallarPin(familia, familia.mayor.id, CHILD_MAX_FAILED_ATTEMPTS);

    const hermano = await entrar(familia.cookies, familia.menor.id, familia.menor.pin);

    expect(hermano.status).toBe(200);
  }, 120_000);

  it("el padre desbloquea al momento", async () => {
    const familia = await crearFamilia();
    await fallarPin(familia, familia.mayor.id, CHILD_MAX_FAILED_ATTEMPTS);

    const desbloqueo = await request(app)
      .post(`${API_PREFIX}/auth/child-profiles/${familia.mayor.id}/unlock`)
      .set("Cookie", familia.cookies);
    expect(desbloqueo.status).toBe(204);

    const response = await entrar(familia.cookies, familia.mayor.id, familia.mayor.pin);
    expect(response.status).toBe(200);
  }, 120_000);

  it("el bloqueo caduca solo", async () => {
    const familia = await crearFamilia();
    await fallarPin(familia, familia.mayor.id, CHILD_MAX_FAILED_ATTEMPTS);

    await testPrisma().childProfile.update({
      where: { id: familia.mayor.id },
      data: { lockedUntil: new Date(Date.now() - 1000) },
    });

    const response = await entrar(familia.cookies, familia.mayor.id, familia.mayor.pin);
    expect(response.status).toBe(200);
  }, 120_000);

  it("el listado señala qué perfil está bloqueado", async () => {
    const familia = await crearFamilia();
    await fallarPin(familia, familia.mayor.id, CHILD_MAX_FAILED_ATTEMPTS);

    const listado = await request(app)
      .get(`${API_PREFIX}/auth/profiles`)
      .set("Cookie", familia.cookies);

    const mayor = listado.body.profiles.find((c: { id: string }) => c.id === familia.mayor.id);
    const menor = listado.body.profiles.find((c: { id: string }) => c.id === familia.menor.id);

    expect(mayor.locked).toBe(true);
    expect(menor.locked).toBe(false);
  }, 120_000);
});

describe("suspensión de la sesión del padre", () => {
  it("salir del perfil de un nino devuelve a la rejilla, sin pedir la contrasena", async () => {
    const familia = await crearFamilia();
    const entrada = await entrar(familia.cookies, familia.mayor.id, familia.mayor.pin);
    const childCookie = cookieValue(entrada, PROFILE_COOKIE) ?? "";

    const salida = await request(app)
      .post(`${API_PREFIX}/auth/profiles/leave`)
      .set("Cookie", conNino(familia, childCookie));

    expect(salida.status).toBe(204);
    expect(clearsCookie(salida, PROFILE_COOKIE)).toBe(true);

    // Se vuelve a la REJILLA, no al padre: encontrarse siendo el padre sin
    // haber tecleado nada es justo el agujero que este change cierra.
    const estado = await request(app)
      .get(`${API_PREFIX}/auth/session`)
      .set("Cookie", familia.accountCookies);
    expect(estado.body).toEqual({ actor: null, hasAccount: true });
  }, 60_000);

  it("cambiar de un hijo a otro pide el PIN del segundo", async () => {
    const familia = await crearFamilia();
    await entrar(familia.cookies, familia.mayor.id, familia.mayor.pin);

    const conElPinDelMayor = await entrar(familia.cookies, familia.menor.id, familia.mayor.pin);
    expect(conElPinDelMayor.status).toBe(401);

    const conElSuyo = await entrar(familia.cookies, familia.menor.id, familia.menor.pin);
    expect(conElSuyo.status).toBe(200);
  }, 120_000);

  it("cerrar la sesión del padre se lleva el acceso al perfil del niño", async () => {
    const familia = await crearFamilia();
    const entrada = await entrar(familia.cookies, familia.mayor.id, familia.mayor.pin);
    const childCookie = cookieValue(entrada, PROFILE_COOKIE) ?? "";

    await request(app).post(`${API_PREFIX}/auth/logout`).set("Cookie", familia.cookies);

    const estado = await request(app)
      .get(`${API_PREFIX}/auth/session`)
      .set("Cookie", conNino(familia, childCookie));

    expect(estado.body.actor).toBeNull();
  }, 60_000);

  it("una cookie de niño sin la de su padre no vale nada", async () => {
    const familia = await crearFamilia();
    const entrada = await entrar(familia.cookies, familia.mayor.id, familia.mayor.pin);
    const childCookie = cookieValue(entrada, PROFILE_COOKIE) ?? "";

    const estado = await request(app)
      .get(`${API_PREFIX}/auth/session`)
      .set("Cookie", [`${PROFILE_COOKIE}=${childCookie}`]);

    expect(estado.body.actor).toBeNull();
    // Y se retira, para no dejar una cookie que confunde al front.
    expect(clearsCookie(estado, PROFILE_COOKIE)).toBe(true);
  }, 60_000);

  it("una cookie de niño de OTRA sesión de padre no vale", async () => {
    const familia = await crearFamilia();
    const entrada = await entrar(familia.cookies, familia.mayor.id, familia.mayor.pin);
    const childCookie = cookieValue(entrada, PROFILE_COOKIE) ?? "";

    // El padre entra de nuevo: sesión distinta, la de niño ya no cuelga de ella.
    const otroAcceso = await request(app)
      .post(`${API_PREFIX}/auth/login`)
      .send({ email: CREDENCIALES.correo, password: CREDENCIALES.password });
    const nuevasCookies = (otroAcceso.headers["set-cookie"] as unknown as string[]) ?? [];

    const estado = await request(app)
      .get(`${API_PREFIX}/auth/session`)
      .set("Cookie", [...nuevasCookies, `${PROFILE_COOKIE}=${childCookie}`]);

    // La cuenta nueva vale; el perfil que colgaba de la anterior, no.
    expect(estado.body).toEqual({ actor: null, hasAccount: true });
  }, 120_000);
});

describe("frontera entre el niño y su padre", () => {
  async function sesionDeNino(familia: Familia): Promise<string[]> {
    const entrada = await entrar(familia.cookies, familia.mayor.id, familia.mayor.pin);
    return conNino(familia, cookieValue(entrada, PROFILE_COOKIE) ?? "");
  }

  it("una sesión de niño no puede ejecutar operaciones de padre", async () => {
    const familia = await crearFamilia();
    const nino = await sesionDeNino(familia);

    const cambio = await request(app)
      .post(`${API_PREFIX}/auth/pin`)
      .set("Cookie", nino)
      .send({ currentPin: CREDENCIALES.pin, newPin: "1111" });

    expect(cambio.status).toBe(403);
    expect(cambio.body.code).toBe(ERROR_CODES.FORBIDDEN);
  }, 60_000);

  it("pero SI puede ver la rejilla: la necesita para volver", async () => {
    const familia = await crearFamilia();
    const nino = await sesionDeNino(familia);

    const listado = await request(app).get(`${API_PREFIX}/auth/profiles`).set("Cookie", nino);

    expect(listado.status).toBe(200);
  }, 60_000);

  it("una sesión de niño no puede cambiar ningún PIN, ni el suyo", async () => {
    const familia = await crearFamilia();
    const nino = await sesionDeNino(familia);

    for (const objetivo of [familia.mayor.id, familia.menor.id]) {
      const response = await request(app)
        .post(`${API_PREFIX}/auth/child-profiles/pin`)
        .set("Cookie", nino)
        .send({ childProfileId: objetivo, pin: "0000" });

      expect(response.status).toBe(403);
    }
  }, 60_000);

  it("una sesión de niño no puede cambiar la contraseña del padre", async () => {
    const familia = await crearFamilia();
    const nino = await sesionDeNino(familia);

    const response = await request(app)
      .post(`${API_PREFIX}/auth/password`)
      .set("Cookie", nino)
      .send({ currentPassword: CREDENCIALES.password, newPassword: "otra-larguisima-x" });

    expect(response.status).toBe(403);
  }, 60_000);

  it("el estado de sesión de un niño solo habla de él", async () => {
    const familia = await crearFamilia();
    const nino = await sesionDeNino(familia);

    const estado = await request(app).get(`${API_PREFIX}/auth/session`).set("Cookie", nino);

    expect(estado.body.actor).toMatchObject({ familyRole: "CHILD", name: "Mateo", coins: 120 });
    // Ni rastro del hermano.
    expect(JSON.stringify(estado.body)).not.toContain("Emma");
    expect(JSON.stringify(estado.body)).not.toContain(familia.menor.id);
  }, 60_000);

  it("y dice que la cuenta sigue acreditada detras", async () => {
    const familia = await crearFamilia();
    const nino = await sesionDeNino(familia);

    const estado = await request(app).get(`${API_PREFIX}/auth/session`).set("Cookie", nino);

    // Es lo que permite volver a la rejilla sin reescribir la contrasena.
    expect(estado.body.hasAccount).toBe(true);
  }, 60_000);

  it("salir de un perfil es simetrico: el padre tambien sale del suyo", async () => {
    const familia = await crearFamilia();

    const response = await request(app)
      .post(`${API_PREFIX}/auth/profiles/leave`)
      .set("Cookie", familia.cookies);

    expect(response.status).toBe(204);

    const estado = await request(app)
      .get(`${API_PREFIX}/auth/session`)
      .set("Cookie", familia.accountCookies);
    expect(estado.body).toEqual({ actor: null, hasAccount: true });
  }, 60_000);
});

describe("gestión del PIN por el padre", () => {
  it("el padre cambia el PIN de un hijo suyo y el anterior deja de servir", async () => {
    const familia = await crearFamilia();

    const cambio = await request(app)
      .post(`${API_PREFIX}/auth/child-profiles/pin`)
      .set("Cookie", familia.cookies)
      .send({ childProfileId: familia.mayor.id, pin: "4321" });
    expect(cambio.status).toBe(204);

    await expect(
      entrar(familia.cookies, familia.mayor.id, familia.mayor.pin).then((r) => r.status),
    ).resolves.toBe(401);
    await expect(
      entrar(familia.cookies, familia.mayor.id, "4321").then((r) => r.status),
    ).resolves.toBe(200);
  }, 120_000);

  it("cambiar el PIN desbloquea el perfil", async () => {
    const familia = await crearFamilia();
    for (let i = 0; i < CHILD_MAX_FAILED_ATTEMPTS; i += 1) {
      await entrar(familia.cookies, familia.mayor.id, "9999");
    }

    await request(app)
      .post(`${API_PREFIX}/auth/child-profiles/pin`)
      .set("Cookie", familia.cookies)
      .send({ childProfileId: familia.mayor.id, pin: "4321" });

    const response = await entrar(familia.cookies, familia.mayor.id, "4321");
    expect(response.status).toBe(200);
  }, 120_000);

  it("cambiar el PIN echa fuera a quien estuviera dentro", async () => {
    const familia = await crearFamilia();

    // El nino entra en la tablet de casa.
    const entrada = await entrar(familia.accountCookies, familia.mayor.id, familia.mayor.pin);
    const childCookie = cookieValue(entrada, PROFILE_COOKIE) ?? "";

    // La madre cambia el PIN desde OTRO dispositivo. Tiene que ser otro: en el
    // mismo, entrar al perfil del nino ya habria retirado el suyo, porque nunca
    // hay dos perfiles activos sobre la misma sesion de cuenta.
    const otroDispositivo = await login(app, {
      email: CREDENCIALES.correo,
      password: CREDENCIALES.password,
    });
    const suCuenta = liveCookies(otroDispositivo);
    const suPerfil = await enterProfile(app, suCuenta, PARENT_PROFILE_ID, CREDENCIALES.pin);

    const cambio = await request(app)
      .post(`${API_PREFIX}/auth/child-profiles/pin`)
      .set("Cookie", suPerfil)
      .send({ childProfileId: familia.mayor.id, pin: "4321" });
    expect(cambio.status).toBe(204);

    // Y al nino lo echa: su perfil deja de valer.
    const estado = await request(app)
      .get(`${API_PREFIX}/auth/session`)
      .set("Cookie", conNino(familia, childCookie));

    expect(estado.body).toEqual({ actor: null, hasAccount: true });
  }, 120_000);

  it("un padre no puede tocar el PIN de un hijo ajeno", async () => {
    const nuestra = await crearFamilia();
    const otra = await crearFamilia("otra@monedin.test");

    const response = await request(app)
      .post(`${API_PREFIX}/auth/child-profiles/pin`)
      .set("Cookie", nuestra.cookies)
      .send({ childProfileId: otra.mayor.id, pin: "4321" });

    expect(response.status).toBe(404);
  }, 120_000);

  it("ni desbloquear un perfil ajeno", async () => {
    const nuestra = await crearFamilia();
    const otra = await crearFamilia("otra@monedin.test");

    const response = await request(app)
      .post(`${API_PREFIX}/auth/child-profiles/${otra.mayor.id}/unlock`)
      .set("Cookie", nuestra.cookies);

    expect(response.status).toBe(404);
  }, 120_000);
});
