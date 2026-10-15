import { API_PREFIX } from "@monedin/contracts";

declare const __WEB_BASE_PATH__: string | undefined;

export function normalizeBasePath(raw: string | undefined): string {
  const value = (raw ?? "").trim();

  if (value === "") return "/";

  if (!value.startsWith("/") || value.startsWith("//")) {
    throw new Error(
      `WEB_BASE_PATH tiene que empezar por una sola "/", como /monedin (recibido: ${value})`,
    );
  }

  return value.endsWith("/") ? value : `${value}/`;
}

export const BASE_PATH = normalizeBasePath(
  typeof __WEB_BASE_PATH__ === "string" ? __WEB_BASE_PATH__ : undefined,
);

export const ROUTER_BASEPATH = BASE_PATH === "/" ? "/" : BASE_PATH.slice(0, -1);

export function apiUrl(path: string): string {
  return `${BASE_PATH.slice(0, -1)}${API_PREFIX}${path}`;
}
