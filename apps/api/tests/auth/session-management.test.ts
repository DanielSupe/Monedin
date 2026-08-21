import { API_PREFIX, ERROR_CODES } from "@monedin/contracts";
import type { Router } from "express";
import request from "supertest";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { apiRouters, createApp } from "../../src/app.js";
import { generateSessionToken, hashSessionToken } from "../../src/shared/crypto/session-token.js";
import { moduleRouter } from "../../src/shared/http/module-router.js";
import { actorOf, requireChild, requireParent } from "../../src/shared/http/session.js";
import { testPrisma } from "../support/database.js";
import {
  ACCOUNT_COOKIE,
  CREDENCIALES,
  PROFILE_COOKIE,
  asParent,
  clearsCookie,
  cookieValue,
  createChildProfile,
  login,
  parentIdByEmail,
  registerParent,
  resetAuthData,
} from "../support/auth.js";

/**
 * Router de pruebas con una ruta de cada clase, para comprobar la protección
 * sin depender de rutas de producto que todavía no existen.
 */
function probeRouter(): Router {
  const probe = moduleRouter();

  // Definida SIN decir nada: tiene que nacer protegida.
  probe.get("/probe/default", (req, res) => {
    res.status(200).json({ actor: actorOf(req) });
  });

  // Se conforma con la cuenta acreditada: es lo que hace la rejilla.
  probe.accountGet("/probe/account-only", (_req, res) => {
    res.status(200).json({ ok: true });
  });

  probe.publicGet("/probe/public", (_req, res) => {
    res.status(200).json({ ok: true });
  });

  probe.get("/probe/only-parent", requireParent, (_req, res) => {
    res.status(200).json({ ok: true });
  });

  probe.get("/probe/only-child", requireChild, (_req, res) => {
    res.status(200).json({ ok: true });
  });

  return probe.router;
}

const app = createApp([...apiRouters, probeRouter()]);

beforeEach(async () => {
  await resetAuthData();
});

// Estos tests CONFIRMAN datos: no pueden usar transacciones deshechas porque
// llaman a la app, que abre las suyas. Así que limpian al terminar, para no
// dejar la base con restos que confundan a los tests de otros archivos.
afterAll(async () => {
  await resetAuthData();
});

describe("almacenamiento del identificador de sesión", () => {
  it("la tabla no contiene ningún identificador utilizable", async () => {
    const response = await request(app).post(`${API_PREFIX}/auth/register`).send({
      name: CREDENCIALES.nombre,
      email: CREDENCIALES.correo,
      password: CREDENCIALES.password,
      pin: CREDENCIALES.pin,
    });
    const token = cookieValue(response, ACCOUNT_COOKIE) ?? "";

    const sesiones = await testPrisma().session.findMany({ select: { tokenHash: true } });

    expect(sesiones).toHaveLength(1);
    expect(sesiones[0]?.tokenHash).not.toBe(token);
    expect(sesiones[0]?.tokenHash).not.toContain(token);
    // Lo guardado es el hash del identificador, y solo se puede ir en un sentido.
    expect(sesiones[0]?.tokenHash).toBe(hashSessionToken(token));
  }, 60_000);

  it("el identificador es impredecible y siempre distinto", () => {
    const generados = new Set(Array.from({ length: 200 }, () => generateSessionToken()));

    expect(generados.size).toBe(200);
    // 32 bytes en base64url.
    for (const token of generados) {
      expect(token.length).toBeGreaterThanOrEqual(42);
      expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
    }
  });

  it("el identificador no viaja en el cuerpo ni en la URL", async () => {
    const response = await request(app).post(`${API_PREFIX}/auth/register`).send({
      name: CREDENCIALES.nombre,
      email: CREDENCIALES.correo,
      password: CREDENCIALES.password,
      pin: CREDENCIALES.pin,
    });
    const token = cookieValue(response, ACCOUNT_COOKIE) ?? "";

    expect(JSON.stringify(response.body)).not.toContain(token);
  }, 60_000);
});

