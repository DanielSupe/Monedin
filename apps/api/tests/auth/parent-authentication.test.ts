import { API_PREFIX, ERROR_CODES, PARENT_MAX_FAILED_ATTEMPTS } from "@monedin/contracts";
import request from "supertest";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createApp } from "../../src/app.js";
import { testPrisma } from "../support/database.js";
import {
  ACCOUNT_COOKIE,
  CREDENCIALES,
  asParent,
  cookieValue,
  login,
  parentIdByEmail,
  registerParent,
  resetAuthData,
} from "../support/auth.js";

const app = createApp();

beforeEach(async () => {
  await resetAuthData();
});

// Estos tests CONFIRMAN datos: no pueden usar transacciones deshechas porque
// llaman a la app, que abre las suyas. Así que limpian al terminar, para no
// dejar la base con restos que confundan a los tests de otros archivos.
afterAll(async () => {
  await resetAuthData();
});

describe("registro de un padre", () => {
  it("crea la cuenta y deja la sesión iniciada", async () => {
    const response = await request(app).post(`${API_PREFIX}/auth/register`).send({
      name: CREDENCIALES.nombre,
      email: CREDENCIALES.correo,
      password: CREDENCIALES.password,
      pin: CREDENCIALES.pin,
    });

    expect(response.status).toBe(201);
    // La cuenta queda acreditada: no hay que acceder acto seguido.
    expect(cookieValue(response, ACCOUNT_COOKIE)).toBeTruthy();
    // Pero NO deja perfil activo: se llega a la rejilla, como en cualquier
    // apertura posterior.
    expect(response.body).toEqual({ actor: null, hasAccount: true });
  });

  it("exige el PIN de adulto al registrarse", async () => {
    const response = await request(app).post(`${API_PREFIX}/auth/register`).send({
      name: CREDENCIALES.nombre,
      email: CREDENCIALES.correo,
      password: CREDENCIALES.password,
    });

    expect(response.status).toBe(422);
    expect(response.body.details.map((d: { field: string }) => d.field)).toContain("pin");
  });

  it("rechaza un PIN que no son cuatro dígitos", async () => {
    const response = await request(app).post(`${API_PREFIX}/auth/register`).send({
      name: CREDENCIALES.nombre,
      email: CREDENCIALES.correo,
      password: CREDENCIALES.password,
      pin: "12",
    });

    expect(response.status).toBe(422);
  });

  it("rechaza un correo ya registrado", async () => {
    await registerParent(app);

    const response = await request(app).post(`${API_PREFIX}/auth/register`).send({
      name: "Otro",
      email: CREDENCIALES.correo,
      password: "otra-contraseña-decente",
      pin: CREDENCIALES.pin,
    });

    expect(response.status).toBe(409);
    expect(response.body.code).toBe(ERROR_CODES.CONFLICT);
  });

  it("normaliza el correo, para que no haya dos cuentas por mayúsculas", async () => {
    await registerParent(app, { email: "Lucia@Monedin.Test" });

    const response = await request(app).post(`${API_PREFIX}/auth/register`).send({
      name: "Otra",
      email: "lucia@monedin.test",
      password: "otra-contraseña-decente",
      pin: CREDENCIALES.pin,
    });

    expect(response.status).toBe(409);
  });

  it("rechaza una contraseña demasiado corta señalando el campo", async () => {
    const response = await request(app).post(`${API_PREFIX}/auth/register`).send({
      name: CREDENCIALES.nombre,
      email: CREDENCIALES.correo,
      password: "corta",
      pin: CREDENCIALES.pin,
    });

    expect(response.status).toBe(422);
    expect(response.body.details.map((d: { field: string }) => d.field)).toContain("password");
    // Y no queda nada a medio crear.
    expect(await testPrisma().user.count()).toBe(0);
  });

  it("no existe ninguna vía pública de registro de niños", async () => {
    // Se recorren los métodos públicos del router de auth: ninguno crea perfiles.
    const intentos = await Promise.all([
      request(app).post(`${API_PREFIX}/auth/profiles`).send({ name: "Colado", pin: "1234" }),
      request(app).post(`${API_PREFIX}/auth/profiles/enter`).send({ profileId: "x", pin: "1234" }),
    ]);

    for (const intento of intentos) {
      expect([401, 404]).toContain(intento.status);
    }
    expect(await testPrisma().childProfile.count()).toBe(0);
  });
});

