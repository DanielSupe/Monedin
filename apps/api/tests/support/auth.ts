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
  options: { name?: string; pin?: string; coins?: number; avatar?: string; age?: number } = {},
): Promise<{ id: string; name: string; pin: string }> {
  const { hashCredential } = await import("../../src/shared/crypto/credentials.js");
  const pin = options.pin ?? "1234";

  const child = await testPrisma().childProfile.create({
    data: {
      name: options.name ?? "Mateo",
      pinHash: await hashCredential(pin),
      coins: options.coins ?? 0,
      ...(options.avatar === undefined ? {} : { avatar: options.avatar }),
      ...(options.age === undefined ? {} : { age: options.age }),
      parentId,
    },
    select: { id: true, name: true },
  });

  return { ...child, pin };
}

/**
 * Registra un padre, le crea un hijo y ENTRA al perfil de ese hijo.
 *
 * Es el equivalente de `asParent` para el otro rol. Devuelve también las
 * cookies de solo cuenta y las del padre, porque casi todo test de niño acaba
 * comprobando la frontera contra uno de esos dos estados.
 */
export async function asChild(
  app: Express,
  options: {
    childName?: string;
    childPin?: string;
    coins?: number;
    avatar?: string;
    age?: number;
    email?: string;
  } = {},
): Promise<{
  cookies: string[];
  accountCookies: string[];
  parentId: string;
  childId: string;
  childPin: string;
}> {
  // NO se devuelven las cookies del padre a propósito: entrar al perfil del
  // niño revoca el perfil activo de esa misma sesión de cuenta, porque nunca
  // hay dos a la vez. Devolverlas sería entregar unas cookies muertas. Un test
  // que necesite al padre Y al niño a la vez tiene que simular DOS dispositivos,
  // es decir, dos sesiones de cuenta distintas con `login`.
  const { accountCookies, parentId } = await asParent(app, {
    ...(options.email === undefined ? {} : { email: options.email }),
  });

  const child = await createChildProfile(parentId, {
    name: options.childName ?? "Mateo",
    pin: options.childPin ?? "1234",
    ...(options.coins === undefined ? {} : { coins: options.coins }),
    ...(options.avatar === undefined ? {} : { avatar: options.avatar }),
    ...(options.age === undefined ? {} : { age: options.age }),
  });

  return {
    cookies: await enterProfile(app, accountCookies, child.id, child.pin),
    accountCookies,
    parentId,
    childId: child.id,
    childPin: child.pin,
  };
}

/**
 * Un segundo dispositivo para la misma cuenta, con el perfil del padre activo.
 *
 * Accede otra vez con correo y contraseña, lo que abre una sesión de CUENTA
 * nueva e independiente. Es lo que hace falta para probar escenarios donde un
 * perfil sigue abierto en un sitio mientras se opera desde otro: dentro de una
 * misma sesión de cuenta eso es imposible por diseño.
 */
export async function parentOnSecondDevice(
  app: Express,
  credentials: { email?: string; password?: string; pin?: string } = {},
): Promise<string[]> {
  const response = await login(app, {
    email: credentials.email ?? CREDENCIALES.correo,
    password: credentials.password ?? CREDENCIALES.password,
  });

  if (response.status !== 200) {
    throw new Error(`El acceso falló: ${response.status} ${JSON.stringify(response.body)}`);
  }

  return enterProfile(
    app,
    liveCookies(response),
    PARENT_PROFILE_ID,
    credentials.pin ?? CREDENCIALES.pin,
  );
}

/**
 * Una familia con varios hijos ya creados, para los tests de listado,
 * paginación y aislamiento entre hermanos.
 *
 * Los hijos se crean EN SERIE y no con `Promise.all`, para que su `createdAt`
 * respete el orden de los nombres. Los tests de orden estable que necesitan lo
 * contrario —varias filas en el mismo instante— fuerzan la fecha a mano.
 */
export async function familiaConHijos(
  app: Express,
  nombres: string[],
  overrides: { email?: string } = {},
): Promise<{
  cookies: string[];
  accountCookies: string[];
  parentId: string;
  hijos: Array<{ id: string; name: string; pin: string }>;
}> {
  const { cookies, accountCookies, parentId } = await asParent(app, {
    ...(overrides.email === undefined ? {} : { email: overrides.email }),
  });

  const hijos: Array<{ id: string; name: string; pin: string }> = [];
  for (const [indice, name] of nombres.entries()) {
    hijos.push(
      await createChildProfile(parentId, { name, pin: String(1000 + indice).padStart(4, "0") }),
    );
  }

  return { cookies, accountCookies, parentId, hijos };
}

export async function parentIdByEmail(email: string): Promise<string> {
  const parent = await testPrisma().user.findUniqueOrThrow({
    where: { email: email.toLowerCase() },
    select: { id: true },
  });
  return parent.id;
}
