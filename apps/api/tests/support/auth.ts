import { API_PREFIX, PARENT_PROFILE_ID } from "@monedin/contracts";
import type { Express } from "express";
import request from "supertest";
import { testPrisma } from "./database.js";

/**
 * Soporte para los tests de autenticación y rejilla.
 *
 * Estos tests NO pueden usar `withRollback`: llaman a la app con supertest, y
 * la app abre sus propias transacciones. Así que limpian por truncado, que
 * además no dispara los triggers de fila y por tanto no choca con la
 * inmutabilidad del historial.
 *
 * OJO con la diferencia entre los dos ayudantes de acceso:
 *
 *   `registerParent`  deja la CUENTA acreditada y ningún perfil activo.
 *                     Es el estado de la rejilla.
 *   `asParent`        deja además el perfil del padre activo.
 *                     Es lo que hace falta para operar.
 *
 * Antes de `add-profile-selection` bastaba lo primero; ahora no, y esa es
 * exactamente la frontera que el change añade.
 */

export async function resetAuthData(): Promise<void> {
  await testPrisma().$executeRawUnsafe(
    `TRUNCATE TABLE users, child_profiles, sessions, tasks, rewards,
       reward_assignments, reward_redemptions, coin_transactions
     RESTART IDENTITY CASCADE`,
  );
}

export const CREDENCIALES = {
  nombre: "Lucía Ramírez",
  correo: "lucia@monedin.test",
  password: "una-contraseña-decente",
  pin: "2468",
} as const;

export const ACCOUNT_COOKIE = "monedin_session";
export const PROFILE_COOKIE = "monedin_profile";

export function cookiesOf(response: request.Response): string[] {
  const raw = response.headers["set-cookie"];
  if (raw === undefined) return [];
  return Array.isArray(raw) ? raw : [raw];
}

/**
 * Las cookies que la respuesta deja PUESTAS, descartando las que borra.
 *
 * Importa más de lo que parece: acceder emite a la vez `monedin_session=<token>`
 * y un borrado de `monedin_profile`. Si se concatena la lista cruda y luego se
 * añade una cookie de perfil, el navegador simulado ve dos entradas con el
 * mismo nombre y se queda con la vacía.
 */
export function liveCookies(response: request.Response): string[] {
  return cookiesOf(response).filter((cookie) => {
    const [pair] = cookie.split(";");
    const [, value] = (pair ?? "").split("=");
    return value !== undefined && value !== "";
  });
}

/** Valor de una cookie concreta, o undefined si se está borrando. */
export function cookieValue(response: request.Response, name: string): string | undefined {
  for (const cookie of cookiesOf(response)) {
    const [pair] = cookie.split(";");
    const [key, value] = (pair ?? "").split("=");
    if (key === name) {
      return value === undefined || value === "" ? undefined : value;
    }
  }
  return undefined;
}

/** Si la respuesta pide al navegador borrar esa cookie. */
export function clearsCookie(response: request.Response, name: string): boolean {
  return cookiesOf(response).some(
    (cookie) => cookie.startsWith(`${name}=;`) || cookie.startsWith(`${name}=Thu, 01 Jan 1970`),
  );
}

/**
 * Registra un padre. Deja la CUENTA acreditada y NINGÚN perfil activo.
 *
 * Con estas cookies se llega a la rejilla, no se opera.
 */
export async function registerParent(
  app: Express,
  overrides: { name?: string; email?: string; password?: string; pin?: string } = {},
): Promise<{ cookies: string[]; body: Record<string, unknown> }> {
  const response = await request(app)
    .post(`${API_PREFIX}/auth/register`)
    .send({
      name: overrides.name ?? CREDENCIALES.nombre,
      email: overrides.email ?? CREDENCIALES.correo,
      password: overrides.password ?? CREDENCIALES.password,
      pin: overrides.pin ?? CREDENCIALES.pin,
    });

  if (response.status !== 201) {
    throw new Error(`El registro falló: ${response.status} ${JSON.stringify(response.body)}`);
  }

  return { cookies: liveCookies(response), body: response.body as Record<string, unknown> };
}

/** Activa un perfil sobre unas cookies de cuenta. Devuelve las dos cookies. */
export async function enterProfile(
  app: Express,
  accountCookies: string[],
  profileId: string,
  pin: string,
): Promise<string[]> {
  const response = await request(app)
    .post(`${API_PREFIX}/auth/profiles/enter`)
    .set("Cookie", accountCookies)
    .send({ profileId, pin });

  if (response.status !== 200) {
    throw new Error(`No se pudo entrar al perfil: ${response.status} ${JSON.stringify(response.body)}`);
  }

  const profileCookie = cookieValue(response, PROFILE_COOKIE);
  if (profileCookie === undefined) {
    throw new Error("La entrada no emitió cookie de perfil");
  }

  return [...accountCookies, `${PROFILE_COOKIE}=${profileCookie}`];
}

/**
 * Registra un padre Y activa su perfil. Lo que hace falta para operar.
 *
 * Devuelve también las cookies de solo cuenta, porque muchos tests necesitan
 * comprobar justo la diferencia entre tener cuenta y tener perfil.
 */
export async function asParent(
  app: Express,
  overrides: { name?: string; email?: string; password?: string; pin?: string } = {},
): Promise<{ cookies: string[]; accountCookies: string[]; parentId: string }> {
  const { cookies: accountCookies } = await registerParent(app, overrides);
  const pin = overrides.pin ?? CREDENCIALES.pin;

  return {
    cookies: await enterProfile(app, accountCookies, PARENT_PROFILE_ID, pin),
    accountCookies,
    parentId: await parentIdByEmail(overrides.email ?? CREDENCIALES.correo),
  };
}

/** Accede con correo y contraseña. Acredita la cuenta, sin perfil. */
export function login(
  app: Express,
  credentials: { email: string; password: string },
): request.Test {
  return request(app).post(`${API_PREFIX}/auth/login`).send(credentials);
}

/** Crea un perfil de hijo directamente en la base, con su PIN ya hasheado. */
export async function createChildProfile(
  parentId: string,
  options: { name?: string; pin?: string; coins?: number; avatar?: string } = {},
): Promise<{ id: string; name: string; pin: string }> {
  const { hashCredential } = await import("../../src/shared/crypto/credentials.js");
  const pin = options.pin ?? "1234";

  const child = await testPrisma().childProfile.create({
    data: {
      name: options.name ?? "Mateo",
      pinHash: await hashCredential(pin),
      coins: options.coins ?? 0,
      ...(options.avatar === undefined ? {} : { avatar: options.avatar }),
      parentId,
    },
    select: { id: true, name: true },
  });

  return { ...child, pin };
}

export async function parentIdByEmail(email: string): Promise<string> {
  const parent = await testPrisma().user.findUniqueOrThrow({
    where: { email: email.toLowerCase() },
    select: { id: true },
  });
  return parent.id;
}
