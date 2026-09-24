import { API_PREFIX, PARENT_PROFILE_ID } from "@monedin/contracts";
import type { Express } from "express";
import request from "supertest";
import { testPrisma } from "./database.js";

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

export function liveCookies(response: request.Response): string[] {
  return cookiesOf(response).filter((cookie) => {
    const [pair] = cookie.split(";");
    const [, value] = (pair ?? "").split("=");
    return value !== undefined && value !== "";
  });
}

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

export function clearsCookie(response: request.Response, name: string): boolean {
  return cookiesOf(response).some(
    (cookie) => cookie.startsWith(`${name}=;`) || cookie.startsWith(`${name}=Thu, 01 Jan 1970`),
  );
}

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

export function login(
  app: Express,
  credentials: { email: string; password: string },
): request.Test {
  return request(app).post(`${API_PREFIX}/auth/login`).send(credentials);
}

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