describe("banderas de la cookie", () => {
  it("es inaccesible desde JavaScript y restringida al mismo sitio", async () => {
    const response = await request(app).post(`${API_PREFIX}/auth/register`).send({
      name: CREDENCIALES.nombre,
      email: CREDENCIALES.correo,
      password: CREDENCIALES.password,
      pin: CREDENCIALES.pin,
    });

    const cookie = (response.headers["set-cookie"] as unknown as string[]).find((c) =>
      c.startsWith("monedin_session="),
    );

    expect(cookie).toContain("HttpOnly");
    expect(cookie).toMatch(/SameSite=Lax/i);
  }, 60_000);
});

describe("caducidad", () => {
  it("una sesión caducada no da acceso y su cookie se retira", async () => {
    const { cookies } = await registerParent(app);

    await testPrisma().session.updateMany({ data: { expiresAt: new Date(Date.now() - 1000) } });

    const estado = await request(app).get(`${API_PREFIX}/auth/session`).set("Cookie", cookies);

    expect(estado.body).toEqual({ actor: null, hasAccount: false });
    expect(clearsCookie(estado, ACCOUNT_COOKIE)).toBe(true);
  }, 60_000);

  it("el uso prolonga la caducidad cuando ya ha consumido buena parte de su vida", async () => {
    const { cookies } = await registerParent(app);

    // Se deja la sesión a punto de caducar.
    const casiCaducada = new Date(Date.now() + 60_000);
    await testPrisma().session.updateMany({ data: { expiresAt: casiCaducada } });

    await request(app).get(`${API_PREFIX}/auth/session`).set("Cookie", cookies);

    const sesion = await testPrisma().session.findFirstOrThrow({ select: { expiresAt: true } });
    expect(sesion.expiresAt.getTime()).toBeGreaterThan(casiCaducada.getTime());
  }, 60_000);

  it("un perfil no sobrevive a la caducidad de su cuenta", async () => {
    const { cookies } = await registerParent(app);
    const parentId = await parentIdByEmail(CREDENCIALES.correo);
    const hijo = await createChildProfile(parentId, { pin: "1234" });

    const entrada = await request(app)
      .post(`${API_PREFIX}/auth/profiles/enter`)
      .set("Cookie", cookies)
      .send({ profileId: hijo.id, pin: "1234" });
    const childCookie = cookieValue(entrada, PROFILE_COOKIE) ?? "";

    // Caduca la sesión de CUENTA.
    await testPrisma().session.updateMany({
      where: { parentSessionId: null },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });

    const estado = await request(app)
      .get(`${API_PREFIX}/auth/session`)
      .set("Cookie", [...cookies, `${PROFILE_COOKIE}=${childCookie}`]);

    expect(estado.body.actor).toBeNull();
  }, 120_000);
});

describe("revocación", () => {
  it("cerrar sesión revoca en el servidor, no solo borra la cookie", async () => {
    const { cookies } = await registerParent(app);

    const cierre = await request(app).post(`${API_PREFIX}/auth/logout`).set("Cookie", cookies);
    expect(cierre.status).toBe(204);
    expect(clearsCookie(cierre, ACCOUNT_COOKIE)).toBe(true);

    // La fila ya no está...
    expect(await testPrisma().session.count()).toBe(0);

    // ...así que presentar de nuevo la misma cookie no vale.
    const estado = await request(app).get(`${API_PREFIX}/auth/session`).set("Cookie", cookies);
    expect(estado.body).toEqual({ actor: null, hasAccount: false });
  }, 60_000);

  it("una cookie conservada deja de valer en cuanto se revoca", async () => {
    const { cookies } = await registerParent(app);

    // Alguien se queda una copia y la sesión se revoca por otro lado.
    await testPrisma().session.deleteMany({});

    const estado = await request(app).get(`${API_PREFIX}/auth/session`).set("Cookie", cookies);

    expect(estado.body).toEqual({ actor: null, hasAccount: false });
  }, 60_000);

  it("cerrar la cuenta se lleva por cascada el perfil activo", async () => {
    const { cookies } = await registerParent(app);
    const parentId = await parentIdByEmail(CREDENCIALES.correo);
    const hijo = await createChildProfile(parentId, { pin: "1234" });

    await request(app)
      .post(`${API_PREFIX}/auth/profiles/enter`)
      .set("Cookie", cookies)
      .send({ profileId: hijo.id, pin: "1234" });

    expect(await testPrisma().session.count()).toBe(2);

    await request(app).post(`${API_PREFIX}/auth/logout`).set("Cookie", cookies);

    expect(await testPrisma().session.count()).toBe(0);
  }, 120_000);

  it("cerrar sesión sin tenerla no es un error", async () => {
    const response = await request(app).post(`${API_PREFIX}/auth/logout`);

    expect(response.status).toBe(204);
  });
});