describe("acceso con correo y contraseña", () => {
  beforeEach(async () => {
    await registerParent(app);
  });

  it("con credenciales correctas da sesión", async () => {
    const response = await login(app, {
      email: CREDENCIALES.correo,
      password: CREDENCIALES.password,
    });

    expect(response.status).toBe(200);
    // Acredita la cuenta y manda a la rejilla; todavía no es nadie.
    expect(response.body).toEqual({ actor: null, hasAccount: true });
    expect(cookieValue(response, ACCOUNT_COOKIE)).toBeTruthy();
  });

  it("con la contraseña equivocada rechaza sin decir cuál de los dos falla", async () => {
    const response = await login(app, { email: CREDENCIALES.correo, password: "no-es-esta-x" });

    expect(response.status).toBe(401);
    // El mensaje nombra AMBOS a propósito: es lo que lo hace ambiguo. Lo que no
    // puede hacer es señalar uno solo.
    expect(response.body.message).toMatch(/correo/i);
    expect(response.body.message).toMatch(/contraseñ/i);
    expect(response.body.message).not.toMatch(/no (existe|está registrad)/i);
    expect(response.body.message).not.toMatch(/contraseña (es )?incorrecta/i);
  });

  it("un correo inexistente responde exactamente igual", async () => {
    const malaPassword = await login(app, {
      email: CREDENCIALES.correo,
      password: "no-es-esta-x",
    });
    const noExiste = await login(app, { email: "nadie@monedin.test", password: "no-es-esta-x" });

    expect(noExiste.status).toBe(malaPassword.status);
    expect(noExiste.body).toEqual(malaPassword.body);
  });

  it("y tampoco se distingue por lo que tarda", async () => {
    async function medir(email: string): Promise<number> {
      const inicio = performance.now();
      await login(app, { email, password: "una-contraseña-cualquiera" });
      return performance.now() - inicio;
    }

    const muestras = 3;
    let existente = 0;
    let inexistente = 0;
    for (let i = 0; i < muestras; i += 1) {
      existente += await medir(CREDENCIALES.correo);
      inexistente += await medir(`nadie-${i}@monedin.test`);
    }

    const media = (existente + inexistente) / (2 * muestras);
    const diferencia = Math.abs(existente - inexistente) / muestras;

    // Sin igualar el coste, el correo inexistente respondería casi al instante
    // porque no habría hash que calcular, y eso permite enumerar cuentas.
    expect(diferencia).toBeLessThan(media * 0.6);
  }, 60_000);

  it("la credencial no aparece en la respuesta, ni siquiera para su dueño", async () => {
    const response = await login(app, {
      email: CREDENCIALES.correo,
      password: CREDENCIALES.password,
    });

    const cuerpo = JSON.stringify(response.body);
    expect(cuerpo).not.toContain(CREDENCIALES.password);
    expect(cuerpo).not.toContain("passwordHash");
    expect(cuerpo.toLowerCase()).not.toContain("scrypt");
  });

  it("la credencial no aparece en el log de un acceso fallido", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const log = vi.spyOn(console, "log").mockImplementation(() => {});

    await login(app, { email: CREDENCIALES.correo, password: "contraseña-secretísima-x" });

    const registrado = [...error.mock.calls, ...log.mock.calls]
      .map((call) => JSON.stringify(call))
      .join("\n");

    expect(registrado).not.toContain("contraseña-secretísima-x");

    error.mockRestore();
    log.mockRestore();
  });

  it("lo almacenado no permite recuperar la contraseña", async () => {
    const parent = await testPrisma().user.findUniqueOrThrow({
      where: { email: CREDENCIALES.correo },
      select: { passwordHash: true },
    });

    expect(parent.passwordHash).not.toContain(CREDENCIALES.password);
    expect(parent.passwordHash.startsWith("scrypt$")).toBe(true);
  });

  it("dos cuentas con la misma contraseña guardan cosas distintas", async () => {
    await registerParent(app, { email: "otra@monedin.test" });

    const cuentas = await testPrisma().user.findMany({ select: { passwordHash: true } });

    expect(cuentas).toHaveLength(2);
    expect(cuentas[0]?.passwordHash).not.toBe(cuentas[1]?.passwordHash);
  });
});

