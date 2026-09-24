import { readdirSync, readFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { fechaCorta, fechaLarga } from "../../src/lib/dates.js";

const SRC = resolve(process.cwd(), "src");
const DATES = join(SRC, "lib", "dates.ts");

function archivosDe(directorio: string): string[] {
  const encontrados: string[] = [];

  for (const entrada of readdirSync(directorio, { withFileTypes: true })) {
    const ruta = join(directorio, entrada.name);
    if (entrada.isDirectory()) {
      encontrados.push(...archivosDe(ruta));
    } else if (/\.tsx?$/.test(entrada.name)) {
      encontrados.push(ruta);
    }
  }

  return encontrados;
}

const ARCHIVOS = archivosDe(SRC).filter(
  (ruta) => ruta !== DATES && !ruta.endsWith("routeTree.gen.ts"),
);

function sinComentarios(contenido: string): string {
  return contenido.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
}

describe("las fechas las escribe un solo sitio", () => {
  it("ninguna pantalla llama a `toLocaleDateString` por su cuenta", () => {
    const culpables = ARCHIVOS.filter((ruta) =>
      /toLocaleDateString|toLocaleString|DateTimeFormat/.test(
        sinComentarios(readFileSync(ruta, "utf8")),
      ),
    ).map((ruta) => relative(SRC, ruta));

    expect(culpables, "el formato lo decide `lib/dates.ts` y nadie más").toEqual([]);
  });

  it("y las escribe en español, no en el idioma del dispositivo", () => {
    expect(fechaLarga("2026-09-08T10:00:00.000Z")).toBe("8 de septiembre");
    expect(fechaCorta("2026-09-08T10:00:00.000Z")).toBe("8 sept");
  });

  it("y ninguna lleva año", () => {
    for (const escrita of [fechaLarga("2019-01-03T10:00:00.000Z"), fechaCorta("2019-01-03T10:00:00.000Z")]) {
      expect(escrita).not.toMatch(/2019|19/);
    }
  });
});
