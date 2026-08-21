import { ACCOUNT_SESSION_COOKIE, PROFILE_SESSION_COOKIE } from "@monedin/contracts";
import type { Request, Response } from "express";
import { getConfig } from "../../config/index.js";

/**
 * Las dos cookies.
 *
 * La de CUENTA acredita que el dispositivo pertenece a esta familia y no
 * concede poderes por sí sola. La de PERFIL dice quién está usando el
 * dispositivo ahora mismo, y es la que da el actor.
 *
 * Salir de un perfil es borrar la segunda: la de cuenta nunca se toca, así que
 * elegir otro no exige la contraseña. Ver la decisión 1 del design de
 * `add-profile-selection`.
 */

interface CookieOptions {
  httpOnly: true;
  sameSite: "lax";
  secure: boolean;
  path: string;
  expires?: Date;
}

function baseOptions(): CookieOptions {
  const { NODE_ENV } = getConfig();

  return {
    // Inaccesible desde JavaScript: un XSS no puede leer la sesión.
    httpOnly: true,
    // Mismo sitio: el navegador no la manda desde otro origen.
    sameSite: "lax",
    // Fuera de desarrollo, solo por conexión segura. En desarrollo no se puede
    // exigir porque `localhost` va por HTTP.
    secure: NODE_ENV !== "development",
    path: "/",
  };
}

export function setAccountSessionCookie(res: Response, token: string, expiresAt: Date): void {
  res.cookie(ACCOUNT_SESSION_COOKIE, token, { ...baseOptions(), expires: expiresAt });
}

export function setProfileSessionCookie(res: Response, token: string, expiresAt: Date): void {
  res.cookie(PROFILE_SESSION_COOKIE, token, { ...baseOptions(), expires: expiresAt });
}

export function clearAccountSessionCookie(res: Response): void {
  // Las opciones tienen que coincidir con las de emisión o el navegador no la
  // borra: se quedaría una cookie que no vale y confunde al front.
  res.clearCookie(ACCOUNT_SESSION_COOKIE, baseOptions());
}

export function clearProfileSessionCookie(res: Response): void {
  res.clearCookie(PROFILE_SESSION_COOKIE, baseOptions());
}

export function readAccountSessionCookie(req: Request): string | undefined {
  return readCookie(req, ACCOUNT_SESSION_COOKIE);
}

export function readProfileSessionCookie(req: Request): string | undefined {
  return readCookie(req, PROFILE_SESSION_COOKIE);
}

function readCookie(req: Request, name: string): string | undefined {
  const cookies = (req as { cookies?: Record<string, unknown> }).cookies;
  const value = cookies?.[name];

  return typeof value === "string" && value.length > 0 ? value : undefined;
}
