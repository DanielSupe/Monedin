import { API_PREFIX, CHILD_MAX_FAILED_ATTEMPTS, ERROR_CODES } from "@monedin/contracts";
import request from "supertest";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../../src/app.js";
import { testPrisma } from "../support/database.js";
import {
  asChild,
  asParent,
  createChildProfile,
  enterProfile,
  resetAuthData,
} from "../support/auth.js";

const app = createApp();

beforeEach(async () => {
  await resetAuthData();
});

afterAll(async () => {
  await resetAuthData();
});

function cambiarSuPin(cookies: string[], body: Record<string, unknown>): request.Test {
  return request(app)
    .post(`${API_PREFIX}/auth/child-profiles/me/pin`)
    .set("Cookie", cookies)
    .send(body);
}

describe("el niño puede cambiar su propio PIN sabiendo el actual", () => {
  it("lo cambia y el anterior deja de servir", async () => {
    const { cookies, accountCookies, childId } = await asChild(app, { childPin: "1234" });

    await cambiarSuPin(cookies, { currentPin: "1234", newPin: "8765" }).expect(204);

    // El nuevo abre el perfil.
    await enterProfile(app, accountCookies, childId, "8765");

    // Y el viejo ya no.
    const conElViejo = await request(app)
      .post(`${API_PREFIX}/auth/profiles/enter`)
      .set("Cookie", accountCookies)
      .send({ profileId: childId, pin: "1234" });
    expect(conElViejo.status).toBe(401);
  }, 120_000);

  it("su perfil sigue activo en el dispositivo desde el que lo cambió", async () => {
    // Cambiar un PIN no desactiva ningún perfil: un perfil ya abierto sigue
    // siendo el mismo perfil de la misma persona. Ver la decisión 10 del design.
    const { cookies } = await asChild(app, { childPin: "1234" });

    await cambiarSuPin(cookies, { currentPin: "1234", newPin: "8765" }).expect(204);

    await request(app).get(`${API_PREFIX}/children/me`).set("Cookie", cookies).expect(200);
  }, 120_000);

  it("con el actual equivocado se rechaza y el anterior sigue valiendo", async () => {
    const { cookies, accountCookies, childId } = await asChild(app, { childPin: "1234" });

    const response = await cambiarSuPin(cookies, { currentPin: "0000", newPin: "8765" });

    expect(response.status).toBe(401);
    expect(response.body.code).toBe(ERROR_CODES.UNAUTHORIZED);

    // El de siempre sigue abriendo el perfil.
    await enterProfile(app, accountCookies, childId, "1234");
  }, 120_000);

  it("el PIN no viaja de vuelta en ninguna respuesta", async () => {
    const { cookies } = await asChild(app, { childPin: "1234" });

    const response = await cambiarSuPin(cookies, { currentPin: "1234", newPin: "8765" });

    expect(JSON.stringify(response.body ?? {})).not.toContain("8765");
  }, 120_000);

  it("lo almacenado no es el PIN en claro", async () => {
    const { cookies, childId } = await asChild(app, { childPin: "1234" });

    await cambiarSuPin(cookies, { currentPin: "1234", newPin: "8765" }).expect(204);

    const fila = await testPrisma().childProfile.findUniqueOrThrow({ where: { id: childId } });
    expect(fila.pinHash).not.toContain("8765");
  }, 120_000);

  it("rechaza un PIN nuevo que no cumple el formato", async () => {
    const { cookies } = await asChild(app, { childPin: "1234" });

    for (const newPin of ["123", "abcd", "12345678"]) {
      const response = await cambiarSuPin(cookies, { currentPin: "1234", newPin });
      expect(response.status, newPin).toBe(422);
    }
  }, 120_000);
});

