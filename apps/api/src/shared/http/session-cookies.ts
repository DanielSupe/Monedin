import { CHILD_SESSION_COOKIE, PARENT_SESSION_COOKIE } from "@monedin/contracts";
import type { Request, Response } from "express";
import { getConfig } from "../../config/index.js";

/**
 * Las dos cookies de sesión.
 *
 * La del padre está siempre mientras no cierre; la del niño se pone encima
 * mientras está dentro. Salir del perfil del niño es borrar una cookie: la
 * sesión del padre nunca se tocó, así que no hay nada que restaurar. Ver la
 * decisión 1 del design de `add-authentication`.
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

export function setParentSessionCookie(res: Response, token: string, expiresAt: Date): void {
  res.cookie(PARENT_SESSION_COOKIE, token, { ...baseOptions(), expires: expiresAt });
}

export function setChildSessionCookie(res: Response, token: string, expiresAt: Date): void {
  res.cookie(CHILD_SESSION_COOKIE, token, { ...baseOptions(), expires: expiresAt });
}

export function clearParentSessionCookie(res: Response): void {
  // Las opciones tienen que coincidir con las de emisión o el navegador no la
  // borra: se quedaría una cookie que no vale y confunde al front.
  res.clearCookie(PARENT_SESSION_COOKIE, baseOptions());
}

export function clearChildSessionCookie(res: Response): void {
  res.clearCookie(CHILD_SESSION_COOKIE, baseOptions());
}

export function readParentSessionCookie(req: Request): string | undefined {
  return readCookie(req, PARENT_SESSION_COOKIE);
}

export function readChildSessionCookie(req: Request): string | undefined {
  return readCookie(req, CHILD_SESSION_COOKIE);
}

function readCookie(req: Request, name: string): string | undefined {
  const cookies = (req as { cookies?: Record<string, unknown> }).cookies;
  const value = cookies?.[name];

  return typeof value === "string" && value.length > 0 ? value : undefined;
}