describe("resolución del actor", () => {
  it("el perfil del padre activo da un actor de padre", async () => {
    const { cookies } = await asParent(app);

    const response = await request(app).get(`${API_PREFIX}/probe/default`).set("Cookie", cookies);

    expect(response.status).toBe(200);
    expect(response.body.actor).toEqual({
      familyRole: "PARENT",
      userId: await parentIdByEmail(CREDENCIALES.correo),
    });
  }, 60_000);

  it("una sesión de niño da un actor de niño CON el identificador de su padre", async () => {
    const { cookies } = await registerParent(app);
    const parentId = await parentIdByEmail(CREDENCIALES.correo);
    const hijo = await createChildProfile(parentId, { pin: "1234" });

    const entrada = await request(app)
      .post(`${API_PREFIX}/auth/profiles/enter`)
      .set("Cookie", cookies)
      .send({ profileId: hijo.id, pin: "1234" });
    const childCookie = cookieValue(entrada, PROFILE_COOKIE) ?? "";

    const response = await request(app)
      .get(`${API_PREFIX}/probe/default`)
      .set("Cookie", [...cookies, `${PROFILE_COOKIE}=${childCookie}`]);

    expect(response.body.actor).toEqual({
      familyRole: "CHILD",
      childProfileId: hijo.id,
      // Sin esto, cada servicio necesitaría una consulta extra para saber de qué
      // familia es quien llama.
      parentId,
    });
  }, 120_000);
});

describe("las rutas nacen protegidas", () => {
  it("una ruta definida sin decir nada responde 401 sin sesión", async () => {
    const response = await request(app).get(`${API_PREFIX}/probe/default`);

    expect(response.status).toBe(401);
    expect(response.body.code).toBe(ERROR_CODES.UNAUTHORIZED);
  });

  it("y no ejecuta nada de la lógica", async () => {
    const response = await request(app).get(`${API_PREFIX}/probe/default`);

    expect(response.body).not.toHaveProperty("actor");
  });

  it("responde 401 TAMBIÉN con cuenta acreditada y sin perfil elegido", async () => {
    const { cookies } = await registerParent(app);

    const response = await request(app).get(`${API_PREFIX}/probe/default`).set("Cookie", cookies);

    // Es la frontera del change: la cookie acredita el dispositivo, no concede
    // poderes. Sin esto, la rejilla se rodearía llamando al endpoint.
    expect(response.status).toBe(401);
  }, 60_000);

  it("una ruta de solo cuenta SÍ responde con la cuenta acreditada", async () => {
    const { cookies } = await registerParent(app);

    const response = await request(app)
      .get(`${API_PREFIX}/probe/account-only`)
      .set("Cookie", cookies);

    expect(response.status).toBe(200);
  }, 60_000);

  it("pero una ruta de solo cuenta sigue exigiendo cuenta", async () => {
    const response = await request(app).get(`${API_PREFIX}/probe/account-only`);

    expect(response.status).toBe(401);
  });

  it("una ruta declarada pública responde sin sesión", async () => {
    const response = await request(app).get(`${API_PREFIX}/probe/public`);

    expect(response.status).toBe(200);
  });

  it("la sonda de salud sigue siendo pública", async () => {
    const response = await request(app).get(`${API_PREFIX}/health`);

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("ok");
  });

  it("el estado de sesión es público, porque el front lo llama antes de tener ninguna", async () => {
    const response = await request(app).get(`${API_PREFIX}/auth/session`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ actor: null, hasAccount: false });
  });
});