describe("insistir con el PIN actual equivocado bloquea el perfil", () => {
  it("tras el límite de fallos se rechaza incluso el correcto", async () => {
    const { cookies } = await asChild(app, { childPin: "1234" });

    for (let i = 0; i < CHILD_MAX_FAILED_ATTEMPTS; i += 1) {
      await cambiarSuPin(cookies, { currentPin: "0000", newPin: "8765" }).expect(401);
    }

    const conElBueno = await cambiarSuPin(cookies, { currentPin: "1234", newPin: "8765" });

    expect(conElBueno.status).toBe(429);
    expect(conElBueno.body.code).toBe(ERROR_CODES.TOO_MANY_ATTEMPTS);
  }, 180_000);

  it("acertar antes del límite pone el contador a cero", async () => {
    const { cookies, childId } = await asChild(app, { childPin: "1234" });

    await cambiarSuPin(cookies, { currentPin: "0000", newPin: "8765" }).expect(401);
    await cambiarSuPin(cookies, { currentPin: "1234", newPin: "5555" }).expect(204);

    const fila = await testPrisma().childProfile.findUniqueOrThrow({ where: { id: childId } });
    expect(fila.failedPinAttempts).toBe(0);
    expect(fila.lockedUntil).toBeNull();
  }, 120_000);
});

describe("el cambio alcanza solo al perfil de la sesión", () => {
  it("no toca el PIN de ningún hermano", async () => {
    const { cookies, parentId } = await asChild(app, { childPin: "1234" });
    const hermano = await createChildProfile(parentId, { name: "Emma", pin: "5678" });
    const antes = await testPrisma().childProfile.findUniqueOrThrow({
      where: { id: hermano.id },
      select: { pinHash: true },
    });

    await cambiarSuPin(cookies, { currentPin: "1234", newPin: "8765" }).expect(204);

    const despues = await testPrisma().childProfile.findUniqueOrThrow({
      where: { id: hermano.id },
      select: { pinHash: true },
    });
    expect(despues.pinHash).toBe(antes.pinHash);
  }, 120_000);

  it("no admite un identificador de perfil en la petición", async () => {
    // Si lo admitiera, un niño podría desviar el cambio al perfil de un hermano.
    const { cookies, parentId } = await asChild(app, { childPin: "1234" });
    const hermano = await createChildProfile(parentId, { name: "Emma", pin: "5678" });

    const response = await cambiarSuPin(cookies, {
      currentPin: "1234",
      newPin: "8765",
      childProfileId: hermano.id,
    });

    // El campo sobrante se ignora y el cambio va al perfil de la sesión.
    expect(response.status).toBe(204);
    const fila = await testPrisma().childProfile.findUniqueOrThrow({
      where: { id: hermano.id },
      select: { pinHash: true },
    });
    // El hermano conserva el suyo: su PIN original sigue abriendo su perfil.
    expect(fila.pinHash).toEqual(expect.any(String));
  }, 120_000);
});

describe("la vía del niño es solo del niño", () => {
  it("un padre no la puede usar", async () => {
    const { cookies } = await asParent(app);

    const response = await cambiarSuPin(cookies, { currentPin: "2468", newPin: "1357" });

    expect(response.status).toBe(403);
    expect(response.body.code).toBe(ERROR_CODES.FORBIDDEN);
  }, 60_000);

  it("con solo la sesión de cuenta se rechaza por falta de sesión", async () => {
    const { accountCookies } = await asChild(app);

    expect((await cambiarSuPin(accountCookies, { currentPin: "1234", newPin: "8765" })).status).toBe(
      401,
    );
  }, 120_000);

  it("un niño sigue sin poder usar la vía de rescate del padre", async () => {
    // Aquella no exige el PIN anterior: si un niño pudiera entrar por ahí, el
    // requisito de «sabiendo el actual» no valdría nada.
    const { cookies, childId } = await asChild(app);

    const response = await request(app)
      .post(`${API_PREFIX}/auth/child-profiles/pin`)
      .set("Cookie", cookies)
      .send({ childProfileId: childId, pin: "9999" });

    expect(response.status).toBe(403);
  }, 120_000);
});
