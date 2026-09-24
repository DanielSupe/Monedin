import { ACCOUNT_SESSION_COOKIE, PROFILE_SESSION_COOKIE } from "@monedin/contracts";
import type { Request, Response } from "express";
import { getConfig } from "../../config/index.js";

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
    httpOnly: true,

    sameSite: "lax",

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