describe("guardianes de rol", () => {
  it("un niño en una ruta de padre recibe 403", async () => {
    const { cookies } = await registerParent(app);
    const parentId = await parentIdByEmail(CREDENCIALES.correo);
    const hijo = await createChildProfile(parentId, { pin: "1234" });

    const entrada = await request(app)
      .post(`${API_PREFIX}/auth/profiles/enter`)
      .set("Cookie", cookies)
      .send({ profileId: hijo.id, pin: "1234" });
    const childCookie = cookieValue(entrada, PROFILE_COOKIE) ?? "";

    const response = await request(app)
      .get(`${API_PREFIX}/probe/only-parent`)
      .set("Cookie", [...cookies, `${PROFILE_COOKIE}=${childCookie}`]);

    expect(response.status).toBe(403);
  }, 120_000);

  it("un padre en una ruta de niño recibe 403", async () => {
    const { cookies } = await asParent(app);

    const response = await request(app)
      .get(`${API_PREFIX}/probe/only-child`)
      .set("Cookie", cookies);

    expect(response.status).toBe(403);
  }, 60_000);

  it("sin sesión, una ruta de rol responde 401 y no 403", async () => {
    const response = await request(app).get(`${API_PREFIX}/probe/only-parent`);

    expect(response.status).toBe(401);
  });

  it("el rol correcto NO autoriza sobre un recurso ajeno", async () => {
    // Un padre con el rol correcto llamando a una ruta de padre, pero sobre un
    // perfil de otra familia: la comprobación de rol le deja pasar y la del
    // servicio lo rechaza igualmente.
    const nuestra = await asParent(app);
    const otraFamilia = await asParent(app, { email: "otra@monedin.test" });
    const otroParentId = await parentIdByEmail("otra@monedin.test");
    const suHijo = await createChildProfile(otroParentId, { pin: "1234" });
    expect(otraFamilia.cookies.length).toBeGreaterThan(0);

    const response = await request(app)
      .post(`${API_PREFIX}/auth/child-profiles/pin`)
      .set("Cookie", nuestra.cookies)
      .send({ childProfileId: suHijo.id, pin: "4321" });

    expect(response.status).toBe(404);
  }, 120_000);
});

describe("estado de la sesión", () => {
  it("sin sesión responde 200, no 401", async () => {
    const response = await request(app).get(`${API_PREFIX}/auth/session`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ actor: null, hasAccount: false });
  });

  it("con cuenta y sin perfil lo dice, y no es un error", async () => {
    const { cookies } = await registerParent(app);

    const response = await request(app).get(`${API_PREFIX}/auth/session`).set("Cookie", cookies);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ actor: null, hasAccount: true });
  }, 60_000);

  it("nunca expone credenciales ni el identificador de sesión", async () => {
    const { cookies } = await asParent(app);
    const token = cookies.join(";");

    const response = await request(app).get(`${API_PREFIX}/auth/session`).set("Cookie", cookies);
    const cuerpo = JSON.stringify(response.body);

    expect(cuerpo).not.toContain(CREDENCIALES.password);
    expect(cuerpo).not.toContain("passwordHash");
    expect(cuerpo).not.toContain("tokenHash");
    for (const fragmento of token.split(/[=;]/).filter((f) => f.length > 20)) {
      expect(cuerpo).not.toContain(fragmento);
    }
  }, 60_000);

  it("con un niño incluye su saldo", async () => {
    const { cookies } = await registerParent(app);
    const parentId = await parentIdByEmail(CREDENCIALES.correo);
    const hijo = await createChildProfile(parentId, { pin: "1234", coins: 77 });

    const entrada = await request(app)
      .post(`${API_PREFIX}/auth/profiles/enter`)
      .set("Cookie", cookies)
      .send({ profileId: hijo.id, pin: "1234" });
    const childCookie = cookieValue(entrada, PROFILE_COOKIE) ?? "";

    const estado = await request(app)
      .get(`${API_PREFIX}/auth/session`)
      .set("Cookie", [...cookies, `${PROFILE_COOKIE}=${childCookie}`]);

    expect(estado.body.actor).toMatchObject({ familyRole: "CHILD", coins: 77 });
    expect(estado.body.hasAccount).toBe(true);
  }, 120_000);

  it("acceder de nuevo descarta el perfil activo", async () => {
    const { cookies } = await registerParent(app);
    const parentId = await parentIdByEmail(CREDENCIALES.correo);
    const hijo = await createChildProfile(parentId, { pin: "1234" });

    await request(app)
      .post(`${API_PREFIX}/auth/profiles/enter`)
      .set("Cookie", cookies)
      .send({ profileId: hijo.id, pin: "1234" });

    const acceso = await login(app, {
      email: CREDENCIALES.correo,
      password: CREDENCIALES.password,
    });

    expect(clearsCookie(acceso, PROFILE_COOKIE)).toBe(true);
  }, 120_000);
});