describe("bloqueo por intentos fallidos", () => {
  beforeEach(async () => {
    await registerParent(app);
  });

  async function fallar(veces: number): Promise<request.Response> {
    let ultima!: request.Response;
    for (let i = 0; i < veces; i += 1) {
      ultima = await login(app, { email: CREDENCIALES.correo, password: `mala-${i}-xxxx` });
    }
    return ultima;
  }

  it("al alcanzar el límite rechaza aunque la contraseña sea correcta", async () => {
    await fallar(PARENT_MAX_FAILED_ATTEMPTS);

    const conLaBuena = await login(app, {
      email: CREDENCIALES.correo,
      password: CREDENCIALES.password,
    });

    expect(conLaBuena.status).toBe(429);
    expect(conLaBuena.body.code).toBe(ERROR_CODES.TOO_MANY_ATTEMPTS);
  }, 120_000);

  it("el bloqueo se distingue de la credencial incorrecta por el código", async () => {
    const incorrecta = await login(app, { email: CREDENCIALES.correo, password: "mala-xxxxx" });
    expect(incorrecta.body.code).toBe(ERROR_CODES.UNAUTHORIZED);

    await fallar(PARENT_MAX_FAILED_ATTEMPTS);
    const bloqueada = await login(app, {
      email: CREDENCIALES.correo,
      password: CREDENCIALES.password,
    });

    expect(bloqueada.body.code).toBe(ERROR_CODES.TOO_MANY_ATTEMPTS);
    expect(bloqueada.body.code).not.toBe(incorrecta.body.code);
  }, 120_000);

  it("acertar antes del límite pone el contador a cero", async () => {
    await fallar(PARENT_MAX_FAILED_ATTEMPTS - 1);

    const acierto = await login(app, {
      email: CREDENCIALES.correo,
      password: CREDENCIALES.password,
    });
    expect(acierto.status).toBe(200);

    const parent = await testPrisma().user.findUniqueOrThrow({
      where: { email: CREDENCIALES.correo },
      select: { failedLoginAttempts: true, lockedUntil: true },
    });
    expect(parent.failedLoginAttempts).toBe(0);
    expect(parent.lockedUntil).toBeNull();
  }, 120_000);

  it("el bloqueo caduca", async () => {
    await fallar(PARENT_MAX_FAILED_ATTEMPTS);

    // Se adelanta el reloj poniendo el bloqueo en el pasado.
    await testPrisma().user.update({
      where: { email: CREDENCIALES.correo },
      data: { lockedUntil: new Date(Date.now() - 1000) },
    });

    const response = await login(app, {
      email: CREDENCIALES.correo,
      password: CREDENCIALES.password,
    });

    expect(response.status).toBe(200);
  }, 120_000);

  it("fallar contra un correo inexistente no delata que no existe", async () => {
    for (let i = 0; i < PARENT_MAX_FAILED_ATTEMPTS + 2; i += 1) {
      const response = await login(app, {
        email: "fantasma@monedin.test",
        password: `mala-${i}-xxxx`,
      });
      // Siempre el mismo 401: nunca un 429 que revelaría que hay una cuenta
      // detrás llevando la cuenta de los intentos.
      expect(response.status).toBe(401);
    }
  }, 120_000);
});

describe("cambio de contraseña", () => {
  const NUEVA = "otra-contraseña-bien-larga";

  it("no se puede cambiar solo con la cuenta, sin perfil elegido", async () => {
    const { accountCookies } = await asParent(app);

    const cambio = await request(app)
      .post(`${API_PREFIX}/auth/password`)
      .set("Cookie", accountCookies)
      .send({ currentPassword: CREDENCIALES.password, newPassword: NUEVA });

    expect(cambio.status).toBe(401);
  }, 60_000);

  it("con la actual correcta funciona y conserva la sesión que lo pidió", async () => {
    const { cookies } = await asParent(app);

    const cambio = await request(app)
      .post(`${API_PREFIX}/auth/password`)
      .set("Cookie", cookies)
      .send({ currentPassword: CREDENCIALES.password, newPassword: NUEVA });

    expect(cambio.status).toBe(204);

    // La sesión que hizo el cambio sigue valiendo.
    const estado = await request(app).get(`${API_PREFIX}/auth/session`).set("Cookie", cookies);
    expect(estado.body.actor?.familyRole).toBe("PARENT");
    expect(estado.body.hasAccount).toBe(true);

    // Y la contraseña nueva es la que sirve.
    await expect(
      login(app, { email: CREDENCIALES.correo, password: NUEVA }).then((r) => r.status),
    ).resolves.toBe(200);
  }, 60_000);

  it("las demás sesiones dejan de valer", async () => {
    const { cookies: primera } = await asParent(app);
    const otra = await login(app, {
      email: CREDENCIALES.correo,
      password: CREDENCIALES.password,
    });
    const segunda = otra.headers["set-cookie"] as unknown as string[];

    await request(app)
      .post(`${API_PREFIX}/auth/password`)
      .set("Cookie", primera)
      .send({ currentPassword: CREDENCIALES.password, newPassword: NUEVA });

    const estadoOtra = await request(app).get(`${API_PREFIX}/auth/session`).set("Cookie", segunda);
    expect(estadoOtra.body).toEqual({ actor: null, hasAccount: false });
  }, 60_000);

  it("con la actual incorrecta se rechaza y la anterior sigue valiendo", async () => {
    const { cookies } = await asParent(app);

    const cambio = await request(app)
      .post(`${API_PREFIX}/auth/password`)
      .set("Cookie", cookies)
      .send({ currentPassword: "no-era-esta-x", newPassword: NUEVA });

    expect(cambio.status).toBe(401);

    await expect(
      login(app, { email: CREDENCIALES.correo, password: CREDENCIALES.password }).then(
        (r) => r.status,
      ),
    ).resolves.toBe(200);
  }, 60_000);

  it("sin sesión no se puede cambiar", async () => {
    await registerParent(app);

    const cambio = await request(app)
      .post(`${API_PREFIX}/auth/password`)
      .send({ currentPassword: CREDENCIALES.password, newPassword: NUEVA });

    expect(cambio.status).toBe(401);
  });
});

describe("identificador del padre", () => {
  it("el correo se guarda normalizado", async () => {
    await registerParent(app, { email: "  Lucia@Monedin.Test  " });

    await expect(parentIdByEmail("lucia@monedin.test")).resolves.toBeTruthy();
  });
});
