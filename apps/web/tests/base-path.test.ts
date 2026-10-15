import { API_PREFIX } from "@monedin/contracts";
import { afterEach, describe, expect, it, vi } from "vitest";
import type * as basePathModule from "../src/lib/base-path.js";
import { normalizeBasePath } from "../src/lib/base-path.js";

async function cargarCon(base: string): Promise<typeof basePathModule> {
  vi.stubGlobal("__WEB_BASE_PATH__", base);
  vi.resetModules();
  return import("../src/lib/base-path.js");
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe("normalización de la ruta base", () => {
  it("sin valor, la base es la raíz", () => {
    expect(normalizeBasePath(undefined)).toBe("/");
    expect(normalizeBasePath("")).toBe("/");
    expect(normalizeBasePath("  ")).toBe("/");
  });

  it("la barra final no cambia el resultado", () => {
    expect(normalizeBasePath("/monedin")).toBe("/monedin/");
    expect(normalizeBasePath("/monedin/")).toBe("/monedin/");
  });

  it("rechaza una base que no empieza por barra, nombrando la variable", () => {
    expect(() => normalizeBasePath("monedin")).toThrow(/WEB_BASE_PATH/);
  });

  it("rechaza una base con doble barra, que el navegador leería como otro dominio", () => {
    expect(() => normalizeBasePath("//otro.dominio")).toThrow(/WEB_BASE_PATH/);
  });
});

describe("lo que se deriva de la base", () => {
  it("fuera de una compilación de Vite, todo cuelga de la raíz", async () => {
    vi.resetModules();
    const modulo = await import("../src/lib/base-path.js");

    expect(modulo.BASE_PATH).toBe("/");
    expect(modulo.ROUTER_BASEPATH).toBe("/");
    expect(modulo.apiUrl("/health")).toBe(`${API_PREFIX}/health`);
  });

  it("con una base declarada, el router y la API cuelgan de ella", async () => {
    const modulo = await cargarCon("/monedin");

    expect(modulo.BASE_PATH).toBe("/monedin/");
    expect(modulo.ROUTER_BASEPATH).toBe("/monedin");
    expect(modulo.apiUrl("/health")).toBe(`/monedin${API_PREFIX}/health`);
  });
});
