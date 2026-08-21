import {
  API_PREFIX,
  DEFAULT_AVATAR_KEY,
  ERROR_CODES,
  PARENT_PIN_MAX_FAILED_ATTEMPTS,
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
  login,
  liveCookies,
  parentIdByEmail,
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

function entrar(cookies: string[], profileId: string, pin: string): request.Test {
  return request(app)
    .post(`${API_PREFIX}/auth/profiles/enter`)
    .set("Cookie", cookies)
    .send({ profileId, pin });
}

function listar(cookies: string[]): request.Test {
  return request(app).get(`${API_PREFIX}/auth/profiles`).set("Cookie", cookies);
}

describe("la rejilla ofrece todos los perfiles de la familia", () => {
  it("incluye al padre y a cada hijo activo", async () => {
    const { cookies } = await registerParent(app);
    const parentId = await parentIdByEmail(CREDENCIALES.correo);
    await createChildProfile(parentId, { name: "Mateo", pin: "1234" });
    await createChildProfile(parentId, { name: "Emma", pin: "5678" });

    const response = await listar(cookies);

    expect(response.status).toBe(200);
    expect(response.body.profiles).toHaveLength(3);
    expect(response.body.profiles[0]).toMatchObject({
      id: PARENT_PROFILE_ID,
      familyRole: "PARENT",
      name: CREDENCIALES.nombre,
    });
    expect(response.body.profiles.slice(1).map((p: { name: string }) => p.name)).toEqual([
      "Mateo",
      "Emma",
    ]);
  }, 60_000);

  it("una familia sin hijos ve su perfil y no una pantalla vacía", async () => {
    const { cookies } = await registerParent(app);

    const response = await listar(cookies);

    expect(response.body.profiles).toHaveLength(1);
    expect(response.body.profiles[0].familyRole).toBe("PARENT");
  }, 60_000);

  it("cada perfil trae su avatar, y uno por defecto si no tiene", async () => {
    const { cookies } = await registerParent(app);
    const parentId = await parentIdByEmail(CREDENCIALES.correo);
    await createChildProfile(parentId, { name: "Con avatar", pin: "1234", avatar: "zorro" });
    await createChildProfile(parentId, { name: "Sin avatar", pin: "5678" });

    const { profiles } = (await listar(cookies)).body;

    expect(profiles[1].avatar).toBe("zorro");
    expect(profiles[2].avatar).toBe(DEFAULT_AVATAR_KEY);
    // El padre tampoco se queda sin cara.
    expect(profiles[0].avatar).toBe(DEFAULT_AVATAR_KEY);
  }, 60_000);

  it("no expone saldo ni edad antes de entrar", async () => {
    const { cookies } = await registerParent(app);
    const parentId = await parentIdByEmail(CREDENCIALES.correo);
    await createChildProfile(parentId, { name: "Mateo", pin: "1234", coins: 999 });

    const cuerpo = JSON.stringify((await listar(cookies)).body);

    expect(cuerpo).not.toContain("999");
    expect(cuerpo).not.toContain("coins");
    expect(cuerpo).not.toContain("pinHash");
    expect(cuerpo).not.toContain("email");
  }, 60_000);

  it("sin sesión de cuenta no hay rejilla", async () => {
    const response = await request(app).get(`${API_PREFIX}/auth/profiles`);

    expect(response.status).toBe(401);
  });

  it("no aparece ningún perfil de otra familia", async () => {
    const nuestra = await registerParent(app);
    const otroId = await (async () => {
      await registerParent(app, { email: "otra@monedin.test" });
      return parentIdByEmail("otra@monedin.test");
    })();
    await createChildProfile(otroId, { name: "Ajeno", pin: "1234" });

    const { profiles } = (await listar(nuestra.cookies)).body;

    expect(profiles.map((p: { name: string }) => p.name)).not.toContain("Ajeno");
  }, 120_000);
});

describe("elegir perfil es obligatorio antes de operar", () => {
  it("no se puede rodear la rejilla llamando al endpoint", async () => {
    const { cookies } = await registerParent(app);
    const parentId = await parentIdByEmail(CREDENCIALES.correo);
    const hijo = await createChildProfile(parentId, { pin: "1234" });

    // Con solo la cuenta, una operación reservada al padre se rechaza igual que
    // si no hubiera sesión. Es lo que hace que el PIN de adulto sea una
    // frontera y no una pantalla.
    const response = await request(app)
      .post(`${API_PREFIX}/auth/child-profiles/pin`)
      .set("Cookie", cookies)
      .send({ childProfileId: hijo.id, pin: "4321" });

    expect(response.status).toBe(401);
  }, 60_000);

  it("con el perfil del padre activo, la misma operación funciona", async () => {
    const { cookies, parentId } = await asParent(app);
    const hijo = await createChildProfile(parentId, { pin: "1234" });

    const response = await request(app)
      .post(`${API_PREFIX}/auth/child-profiles/pin`)
      .set("Cookie", cookies)
      .send({ childProfileId: hijo.id, pin: "4321" });

    expect(response.status).toBe(204);
  }, 60_000);
});

describe("entrar al perfil del padre", () => {
  it("con el PIN correcto queda activo, sin pedir la contraseña", async () => {
    const { cookies } = await registerParent(app);

    const response = await entrar(cookies, PARENT_PROFILE_ID, CREDENCIALES.pin);

    expect(response.status).toBe(200);
    expect(response.body.actor).toMatchObject({
      familyRole: "PARENT",
      name: CREDENCIALES.nombre,
    });
    expect(cookieValue(response, PROFILE_COOKIE)).toBeTruthy();
  }, 60_000);

  it("con el PIN equivocado no queda perfil activo y la cuenta sigue intacta", async () => {
    const { cookies } = await registerParent(app);

    const response = await entrar(cookies, PARENT_PROFILE_ID, "9999");

    expect(response.status).toBe(401);
    expect(cookieValue(response, PROFILE_COOKIE)).toBeUndefined();

    const estado = await request(app).get(`${API_PREFIX}/auth/session`).set("Cookie", cookies);
    expect(estado.body).toEqual({ actor: null, hasAccount: true });
  }, 60_000);

  it("el PIN del padre no sirve para el perfil de un hijo, ni al revés", async () => {
    const { cookies } = await registerParent(app);
    const parentId = await parentIdByEmail(CREDENCIALES.correo);
    const hijo = await createChildProfile(parentId, { pin: "1234" });

    await expect(entrar(cookies, hijo.id, CREDENCIALES.pin).then((r) => r.status)).resolves.toBe(
      401,
    );
    await expect(entrar(cookies, PARENT_PROFILE_ID, "1234").then((r) => r.status)).resolves.toBe(
      401,
    );
  }, 60_000);

  it("el PIN del padre no aparece en el almacén ni en las respuestas", async () => {
    const { cookies } = await registerParent(app);
    const response = await entrar(cookies, PARENT_PROFILE_ID, CREDENCIALES.pin);

    expect(JSON.stringify(response.body)).not.toContain(CREDENCIALES.pin);

    const parent = await testPrisma().user.findUniqueOrThrow({
      where: { email: CREDENCIALES.correo },
      select: { pinHash: true },
    });
    expect(parent.pinHash).not.toContain(CREDENCIALES.pin);
    expect(parent.pinHash.startsWith("scrypt$")).toBe(true);
  }, 60_000);

  it("un padre y un hijo con el mismo PIN guardan hashes distintos", async () => {
    await registerParent(app, { pin: "1234" });
    const parentId = await parentIdByEmail(CREDENCIALES.correo);
    await createChildProfile(parentId, { pin: "1234" });

    const parent = await testPrisma().user.findUniqueOrThrow({
      where: { id: parentId },
      select: { pinHash: true },
    });
    const child = await testPrisma().childProfile.findFirstOrThrow({ select: { pinHash: true } });

    expect(parent.pinHash).not.toBe(child.pinHash);
  }, 60_000);
});

describe("bloqueo del perfil del padre", () => {
  async function fallar(cookies: string[], veces: number): Promise<void> {
    for (let i = 0; i < veces; i += 1) {
      await entrar(cookies, PARENT_PROFILE_ID, "9999");
    }
  }

  it("al alcanzar el límite rechaza aunque el PIN sea correcto", async () => {
    const { cookies } = await registerParent(app);
    await fallar(cookies, PARENT_PIN_MAX_FAILED_ATTEMPTS);

    const response = await entrar(cookies, PARENT_PROFILE_ID, CREDENCIALES.pin);

    expect(response.status).toBe(429);
    expect(response.body.code).toBe(ERROR_CODES.TOO_MANY_ATTEMPTS);
  }, 180_000);

  it("bloquear el PIN NO bloquea la contraseña", async () => {
    const { cookies } = await registerParent(app);
    await fallar(cookies, PARENT_PIN_MAX_FAILED_ATTEMPTS);

    // Son dos fronteras distintas y se cuentan aparte: un niño aporreando el
    // PIN de su madre no puede dejarla sin poder entrar desde su móvil.
    const acceso = await login(app, {
      email: CREDENCIALES.correo,
      password: CREDENCIALES.password,
    });

    expect(acceso.status).toBe(200);
  }, 180_000);

  it("ni bloquea a los hijos", async () => {
    const { cookies } = await registerParent(app);
    const parentId = await parentIdByEmail(CREDENCIALES.correo);
    const hijo = await createChildProfile(parentId, { pin: "1234" });
    await fallar(cookies, PARENT_PIN_MAX_FAILED_ATTEMPTS);

    const response = await entrar(cookies, hijo.id, "1234");

    expect(response.status).toBe(200);
  }, 180_000);

  it("la rejilla señala que el perfil del padre está bloqueado", async () => {
    const { cookies } = await registerParent(app);
    await fallar(cookies, PARENT_PIN_MAX_FAILED_ATTEMPTS);

    const { profiles } = (await listar(cookies)).body;

    expect(profiles[0].locked).toBe(true);
  }, 180_000);

  it("el bloqueo caduca", async () => {
    const { cookies } = await registerParent(app);
    await fallar(cookies, PARENT_PIN_MAX_FAILED_ATTEMPTS);

    await testPrisma().user.update({
      where: { email: CREDENCIALES.correo },
      data: { pinLockedUntil: new Date(Date.now() - 1000) },
    });

    const response = await entrar(cookies, PARENT_PROFILE_ID, CREDENCIALES.pin);
    expect(response.status).toBe(200);
  }, 180_000);

  it("acertar antes del límite pone el contador a cero", async () => {
    const { cookies } = await registerParent(app);
    await fallar(cookies, PARENT_PIN_MAX_FAILED_ATTEMPTS - 1);

    expect((await entrar(cookies, PARENT_PROFILE_ID, CREDENCIALES.pin)).status).toBe(200);

    const parent = await testPrisma().user.findUniqueOrThrow({
      where: { email: CREDENCIALES.correo },
      select: { failedPinAttempts: true, pinLockedUntil: true },
    });
    expect(parent.failedPinAttempts).toBe(0);
    expect(parent.pinLockedUntil).toBeNull();
  }, 180_000);
});

describe("cambiar y restablecer el PIN de adulto", () => {
  it("con el actual correcto queda en vigor el nuevo", async () => {
    const { cookies } = await asParent(app);

    const cambio = await request(app)
      .post(`${API_PREFIX}/auth/pin`)
      .set("Cookie", cookies)
      .send({ currentPin: CREDENCIALES.pin, newPin: "1357" });
    expect(cambio.status).toBe(204);

    const otra = liveCookies(
      await login(app, { email: CREDENCIALES.correo, password: CREDENCIALES.password }),
    );
    await expect(entrar(otra, PARENT_PROFILE_ID, CREDENCIALES.pin).then((r) => r.status)).resolves.toBe(401);
    await expect(entrar(otra, PARENT_PROFILE_ID, "1357").then((r) => r.status)).resolves.toBe(200);
  }, 120_000);

  it("con el actual incorrecto se rechaza y el anterior sigue valiendo", async () => {
    const { cookies } = await asParent(app);

    const cambio = await request(app)
      .post(`${API_PREFIX}/auth/pin`)
      .set("Cookie", cookies)
      .send({ currentPin: "0000", newPin: "1357" });

    expect(cambio.status).toBe(401);
  }, 120_000);

  it("se restablece con la contraseña, sin necesitar perfil activo", async () => {
    const { cookies } = await registerParent(app);

    // Sin perfil elegido: es justo la situación de quien olvidó su PIN.
    const reset = await request(app)
      .post(`${API_PREFIX}/auth/pin/reset`)
      .set("Cookie", cookies)
      .send({ password: CREDENCIALES.password, newPin: "1357" });

    expect(reset.status).toBe(204);
    await expect(entrar(cookies, PARENT_PROFILE_ID, "1357").then((r) => r.status)).resolves.toBe(
      200,
    );
  }, 120_000);

  it("restablecerlo desbloquea a un padre que se quedó fuera", async () => {
    const { cookies } = await registerParent(app);
    for (let i = 0; i < PARENT_PIN_MAX_FAILED_ATTEMPTS; i += 1) {
      await entrar(cookies, PARENT_PROFILE_ID, "9999");
    }

    await request(app)
      .post(`${API_PREFIX}/auth/pin/reset`)
      .set("Cookie", cookies)
      .send({ password: CREDENCIALES.password, newPin: "1357" });

    const response = await entrar(cookies, PARENT_PROFILE_ID, "1357");
    expect(response.status).toBe(200);
  }, 180_000);

  it("con la contraseña equivocada no se restablece", async () => {
    const { cookies } = await registerParent(app);

    const reset = await request(app)
      .post(`${API_PREFIX}/auth/pin/reset`)
      .set("Cookie", cookies)
      .send({ password: "no-es-esta-x", newPin: "1357" });

    expect(reset.status).toBe(401);
    await expect(
      entrar(cookies, PARENT_PROFILE_ID, CREDENCIALES.pin).then((r) => r.status),
    ).resolves.toBe(200);
  }, 120_000);
});

describe("cambiar de perfil y volver a la rejilla", () => {
  it("no quedan dos perfiles activos a la vez", async () => {
    const { cookies } = await registerParent(app);
    const parentId = await parentIdByEmail(CREDENCIALES.correo);
    const hijo = await createChildProfile(parentId, { pin: "1234" });

    await enterProfile(app, cookies, PARENT_PROFILE_ID, CREDENCIALES.pin);
    await enterProfile(app, cookies, hijo.id, "1234");

    const perfiles = await testPrisma().session.count({ where: { parentSessionId: { not: null } } });
    expect(perfiles).toBe(1);
  }, 120_000);

  it("salir deja la cuenta viva y devuelve a la rejilla", async () => {
    const { cookies, accountCookies } = await asParent(app);

    const salida = await request(app)
      .post(`${API_PREFIX}/auth/profiles/leave`)
      .set("Cookie", cookies);

    expect(salida.status).toBe(204);
    expect(clearsCookie(salida, PROFILE_COOKIE)).toBe(true);

    const estado = await request(app)
      .get(`${API_PREFIX}/auth/session`)
      .set("Cookie", accountCookies);
    expect(estado.body).toEqual({ actor: null, hasAccount: true });
  }, 60_000);

  it("salir sin estar dentro no es un error", async () => {
    const { cookies } = await registerParent(app);

    const salida = await request(app)
      .post(`${API_PREFIX}/auth/profiles/leave`)
      .set("Cookie", cookies);

    expect(salida.status).toBe(204);
  }, 60_000);
});

describe("forma de las filas de sesión", () => {
  it("una sesión de cuenta no apunta a ningún perfil", async () => {
    await registerParent(app);

    const cuenta = await testPrisma().session.findFirstOrThrow({
      where: { parentSessionId: null },
      select: { childProfileId: true },
    });

    expect(cuenta.childProfileId).toBeNull();
  }, 60_000);

  it("el perfil del padre es una fila sin hijo colgando de su cuenta", async () => {
    const { accountCookies } = await asParent(app);
    expect(accountCookies.length).toBeGreaterThan(0);

    const perfil = await testPrisma().session.findFirstOrThrow({
      where: { parentSessionId: { not: null } },
      select: { childProfileId: true, parentSessionId: true },
    });

    expect(perfil.childProfileId).toBeNull();
    expect(perfil.parentSessionId).not.toBeNull();
  }, 60_000);

  it("el motor rechaza una sesión de cuenta que apunte a un hijo", async () => {
    const { cookies } = await registerParent(app);
    const parentId = await parentIdByEmail(CREDENCIALES.correo);
    const hijo = await createChildProfile(parentId, { pin: "1234" });
    expect(cookies.length).toBeGreaterThan(0);

    // Sin sesión padre detrás es una cuenta, y una cuenta no puede tener perfil.
    await expect(
      testPrisma().session.create({
        data: {
          tokenHash: "f".repeat(64),
          userId: parentId,
          childProfileId: hijo.id,
          expiresAt: new Date(Date.now() + 60_000),
        },
      }),
    ).rejects.toThrow();
  }, 60_000);
});
