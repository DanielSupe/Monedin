import { API_PREFIX } from "@monedin/contracts";
import type { Express } from "express";
import request from "supertest";
import { testPrisma } from "./database.js";

/**
 * Soporte para los tests de autenticación.
 *
 * Estos tests NO pueden usar `withRollback`: llaman a la app con supertest, y
 * la app abre sus propias transacciones. Así que limpian por truncado, que
 * además no dispara los triggers de fila y por tanto no choca con la
 * inmutabilidad del historial.
 */

/** Deja la base de tests sin usuarios, perfiles ni sesiones. */
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
} as const;

/** Cookies de una respuesta, en la forma que espera supertest. */
export function cookiesOf(response: request.Response): string[] {
  const raw = response.headers["set-cookie"];
  if (raw === undefined) return [];
  return Array.isArray(raw) ? raw : [raw];
}

/** Extrae el valor de una cookie concreta, o undefined si se está borrando. */
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

/** Registra un padre a través de la API y devuelve sus cookies. */
export async function registerParent(
  app: Express,
  overrides: { name?: string; email?: string; password?: string } = {},
): Promise<{ cookies: string[]; body: Record<string, unknown> }> {
  const response = await request(app)
    .post(`${API_PREFIX}/auth/register`)
    .send({
      name: overrides.name ?? CREDENCIALES.nombre,
      email: overrides.email ?? CREDENCIALES.correo,
      password: overrides.password ?? CREDENCIALES.password,
    });

  if (response.status !== 201) {
    throw new Error(`El registro falló: ${response.status} ${JSON.stringify(response.body)}`);
  }

  return { cookies: cookiesOf(response), body: response.body as Record<string, unknown> };
}

/** Accede con correo y contraseña, devolviendo la respuesta cruda. */
export function login(
  app: Express,
  credentials: { email: string; password: string },
): request.Test {
  return request(app).post(`${API_PREFIX}/auth/login`).send(credentials);
}

/** Crea un perfil de hijo directamente en la base, con su PIN ya hasheado. */
export async function createChildProfile(
  parentId: string,
  options: { name?: string; pin?: string; coins?: number } = {},
): Promise<{ id: string; name: string; pin: string }> {
  const { hashCredential } = await import("../../src/shared/crypto/credentials.js");
  const pin = options.pin ?? "1234";

  const child = await testPrisma().childProfile.create({
    data: {
      name: options.name ?? "Mateo",
      pinHash: await hashCredential(pin),
      coins: options.coins ?? 0,
      parentId,
    },
    select: { id: true, name: true },
  });

  return { ...child, pin };
}

/** Identificador del padre recién registrado, leído de la base. */
export async function parentIdByEmail(email: string): Promise<string> {
  const parent = await testPrisma().user.findUniqueOrThrow({
    where: { email: email.toLowerCase() },
    select: { id: true },
  });
  return parent.id;
}
